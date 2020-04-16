---
layout: post
title: The problem of immutability in Java
author: [bartlomiej.mazur]
tags: [tech, java, performance]
---

As a developer interested in both web technologies and game development I always found myself
disagreeing with a large part of articles about using a particular technology to solve some problems.
While such articles are often true, they often skip some important details that make given
solution unacceptable in some other cases. And in this article I will try to look at
immutability in a negative way from game development perspective and how it can affect web services too.
It is always more fun to look in a negative way at something everyone loves ;)

So what are these problems:
1. how hard it is to use immutable pattern correctly in Java compared to other languages
2. impact on the performance in Java, and how other languages deal with it

While I can’t really propose any good solution for these problems I hope I will be able to show you
that while immutability is a great tool, not all languages are fully ready to utilize all
benefits, and in some cases immutability might even cause some issues.
My motivation for this article is the huge amount of articles recommending immutability for every
problem without analysing how it can actually affect your application in some cases.

### Immutability across languages

In most cases immutability is a powerful tool that allows us to keep our code clean and simple even in a multithreaded environment.
Each language allow us to write such code in a different way, and the majority of popular languages just allow us to define all fields
of such object as final/readonly/notmutable. For example, in Java our immutable type definition would look like this:
```java
public final class Enemy {
    private final int id;
    private final EnemyType type;
    private final String name;
    // +constructor
}
```
We need to keep in mind and remember that every referenced object must be immutable too.
If we added a field with a list in it, we would either need to use some `ImmutableList` as field type or ensure in constructor
that provided list is copied to some immutable collection.
A common mistake here is using and trusting [lombok](https://projectlombok.org/features/Value). Adding `@Value` to our class does not magically handle
immutability of collections and other references for us. This is similar to using Kotlin, but mostly when using Kotlin code from Java.
Because even if Kotlin list appears immutable it is just compiler syntax sugar, and your `List` will get compiled to normal mutable Java list type,
and depending on how the list was created it might be mutable too.

Some languages provide more interesting constructs, for example [D language](https://dlang.org/spec/const3.html):
```csharp
class C {
/*mutable by default*/ C mField;
             const     C cField;
             immutable C iField;
}
// and then
    C c = new C();
    c.mField = c; // fine

    // compile error as we try to mutate iField — note that it is mutated indirectly,
    // and we actually try to mutate mutable field inside.
    c.iField.mField.mField = c;

    immutable C c = new C();
    c.mField = c; // error

// or declare whole class as immutable
immutable class X {
    int a;
}
 ```
Here we can define each field/parameter as either normal mutable variable,
const/final one — so we can’t change the value of that variable, or to mark a field directly as immutable one.
Then no matter what, we don’t need to worry about mutating anything in that variable,
even if it is a reference that contains mutable fields inside them — we will not be able to mutate them using our immutable reference.

[Rust](https://doc.rust-lang.org/1.29.0/book/first-edition/mutability.html) is another interesting example.
Here by default everything is immutable but at the same time there is the `Cell` type that can be used to skip immutability, so
```rust
struct Point {
    x: i32,
    y: i32,
}
let mut a = Point { x: 5, y: 6 };
a.x = 10;

let b = Point { x: 5, y: 6 };
b.x = 10; // Error: cannot assign to immutable field `b.x`.

// but
struct Point {
    x: i32,
    y: Cell<i32>,
}
let point = Point { x: 5, y: Cell::new(6) };

point.y.set(7); // works
```
So we can’t be sure that our reference is fully immutable either, but if it is, it was a fully conscious choice of the code’s author,
so we probably don’t need to worry about it.

My point is: Java has one of the worst ways of defining immutability and tools like Lombok and Kotlin often only hide this
instead of helping. While immutability is promising to keep developers safe from many issues, it’s not that easy to keep
immutable values safe from developers without better support from the language itself.
But why is that? Was Java never designed to be used with immutable values?

### Performance cost of immutability in Java

We all know (I hope so) about the good sides of using immutable values, mostly related to multi-threaded code, but did
you ever wonder what the trade-off is? In many native languages such immutable objects usage can often be heavily optimized and
a lot of allocations are just skipped, but that’s not the case with Java — it can still reduce the number of allocations but in a much more limited way.
Many people don’t think about it, but you can allocate objects/memory fast enough to slow down your application to noticeable degree.
Application then will both spend more time allocation objects and then on cleaning them up duringing GC.
To cause such issues you need to constantly allocate a lot of objects in very short time,
so in a typical web application it's not that easy to encounter issues with allocation rates.
And when it happens you can tweak a few GC settings and scale your application.

Imagine a piece of game code where we want to invoke a function for generated positions in world:
```java

class Example {
    void example(Supplier<Position> positionGenerator, World world) {
        Stream.generate(positionGenerator)
            .limit(1000000)
            .forEach(pos -> world.updateAt(pos));
    }
}
```
This is what the update itself looks like:
```java
class World {
    void updateAt(Position position) {
        position.forAllNeighborsInRange(3, newPosition -> spawnMonsterIfNotPresent(newPosition)); // cube 7x7x7
        spawnChestIfNotPresent(position);
    }
}
```
In games such a thing would probably be part of game loop, running dozens of times per second. Maybe not necessarily
spawning new monsters, but definitely there is always a lot to do.

We will use [JMH](https://openjdk.java.net/projects/code-tools/jmh/) for benchmarking. Full benchmark code will be linked at the end of article.
```java
@Benchmark
public void tick() throws Throwable {
    Stream.generate(positionGenerator)
            .limit(ITERATIONS)
            .forEach(pos -> world.updateAt(pos));
}
```

Let’s just benchmark such code and see the results
```
Benchmark       Score   Error  Units
tick            68.875  0.088  ms/op
tick:tick p0.99 71.620         ms/op
```
This already limits us to 14 (1000 ms / 71 ms ≈ 14) updates per second, but we probably want to do more than this.
What if we removed all allocations here? Let’s make our Position mutable and just pass the same instance.
We only use 1 thread here so we don’t need to worry about concurrency or other possible issues as long as position is not stored anywhere:
```
Benchmark                     Score   Error  Units
tickNoAlloc                   30.817  0.019  ms/op
tickNoAlloc:tickNoAlloc p0.99 31.130         ms/op
```
It’s twice as fast! We don’t do much in that code, so you might think that in general such optimization would not matter,
but remember that we are talking about something running in a game loop, 35ms less means we can spin our game loop faster
or add more features before our game will run too slow, and that’s a lot of time!

In other languages people often try to connect benefits of immutable code and less allocation by allocating such values
on the stack. Sadly Java once again does not have any tool for that
(Java can get rid of allocations in some cases, but these are internal JIT optimizations that we can't control or assume if/when they are used).
The only alternative would be to use raw values directly, so instead of passing a Position object
we can just pass 3 double values. In java we have no way to return 3 values at once (structures would solve this too),
so our generator of positions must support generation of each value (x/y/z) separately.
```
Benchmark                   Score   Error  Units
tickNoHeap                  23.562  0.012  ms/op
tickNoHeap:tickNoHeap p0.99 23.839         ms/op
```
And not only it does run faster now, but can also be used again in multithreaded way without any issues.
The only issue is that we would not be able to do this with larger objects, and it already looks much more
complicated and less readable, and all of this because Java lacks simple structures that can be allocated on stack
(but maybe someday we will see some form of structures thanks to [Valhalla](https://openjdk.java.net/projects/valhalla/) project).
Note that using a struct would not always be better, it depends on size of our data.
If we use large object then it would be better to use normal object/reference as copying it would
cost more than cost of dereferencing it later.

### Stressing GC

Now let’s run this code using more threads and see what happens:
```java
@Benchmark
@Threads(-1) // use all cores
public void tick_threaded() throws Throwable {
    Stream.generate(positionGenerator)
            .limit(ITERATIONS)
            .forEach(pos -> world.updateAt(pos));
}
@Benchmark
@Threads(-1)
public void tickNoHeap_threaded() throws Throwable {
    IntStream.rangeClosed(0, ITERATIONS)
            .forEach(pos -> world.updateAt_NoHeap(noHeapPositionGenerator.nextX(), noHeapPositionGenerator.nextY(), noHeapPositionGenerator.nextZ()));
}
```
And results:
```
Benchmark                                     Score   Error  Units
tickNoHeap_threaded                            29.051 0.076  ms/op
tickNoHeap_threaded:tickNoHeap_threaded p0.00  25.330        ms/op
tickNoHeap_threaded:tickNoHeap_threaded p0.95  40.567        ms/op
tickNoHeap_threaded:tickNoHeap_threaded p0.99  51.773        ms/op
tick_threaded                                 189.682 0.849  ms/op
tick_threaded:tick_threaded p0.00             101.712        ms/op
tick_threaded:tick_threaded p0.95             231.224        ms/op
tick_threaded:tick_threaded p0.99             256.379        ms/op
```
Now we can see this issue even more, as we are allocating a lot of objects that later need to be cleaned up.

Another thing we can check is what will happen if we want to limit available memory.
Currently all the code was running on 2GB of memory, that is quite a lot for code which does nothing.
Let’s limit memory to 128MB and 20MB:
```
Benchmark                                             Score     Error  Units
tickNoHeap_threaded128M                                26.313   0.104  ms/op
tickNoHeap_threaded128M:tickNoHeap_threaded128M p0.00  24.674          ms/op
tickNoHeap_threaded128M:tickNoHeap_threaded128M p0.99  45.200          ms/op
tickNoHeap_threaded20M                                 26.292   0.093  ms/op
tickNoHeap_threaded20M:tickNoHeap_threaded20M p0.00    24.707          ms/op
tickNoHeap_threaded20M:tickNoHeap_threaded20M p0.99    41.484          ms/op
tick_threaded128M                                     211.826   0.726  ms/op
tick_threaded128M:tick_threaded128M p0.00             184.812          ms/op
tick_threaded128M:tick_threaded128M p0.99             240.910          ms/op
tick_threaded20M                                      427.533   1.430  ms/op
tick_threaded20M:tick_threaded20M p0.00               411.042          ms/op
tick_threaded20M:tick_threaded20M p0.99               478.224          ms/op
```
New version with objects is struggling even more to maintain good performance, and this is
actually something you might observe in your web application too, when more and more time goes
for GC and allocation.
Some of these issues can be sometimes solved (or make them less visible) by adjusting young gen size.
Issue will still be there, but now it will occur at another point, and at the end you will finally hit
a limit of how much you can scale your application vertically.

### Conclusion?

The point of this article was to show that while immutability gives us a lot of safety,
Java does not give us enough tools to use immutable data in a performant way.
While it’s still a good idea to write code using immutable values, we should sometimes also consider
using other methods if we need much higher throughput and scaling horizontally is either impossible
or just starting to get too expensive (with games you are often limited by performance of a single PC).
As a wannabe game developer myself — I’m especially looking at other web developers interested in
game development, as reading web influenced game code often hurts, not only the performance of the game,
but also the people who will read that code later ;)

Immutability is just a tool in a software engineer’s hand, and every tool has its own good uses,
but there is no universal tool and the job of a software engineer is to choose the right tools for given job.

[Full source code for benchmark can be read on gist](https://gist.github.com/2f057616f300045c7638bd11b250c20a)
