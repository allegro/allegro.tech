---
layout: post
title: The Memory Game
author: michal.kosmulski
tags: [java, JVM, JLS, JVMS, memory]
---

CPU time and memory are the two primary resources every performance-sensitive application needs to use wisely. Java is now the language
of choice for many such systems. While most developers have at least basic understanding of computational complexity, I believe that few,
especially among those who primarily use Virtual-Machine based languages such as Java, understand well how their applications manage memory.
This is not only a very interesting topic in itself, but can also help in improving performance of Java applications or in understanding
better the behavior of common Java-based databases such as [Apache Cassandra](http://cassandra.apache.org/).

For many systems, memory usage is probably more likely to become an issue than CPU usage.

While rumors of Java being slow are greatly exaggerated, memory usage of applications written for the Java Platform does indeed tend to be
higher than of similar applications written in lower-level languages like C++. Usually, this is not a problem: the gains in developer
productivity outweigh the cost of a somewhat increased memory footprint. However, a developer should be aware of the costs and trade-offs,
as well as of situations where memory usage can exceed expectations and cause undesired issues. This requires a higher level
of understanding of how Java manages memory and internally represents data structures.

## Much ado about nothing?
RAM is cheap these days and quite often optimizing memory usage makes little sense. A two- or ten-fold increase in memory usage over some
theoretically possible minimum may seem wasteful, but the cost of developers' time needed to optimize it is almost certain to be higher
that the cost of a few additional gigabytes of RAM for the servers. But sometimes waste goes beyond that, especially when big data gets
processed. With a farm containing tens or hundreds of machines, the possibility to run the same software with half as many or the need to
upscale the park to twice the number do make a difference in cost even for a big company.

The increase in data size that needs to be held in memory at the same time may be the result of increased traffic to the site. Waste which
is acceptable with a few requests per second may become deadly when traffic grows to tens or hundreds of requests per second. In the case
of sudden spikes in traffic, providing and deploying additional machines may be technically not feasible or economically not sound even
with cloud-based hosting.

Some environments have only limited resources available and are not easily upgraded, as is the case with mobile devices. With hardware
upgrades impossible or very hard, limiting memory consumption may be the only option.

Last but not least, many pitfalls related to memory usage can easily be avoided, so that the code is better with no elegance lost. Due to
interactions between the Garbage Collector (GC), the Just-In-Time Compiler (JIT), the Operating System (OS) and even hardware, using less
memory may result in an overall faster application for free. This is something both developers and business like.

## Specification and implementation
The environment in which Java applications run is rather complicated, and each layer influences how memory is used. Some behaviors are
defined in the [Java Language Specification (JLS)](http://docs.oracle.com/javase/specs/jls/se8/html/) while others are consequences of
choices made during the design of the Java Virtual Machine (JVM) and outlined in the [Java Virtual Machine Specification (JVMS)]
(http://docs.oracle.com/javase/specs/jvms/se7/html/). The JVMS ([§2.7](http://docs.oracle.com/javase/specs/jvms/se7/html/jvms-2.html#jvms-2.7))
clearly states that The Java Virtual Machine does not mandate any particular internal structure for objects. Different implementations of
the JVM may choose different solutions for implementing specific behaviors, so the Oracle JVM will likely have a different memory footprint
than IBM's J9 or Azul's Zing. There will be differences between the same JVM running on different platforms (e.g. 64 vs 32-bit), and even
between different versions of the same JVM since optimizations to the compiler and JRE are added with each upgrade.

Due to this volatility, some characteristics of JMV implementations stay constant over time but others change quite often. It is important to recognize this, since
otherwise effort might be put into optimizations which could become no longer valid with the next release of the JDK. Any claims found on
the web, including this article, should be taken with a grain of salt and checked for validity. Sometimes the
[source code of OpenJDK](http://hg.openjdk.java.net/jdk8) can be helpful. A tool such as
[Java Object Layout (JOL)](http://openjdk.java.net/projects/code-tools/jol/) can be used for analysis of specific classes' layouts
or for comparing different JDKs.

Unless noted otherwise, this article refers to Oracle JVM 8.

## It's not only Java any more
Apart from Java, many languages run on the JVM now. Scala, Groovy and Clojure are all affected by the JVM specification.
They may also highlight specific aspects of the JVM. Languages with elements of functional programming, for example, need to create instances
of classes which represent closures. This may lead to object creation taking place where developers don't expect it.

These languages also tend to promote the use of immutable data structures. Immutability is good for concurrent programming and can help
in ensuring algorithm correctness, but sometimes it comes at a cost. Where an imperative loop in Java might just modify a collection in-place,
a nifty functional expression in Scala could lead to several copies of the collection with various modifications getting created.
Mechanisms such as the use of [persistent data structures](http://en.wikipedia.org/wiki/Persistent_data_structure) for Scala's default
collections or the possibility of using <code>withFilter()</code> in place of <code>filter()</code> help deal with potential issues, but getting
performance-critical code right may still require more insight than in Java.

## Different kinds of memory
When we think of memory in Java, we most often think of heap memory and the well-known <code>-Xmx</code> command line argument. However, a running JVM
actually uses several different kinds of memory. Apart from heap memory (where object instances are normally allocated), each thread has a
separate stack memory area (for local variables and method call arguments), memory allocated by JNI code, native buffers, mapped files, and
so on. The virtual machine itself also needs memory for internal housekeeping, JIT compilation and operating the Garbage Collector.
Depending on the application, resident memory usage reported by system tools such as <code>top</code> may report 20% or 100% more usage than the heap
size passed to <code>-Xmx</code> parameter.

In extreme cases, heap memory may be just a small fraction of all memory used. For example, our [Cassandra](http://cassandra.apache.org/) cluster consists of machines
with 192 GB RAM but the heap size is set to only 12 GB. We do, however, need all that RAM, and need it badly. Like many other applications
that perform heavy I/O, Cassandra tries to optimize disk accesses by taking advantage of [memory-mapped files](http://en.wikipedia.org/wiki/Memory-mapped_file)
mechanism which allows portions of data to be loaded from disk into RAM as needed. This process is managed by the Operating System
without the application having to worry about caching or prioritizing different accesses. In <code>top</code>, using memory mapping on large
files is usually manifested by having huge values in the VIRT and SHR columns (comparable to the size of data kept on disk). The size of data
actually loaded into memory this way will increase the value in RES column together with memory allocated with more conventional approaches.

Since we mentioned resident and virtual memory, here's one tip: when running JVM apps, make sure swap is turned off, period. Swapping
data out from memory to disk is bad enough to bring any application to a crawl, but languages that use Garbage Collection are even more
prone to grinding to a halt once they hit swap. This is because much of a JVM's memory is actually garbage only waiting to be
garbage-collected later on. Since there are few accesses, this data will be dumped to disk, resulting in a storm of I/O once the garbage collection
step is invoked at some point. The complex object graph with many small objects referencing each other and scattered all over the allocated
space makes for many random disk accesses and slows things down even more. If your machine has too little RAM for your app, upgrade it.
Using a swap file or partition will only make matters worse.

## How many bytes in a byte?
The answer to the question of how many bytes there are in a Java byte is far from obvious. Native memory aside, a byte could be a local
variable of type <code>byte</code>, a <code>Byte</code> object or the element of an array. Actual memory usage will be different in each of these scenarios.

### Primitive variables
A local variable or method call parameter of primitive type (such as <code>byte</code>) is allocated on the stack. When Java source code is compiled,
it is normally not compiled directly to native code that could run on a particular CPU. Rather, it is compiled to bytecode
(this has nothing to do with the fact that we used byte as our example type) which is an abstract language that the JVM can execute and
possibly transform to native CPU code later on. However, in bytecode there are no instructions for handling variables of type <code>byte</code> directly.
Instead, Java's stack is divided into slots such that variables of type <code>byte</code>, <code>char</code>, <code>short</code>, <code>int</code> and <code>float</code> take up one slot while <code>long</code>s and
<code>double</code>s take two (see: [JVMS §2.6.1](http://docs.oracle.com/javase/specs/jvms/se7/html/jvms-2.html#jvms-2.6.1)). The same operation codes
are used for manipulating <code>byte</code>s and <code>int</code>s on the stack ([JVMS §2.11.1](http://docs.oracle.com/javase/specs/jvms/se7/html/jvms-2.html#jvms-2.11.1)).
This has far-reaching consequences. In theory one needs only a single byte of memory for storing the range of values of Java <code>byte</code> type (-128 to +127).
However, the specification says the same slot is to be used for a <code>byte</code> and for an <code>int</code> which has a much larger range of values.
In practice, most implementations simply reserve 4 bytes for each slot, meaning that a byte on the stack takes 4 bytes instead of just one.

Note that neither JLS nor JVMS mandate a specific layout of variables or objects in memory of the running application (but they do for class
files). The JVMS only says that bytecode operations work on slots and that the same slot size is used for a <code>byte</code> and for an <code>int</code>, but not
how these slots should be implemented. Most JVMs take the route described above which is a reasonable way of fulfilling the specification,
but not the only one. It would be possible to create a JVM which allocated 17 bytes on the stack for each slot and it would still be
standards-compliant, though rather wasteful. There are many other cases where different JVMs implement some mechanism in a similar way even
though other solutions would quite well be possible. Such solutions are not part of any standard but due to their popularity one can
(at least for now) rely on them for the purpose of tuning memory usage. Such implementations are usually chosen because of the way popular
hardware (like Intel CPU chips) work, so they may change in the future but not quite as fast as minor quirks which may change with each JDK
release.

### Objects
When a variable of some object type is declared in a Java application, the declaration only creates an object reference. Only when an object
instance is created using the <code>new</code> operator, does an actual object get created. This easily explains the behavior of object references which
developers new to Java sometimes find confusing. The reference behaves like a primitive: if a value is assigned to the reference, the
reference changes its value to point to another object but the objects themselves are not affected. Similarly, if a reference is passed to a
method as a parameter, one cannot modify what the external reference points to, but by following the reference, one can modify the state of
the pointed-to object.

```java
private void someMethod() {
    Byte b; // creates a reference on stack, no object instance is created
    b = new Byte((byte) 123); // allocates a new Byte object on the heap and sets b to point to it
}
```

Note that due to autoboxing, primitive types may in some situations get boxed in wrapper objects without the programmer coding it explicitly.
An example would be using Java collections which can only store objects and will autobox any primitive values added to them. This means that
a developer may well be creating lots of <code>Byte</code> objects while thinking that only primitive <code>byte</code>s are used.

Thus, for any object there will be some reference or references pointing to it and the object instance itself. If there are no references to
the object left, it can be removed by the Garbage Collector.

A reference is a unique handle by which an object can be accessed. Most Java applications create lots of object references since everything
which is not a primitive value, including arrays, is represented as an object. Many references are also used behind the scenes. For example,
<code>this</code> is passed implicitly for every method call in an object and references allow objects to know their types and corresponding <code>Class</code> objects.
Implementations differ, with some JVMs encoding basic information about an object inside the reference in order to speed up some operations
and others using a simple pointer to a data structure. However, at some point, the JVM needs to use pointers (like those known from C++) in
order to access object instances. While 32-bit CPUs were in common use, pointers were 32 bits in size. Moving to 64-bit JVMs meant that
the size of the pointer was increased twice which caused a huge increase in memory usage for most apps and decreased performance for many.
Oracle JVM has implemented a special optimization called "compressed oops" which allows most pointers (and references) to stay at 32 bits
even on a 64-bit JVM as long as the heap size doesn't exceed 32 GB.

An object instance itself is a much more complicated beast than a reference. First off, objects are aligned in memory to 8-byte boundaries.
This allows the "compressed oops" trick to work but at the same time it means that some space is necessarily wasted. The object instance
also contains a header of 8-12 bytes which precedes any instance fields declared in the class. Together with a 4-byte reference, that adds
up to 20 bytes even for an object which doesn't store any useful information. There are additional rules related to ordering of fields and
their alignment when inheritance comes into play.

As a result, a boxed <code>Byte</code> will take up at least 20 bytes (4 for the reference and 16 for the object instance). That's 20 times more than
one might expect at first. In the case of <code>Double</code>, we end up with 28 bytes instead of 8 because the 8-byte payload plus 12 byte header are
rounded up to 24 bytes due to the 8-byte object alignment.

A more detailed discussion of compressed oops and object header layout can be found in
[Oracle's HotSpot wiki](https://wiki.openjdk.java.net/display/HotSpot/CompressedOops).

Creating lots of small objects can not only consume lots of memory but also put the Garbage Collector under stress. When creating primitive
object wrappers, it is likely that many of them will contain the same values, for example small numbers such as 0 or 1 in the case of <code>Integer</code>.
Using <code>Integer.valueOf(1)</code> instead of <code>new Integer(1)</code> will
[return a cached instance of the <code>Integer</code> wrapper](http://docs.oracle.com/javase/specs/jls/se7/html/jls-5.html#jls-5.1.7) (for small numbers) and avoid
creating unnecessary instances of this immutable type. Do use <code>valueOf()</code> if you need to box many primitives. In some cases it may make sense
to cache other object instances in a similar manner. String has the <code>String.intern()</code> method which can be used for this purpose, though there
are a number of pitfalls. Making your own classes immutable allows for instances to be cached and re-used without the risk of modifying their
contents by unrelated pieces of code.

### Arrays
An array is an object in Java, so it needs a reference to point to it and it has a header which contains the array's length. Within an array,
consecutive values are usually packed more effectively than on the stack: <code>byte</code>s, for example, take only one byte of memory each. However, an
array of <code>boolean</code>s uses a byte for each entry while <code>int</code>-sized slots are used on the stack
([JVMS §2.3.4](http://docs.oracle.com/javase/specs/jvms/se7/html/jvms-2.html#jvms-2.3.4)). In the case of arrays of boxed <code>Byte</code> objects or of
collections which only work with boxed types, each entry contains a reference to an object on the heap, meaning that an image manipulation
program which used <code>Byte[]</code> instead of <code>byte[]</code> in order to load a 5 MB image file, would be using 100 MB of memory instead of 5 MB. The issue
would be aggravated by memory fragmentation and GC overhead. If there were few unique values, using <code>valueOf()</code> might reduce this figure to 20 MB
since there would be no need to allocate more than just a few unique instances of wrapper objects (but space would still have to be allocated
for five million four-byte references instead of single-byte `byte`s).

## Collecting the debt

Most of the time, complex data structures are built from Java collections such as <code>List</code>s, <code>Set</code>s and <code>Map</code>s. These structures are themselves
objects and they store object references inside which means every primitive object needs to be wrapped inside their boxed counterpart. The
effects this brings about onto memory usage were outlined in the previous paragraph. But this is not all. Java's collection classes were
designed with code simplicity (never mind the awful API design) rather than memory effectiveness in mind. This has some peculiar consequences.
A <code>HashSet</code>, for example, may take up more memory than a <code>HashMap</code> because it contains a <code>HashMap</code> internally
([check the code yourself](http://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/java/util/HashSet.java) ).
Maps are also quite ineffective memory-wise because the <code>entrySet()</code> operation was placed in the <code>Map</code> interface, so <code>Map</code> implementations that
come with the JDK actually store materialized instances of <code>Map.Entry</code> inside. This means for each key-value pair, apart from space used in the
hashtable, an additional object with 16 bytes of payload (that's 32 bytes storage per object together with the header and an additional reference).
Resolving hash conflicts is done by chaining, so the values stored in the hashtable are not direct values but rather collections
(list or tree-based since JDK 8), each carrying its own overhead. Add to it that arrays allocated for hash tables or <code>ArrayList</code>s need some
free space above the capacity actually in use so that new objects can be inserted and you will easily see that the overhead tends to get
rather large. When objects are inserted into a collection and then removed, memory may not get freed immediately, sometimes not at all (e.g.
the hash table inside a <code>HashMap</code>). A <code>HashMap</code> with a single entry takes about 164 bytes of memory in addition to the contents of key and value
objects (4 B for the reference, 48 B for HashMap object, 16 B + 16*4 B for the internal array + 32 for the entry node).

There are a number of alternative collection libraries, some of which may reduce the memory footprint by using more memory-efficient data
structures or by providing special implementations for primitive data types. This is in itself a topic for a separate blog post, so just to
get you inspired, here are some of the alternative Java collection libraries:

* [GNU Trove](http://trove.starlight-systems.com/) provides specialized collections for primitive types
* [Javolution](http://javolution.org/) focuses on real-time performance: for example resizing collections when items are added has much
more predictable execution time than Java's default collections
* [Highly Scalable Java (Cliff Click's Collections)](http://sourceforge.net/projects/high-scale-lib/)
* [Guava](https://code.google.com/p/guava-libraries/) contains custom immutable collection implementations but no primitive collections.
Note that some of Guava's helper methods just create standard Java collections.
* [High Performance Primitive Collections (HPPC)](http://labs.carrotsearch.com/hppc.html)
* [GS Collections](https://github.com/goldmansachs/gs-collections)

Here are some general hints for working with collections:

* Small collections carry big overheads.
* If you know there will be lots of empty collections, and they are effectively immutable, use a single instance instead of allocating a
new one each time. <code>Collections.emptySet()</code> and friends return singletons.
* Primitive wrappers may greatly increase memory usage.
* Operations such as <code>Map.keySet()</code> may cause significant amounts of memory to be allocated. When iterating, <code>entrySet()</code> is usually most
effective for Java built-in collections, other implementations may differ. Trove comes with expressions for effective, pseudo-functional
iteration over its collection classes.
* Preallocate space if you know the size of a collection up-front (many classes come with methods such as <code>ensureCapacity()</code>). When an
array-based collection such as <code>ArrayList</code> or <code>HashMap</code> grows, it needs to enlarge its internal array. Since there is no <code>realloc()</code> in Java,
this means that at some point the old array is still in use while the new, larger one, needs to be allocated and data copied into it. If
the array is increased by a factor of 2, as is common, this means that at one point adding an element to a collection of N elements needs
to have memory for 3*N allocated for some time.
* If collections are your bottleneck, consider alternatives to the collection library provided by the JDK.

## Stringing it all together

Strings are a common element of most Java apps. They are immutable representations of character sequences. Strings contain arrays of Java
<code>char</code>s which are two-byte values (Unicode UTF-16 representation, with <code>char</code> representing one unit). A <code>String</code> instance contains a reference to
a <code>char</code> array that stores the characters as well as a cached value of the hash code. The latter is an interesting example of an immutable
object (<code>String</code>) containing a field (hash) whose value is modified, without even any synchronization, and yet the object stays immutable and
thread-safe. [Watch](http://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/java/lang/String.java) but don't do this
at home.

So, the memory footprint of a <code>String</code> is roughly 4 + 24 + 16 + 2*length bytes (reference + string object + array). Two things to notice are:

* An empty <code>String</code> uses about 44 bytes.
* The size in memory will usually be larger than the size of your UTF-8 encoded input data such as JSON message since <code>char</code>s are two bytes
each and UTF-8 with mostly ASCII will be close to one byte per character. However, there is an optimization in Oracle JVM which supposedly uses
<code>byte</code> arrays instead of <code>char</code> arrays "when possible" for <code>String</code>s containing only ASCII characters.

In JDK 6 and the earliest versions of JDK 7, <code>String</code> was implemented in a different way, which made the analysis of memory usage much more
complicated. In addition to the <code>char</code> array, there were two <code>int</code> fields, <code>offset</code> and <code>length</code>, which allowed several <code>String</code>s to share the same
<code>char</code> array. This made it possible for <code>String.substring()</code> to allocate only the <code>String</code> object but to re-use the <code>char</code> array, using a different
<code>offset</code> and <code>length</code>. At the same time, it led to 8 additional bytes of overhead and to some counterintuitive behaviors.
The possibility of a big <code>String</code> never being removed from memory by GC because of a short substring sharing the same character array. That's
probably why the implementation was changed. Compare [String in JDK 6]
(http://hg.openjdk.java.net/jdk6/jdk6/jdk/file/b2317f5542ce/src/share/classes/java/lang/String.java) and
[String in JDK 8](http://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/java/lang/String.java) for an interesting read.

## Conclusion
This text barely scratches the surface. A JVM performs very complex operations on a running app, many of which affect the memory footprint.
New compiler versions add layer upon layer of optimizations to the already complicated runtime.

After reading this, you may be tempted to go ahead and start optimizing your code for memory usage. This is probably not a good idea, as in
most cases code readability and maintainability are much more important than minor performance gains. As with any performance optimization,
be very careful and always measure actual usage before and after any changes. Sometimes, very unintuitive things may happen, so always double
check that purported optimizations actually do improve the memory footprint of your applications.

However, being aware of what goes on behind the scenes in the JVM will help you avoid writing code with excessive memory usage by default and
to understand where gains are possible and where there is little to win. It is also plain interesting to know how complex the machinery that
runs our apps needs to be in order to allow them to run smoothly.
