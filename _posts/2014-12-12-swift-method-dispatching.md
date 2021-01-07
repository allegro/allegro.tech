---
layout: post
title: Swift Method Dispatching — a summary of my talk at Swift Warsaw
author: kamil.borzym
tags: [tech,swift, runtime, vtable, virtual, method, table, dispatching]
---

Two weeks ago, I attended [Swift Warsaw](http://swiftwarsaw.com/) as a speaker, holding a presentation on "Swift Runtime
— Swift Method Dispatching". I promised to summarise the talk in an article, so hereby I keep my promise.

## Swift Method Dispatching

When announcing [Swift](https://developer.apple.com/swift/), Apple described it as being much faster than Objective-C.
On the web, there is a number of [comparsions](http://www.jessesquires.com/apples-to-apples-part-two/) juxtaposing speed
of both languages. In my opinion, the way Swift dispatches method invocations has the biggest impact on its performance.

![WWDC 2014]({% link /img/articles/wwdc.jpg %})

Leaving the assessment of method dispatch performance aside, let’s focus on understanding how it works in Swift.

Before looking into the Swift method dispatching, it is worth making a short recollection of the Objective-C method
dispatching.

### Objective-C Method Dispatching

During the compilation process, Clang translates each method invocation into a call to the `objc_msgSend` function (or
one of its variations), passing an object, method selector and parameters as arguments.

For example, the `[object message: param]` invocation gets translated into the following call: `objc_msgSend(object,
@selector(message:), param, nil)`.

Basically, the `objc_msgSend` functions family handles method dispatching in Objective-C. These functions are
implemented in the assembly language and
[opensourced](http://www.opensource.apple.com/source/objc4/objc4-646/runtime/Messengers.subproj/). Let's not go deeper
into Apple sources, but instead try to understand how the `objc_msgSend` function works by looking at the following
pseudo-code:

```objc
id objc_msgSend ( id obj, SEL op, ... )
{
    Class c = object_getClass(obj);
    IMP imp = CacheLookup(c, op);
    if (!imp) {
        imp = class_getMethodImplementation(c, op);
    }
    jump imp(obj, op, ...);
}
```

First, it obtains a class of the passed `obj` object (this runs in constant time).

```objc
    Class c = object_getClass(obj);
```

Then, it tries to look for a method implementation in a class cache.

```objc
    IMP imp = CacheLookup(c, op);
```

Finding a selector in the cache is a relatively fast operation — as fast as a look-up in the hashmap. However, in the
case of cache miss, the program has to take a slower path and call `class_getMethodImplementation`, which looks for
implementation by scanning all the selectors defined in the class and its ancestors, down to the root of the inheritance
tree.

```objc
    if (!imp) {
        imp = class_getMethodImplementation(c, op);
    }
```

This method is relatively slow.

Finally, `objc_msgSend` cleans a stack frame and jumps directly to the method implementation, passing the object, method
selector and parameters (that is why `objc_msgSend` is often called a trampoline rather than a function).

```objc
    jump imp(obj, op, ...);
```

Before looking at the Swift method dispatching, let's get familiar with two important notions.

### Name Mangling

Swift allows a programmer to define many entities with the same name, e.g. the same class names in different modules or
the same method names in different classes. Moreover, Swift allows method overloading. Linker resolves external
references by symbols names, when combining object files. That is why, the compiler needs to produce unique symbol names
and does it by encoding every entity name. This process of name encoding is called [name
mangling](http://en.wikipedia.org/wiki/Name_mangling).

Let's take a look at an example of Swift method signatures and corresponding mangled symbol names:

```swift
Matrix.AIProgram.speak (Matrix.AIProgram)(Swift.String) -> ()
Matrix.AIProgram.speak (Matrix.AIProgram)(Swift.Int) -> ()
```

They are defined in the same class and have the same name, so we deal with a simple example of method overloading. It is
worth noting, that Swift method takes an object instance as a first argument to use it as a `self` pointer (you can read
more about this on [Ole Begemann's blog](http://oleb.net/blog/2014/07/swift-instance-methods-curried-functions/)).

Now, take a look at symbol names being a result of mangling the above signatures:

```objc
_TFC6Matrix9AIProgram5speakfS0_FSST_
_TFC6Matrix9AIProgram5speakfS0_FSiT_
```

The first method takes a string type parameter marked as `S` in the first symbol. The second method takes an int type
parameter marked as `i` in the second symbol.

Obviously, the above should not give any reason for concern in the everyday development work. But when there is a need,
a symbol can be easily demangled using this handy command passing the symbol as a parameter:

```bash
xcrun swift-demangle SYMBOL_NAME
```

If you would like to read more about method mangling, there is no better article than the one on the
[NSBlog](https://mikeash.com/pyblog/friday-qa-2014-08-15-swift-name-mangling.html).

Before diving into the Swift method dispatching, let's take a look at one more thing. Namely, let's see how Swift
compiler translates a code into a binary executable.

### Compilation

Swift compilation consists of several phases.

![Swift Compilation Phases]({% link /img/articles/swiftc.png %})

At first, a Swift Front End translates a Swift code into a high-level, platform agnostic _SIL_ (Swift Intermediate
Language). Everyone can examine _SIL_ using the `swiftc --emit-sil` command. Secondly, a SIL Optimizer takes _SIL_,
optimises it on a high-level of abstraction and provides an output in the _IR_ (Intermediate Representation) format,
which is low-level, yet platform agnostic. _IR_ can be examined using the `swift --emit-ir` command. Then, _IR_ is
optimized. In the last phase, a Code Generator uses the optimised _IR_ to generate a machine code. Anyone can view the
output of this phase in the assembly language by using the `swift -S` command.

Again, all you need to be aware of is that there are a couple of phases and that you can use an early phase output to
analyse a program code. If you wish to read more about Swift compilation, please refer to [John Siracusa's
article](http://arstechnica.com/apple/2014/10/os-x-10-10/22/).

Now, let's get to the the point...

### Virtual Method Table

[Virtual Method Table](http://en.wikipedia.org/wiki/Virtual_method_table) is a mechanism used in Swift and many other
languages to support run time method binding. We are going to investigate what it looks like in Swift.

Let's take the following two classes:

```swift
// module Test

class Agent {
  func punch()
  func kick()
  func jump()
  final func block()
}

class Smith : Agent {
  override func jump()
  func laugh()
}
```

They present an `Agent` class able to perform some basic Kung Fu moves: punch, kick, jump and block. For the sake of
this example, let's assume that the `Agent`'s defence mechanism cannot be overridden (`block` method declared as final).
Then, we have an agent `Smith` subclass, which overrides the `jump` method — let's assume that `Smith` jumps a bit
differently than other agents. Furthermore `Smith` can laugh (evilly but still).

Now, let's take a look at the following snippet from the generated _SIL_ code:

```
sil_vtable Agent {
  #Agent.punch!1: _TFC4Test5Agent5punchfS0_FT_T_  // Test.Agent.punch (Test.Agent)() -> ()
  #Agent.kick!1: _TFC4Test5Agent4kickfS0_FT_T_  // Test.Agent.kick (Test.Agent)() -> ()
  #Agent.jump!1: _TFC4Test5Agent4jumpfS0_FT_T_  // Test.Agent.jump (Test.Agent)() -> ()
  #Agent.init!initializer.1: _TFC4Test5AgentcfMS0_FT_S0_  // Test.Agent.init (Test.Agent.Type)() -> Test.Agent
}

sil_vtable Smith {
  #Agent.punch!1: _TFC4Test5Agent5punchfS0_FT_T_  // Test.Agent.punch (Test.Agent)() -> ()
  #Agent.kick!1: _TFC4Test5Agent4kickfS0_FT_T_  // Test.Agent.kick (Test.Agent)() -> ()
  #Agent.jump!1: _TFC4Test5Smith4jumpfS0_FT_T_  // Test.Smith.jump (Test.Smith)() -> ()
  #Agent.init!initializer.1: _TFC4Test5SmithcfMS0_FT_S0_  // Test.Smith.init (Test.Smith.Type)() -> Test.Smith
  #Smith.laugh!1: _TFC4Test5Smith5laughfS0_FT_T_  // Test.Smith.laugh (Test.Smith)() -> ()
}
```

A bit more transparent view may be of help:

```
sil_vtable Agent {
  #Agent.punch!1: Test.Agent.punch
  #Agent.kick!1: Test.Agent.kick
  #Agent.jump!1: Test.Agent.jump
  #Agent.init!initializer.1: Test.Agent.init
}

sil_vtable Smith {
  #Agent.punch!1: Test.Agent.punch
  #Agent.kick!1: Test.Agent.kick
  #Agent.jump!1: Test.Smith.jump
  #Agent.init!initializer.1: Test.Smith.init
  #Smith.laugh!1: Test.Smith.laugh
}
```

The above shows that the _SIL_ virtual method table is basically a dictionary that maps method names to their
implementations (function pointers). In the `Agent` class vtable, every method maps to its original implementation from
the same class. The vtable of the `Smith` subclass starts with all the methods defined in the `Agent` class, and
finishes with methods declared in the `Smith` subclass. The `jump` method was overridden in the `Smith` subclass and so
it is clearly visible in the second vtable that the `Agent.jump` method name maps to the `Test.Smith.jump`
implementation.

The `block` method mapping cannot be seen — in fact, no mapping is necessary, because the method is declared as final
and it has only one well-known implementation.

Let's get into details by skipping _IR_ and looking directly into the Assembly. Here is a code snippet from the output
of the `swiftc -S` command:

```
.globl  __TMdC4Test5Agent
.quad   __TFC4Test5AgentD
.quad   __TWVBo
.quad   __TMmC4Test5Agent
/* ... */
.quad   __TFC4Test5Agent5punchfS0_FT_T_
.quad   __TFC4Test5Agent4kickfS0_FT_T_
.quad   __TFC4Test5Agent4jumpfS0_FT_T_
.quad   __TFC4Test5AgentcfMS0_FT_S0_

.globl  __TMdC4Test5Smith
.quad   __TFC4Test5SmithD
.quad   __TWVBo
.quad   __TMmC4Test5Smith
/* ... */
.quad   __TFC4Test5Agent5punchfS0_FT_T_
.quad   __TFC4Test5Agent4kickfS0_FT_T_
.quad   __TFC4Test5Smith4jumpfS0_FT_T_
.quad   __TFC4Test5SmithcfMS0_FT_S0_
.quad   __TFC4Test5Smith5laughfS0_FT_T_
```

The above snippet shows some similarity to _SIL_ vtables. The first line presents `.globl __TMdC4Test5Agent` — a
declaration of a global symbol for the _direct type metadata_ of the `Agent` class, followed only by a set of pointers.
Then, there is `.globl __TMdC4Test5Smith` — a declaration of a global symbol for the _direct type metadata_ of the
`Smith` subclass, followed by another set of pointers. Basically, _direct type metadata_ has been defined as an array of
pointers, so... what happened to the dictionary-like structure of the vtable? Let's look at the test method code to see
what is going on:

```swift
func agentKungFuTest(agent : Agent)
{
  agent.jump()
  agent.punch()
  agent.kick()
  agent.block()
}
```

The above method is used by the Matrix to make a simple test of the `Agent`'s Kung Fu abilities. It takes an `Agent`
instance and invokes its jump, punch, kick and block methods. Now, let's skip _SIL_ and _IR_ and go directly to the
assembly of this method:

```
.globl  __TF4Test15agentKungFuTestFCS_5AgentT_
movq  (%rdi), %rcx
callq *0x58(%rcx)
callq *0x48(%rcx)
callq *0x50(%rcx)
callq __TFC4Test5Agent5blockfS0_FT_T_
retq
```

I must warn you that I have cleaned the above listing a little bit. I have removed code lines which run in constant time
and are not significant for this investigation (that is ARC code and local variables code). But this is still impressive
— Swift code maps almost directly to processor instructions! So what is there left? The first line contains just a
global function symbol declaration. Look at the second line.
[_rdi_](http://en.wikipedia.org/wiki/X86_calling_conventions#System_V_AMD64_ABI) is a register in the Intel x86-64
architecture that usually holds a value of a function's first argument. In our case, a value of the first argument is a
pointer to the `Agent` compatible instance. A Swift instance is a structure and its very first field is a pointer to its
metadata, so the assembly code can obtain a pointer to the class metadata basically by dereferencing the instance
pointer.

![Swift instance structure]({% link /img/articles/instance_layout.png %})

In the test function assembly, there are also three function calls to some computed addresses and one function call to a
well-known address. Remember that the `block` method has been marked final, so there is no need to use vtable — a direct
call to its implementation is sufficient.

To clarify the code above, let's look at it in the form of a pseudo-code:

```objc
void agentKungFuTest(void *agent) {
  void *metadata = *agent
  void (*jump)(void*) = (metadata + 0x58)
  jump(agent)
  void (*punch)(void*) = (metadata + 0x48)
  punch(agent)
  void (*kick)(void*) = (metadata + 0x50)
  kick(agent)
  Test.Agent.block(agent)
}
```

It does not compile, but it makes the situation more clear. In the second line, an argument pointer is being
dereferenced and casted to a metadata pointer (metadata will serve as vtable). Then, it adds an offset of 0x58 to the
metadata pointer and dereferences it. Wait a minute... let's look back at the _direct type metadata_ in the assembly! (I
have just added some exemplary file offsets in the left column):

```
.globl  __TMdC4Test5Agent
0x000021F0  .quad   __TFC4Test5AgentD
0x000021F8  .quad   __TWVBo
0x00002200  .quad   __TMmC4Test5Agent                  // metadata ptr
/* ... */
0x00002248  .quad   __TFC4Test5Agent5punchfS0_FT_T_    // +0x48
0x00002250  .quad   __TFC4Test5Agent4kickfS0_FT_T_     // +0x50
0x00002258  .quad   __TFC4Test5Agent4jumpfS0_FT_T_     // +0x58
0x00002260  .quad   __TFC4Test5AgentcfMS0_FT_S0_       // +0x60

.globl  __TMdC4Test5Smith
0x000023F0  .quad   __TFC4Test5SmithD
0x000023F8  .quad   __TWVBo
0x00002400  .quad   __TMmC4Test5Smith                  // metadata ptr
/* ... */
0x00002448  .quad   __TFC4Test5Agent5punchfS0_FT_T_    // +0x48
0x00002450  .quad   __TFC4Test5Agent4kickfS0_FT_T_     // +0x50
0x00002458  .quad   __TFC4Test5Smith4jumpfS0_FT_T_     // +0x58
0x00002460  .quad   __TFC4Test5SmithcfMS0_FT_S0_       // +0x60
0x00002468  .quad   __TFC4Test5Smith5laughfS0_FT_T_    // +0x68
```

It may appear strange and probably be an implementation detail, but an object's metaclass pointer points to the third
element of its _direct type metadata_. Don't be concerned about it — this is irrelevant in this investigation. Important
is that the `agentKungFuTest()` function code accesses pointer at offset of 0x58 bytes from that place, that is:

- `__TFC4Test5Smith4jumpfS0_FT_T_` - `Test.Smith.jump` in case of a `Smith` instance
- `__TFC4Test5Agent4jumpfS0_FT_T_` - `Test.Agent.jump` in case of an `Agent` instance

Look at the `agentKungFuTest` pseudo-code:

```objc
  void (*jump)(void*) = (metadata + 0x58)
  jump(agent)
```

The `jump` variable points to the `Test.Smith.jump` implementation and this implementation is simply called.

Let's take a look at the metadata again. It becomes obvious that the vtable dictionary-like structure has not been lost.
It has just morphed into a form in which a mapping key is defined as an offset in the metadata. Something like that:

```
__TMdC4Test5Smith
0x48 => _TFC4Test5Agent5punchfS0_FT_T_
0x50 => _TFC4Test5Agent4kickfS0_FT_T_
0x58 => _TFC4Test5Agent4jumpfS0_FT_T_
0x60 => _TFC4Test5AgentcfMS0_FT_S0_

__TMdC4Test5Smith
0x48 => _TFC4Test5Agent5punchfS0_FT_T_
0x50 => _TFC4Test5Agent4kickfS0_FT_T_
0x58 => _TFC4Test5Smith4jumpfS0_FT_T_
0x60 => _TFC4Test5SmithcfMS0_FT_S0_
0x68 => _TFC4Test5Smith5laughfS0_FT_T_
}
```

### Optimizations

All the _SIL_ and _assembly_ code listings in this article were produced without the optimization `-O` compiler flag.
This is because the purpose was to find out how Swift dispatches methods in the worst case scenario. But you should be
aware that the use of the `-O` flag can drastically change the final machine code:

- non-final methods can be invoked by direct function calls, when the compiler knows the exact class of a target
instance,
- compiler can even skip a function call and inline a method implementation in place of the method invocation,

so the final code can be even faster :)

### Summary

Let's wrap up! That was a long journey through the depths of Swift. You saw that Swift uses vtables for method
dispatching. Because of that, method dispatching in Swift is much simpler and faster — so more battery saving.
Unfortunately, in the case of a regular app, the speed gain will probably be insignificant, unless the app does some
complex computations.

By its very definition, vtable dispatch has one big disadvantage — it lacks dynamism so commonly used by Objective-C
programmers and in Cocoa frameworks. If you decide to code in Swift, you will probably end up mixing in some
Objective-C.
