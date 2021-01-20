---
layout: post
title: 7 reasons why Java developer should consider learning Groovy
author: michal.tydryszewski
tags: [java, groovy, functional language]
---

[Groovy](http://www.groovy-lang.org/) is a dynamic, object-oriented programming language for the Java platform. Its name comes
from slang, where “groovy” means “cool”, “amazing” or “fashionable”. This programming
language was designed to be so, but is it still *groovy* nowadays? Creator of Groovy,
James Strachan, admitted that he wouldn’t have created Groovy if he had known anything about Scala. But his project started living its own
life. Let’s take a look at what it has to offer us now.

### It’s easy for a Java developer
Groovy is easy. Most of the code you write in Java will compile and work as expected when you try to run it as a Groovy program. Sure,
sometimes you’ll be surprised by Groovy’s behaviour, but such cases are very limited. For example,
== operator won’t compare instances but call `equals()` method instead. Isn’t it more intuitive though?

The learning curve for Groovy is flat: it won’t be challenging for someone who is fluent in Java.
Also you don’t need to learn everything new from Groovy, you can discover new features step by step,
so you won’t get overwhelmed.

I would never say that Groovy is a successor of Java or a language that will soon take over the world. But certainly it’s a great
support tool whose knowledge will be beneficial. Knowing it will definitely increase your chances of getting your dream job.

### Groovy’s syntax is groovy
Groovy was thought out and designed to be less *verbose* than Java. Unnecessary semicolons, lots of
syntactic sugar help you write faster and also without worrying about most of boilerplate code. Let’s
compare:

```java
// Java 7
for (int i = 0; i < 10; i++) {
    System.out.println("Hello world, " + i);
}
// Java 8
IntStream.range(0, 10).forEach(i -> {
    System.out.println("Hello world, " + i);
});
```

```groovy
// Groovy
(0..9).each {
    println "Hello world, $it"
}
```

Sure, Java 8 and Stream API are a huge step towards better expressiveness, but I believe these examples
are still way too verbose (or less expressive) in pure Java world:

```groovy
["Let’s", "create", "a", "list"] //java.util.ArrayList
["Let’s", "create", "a", "set"] as Set //java.util.LinkedHashSet

class Person {
  int id
  String name, surname
  //let Groovy compiler generate all setters and getters!
}
//named constructor parameters, only for default constructor
new Person(id: 1, name: 'John', surname: 'Doe')
```

### Groovy is functional
Functional languages, although created in the 1950s ([Lisp](https://common-lisp.net/)), are getting popular again. More and more of such
languages are appearing, like [Clojure](http://clojure.org/), [Scala](http://www.scala-lang.org/) and our Groovy on
JVM platform, [Haskell](https://www.haskell.org/) and [F#](http://fsharp.org/) outside of it.
In such languages functions are first-class citizens,
which [Wikipedia](http://en.wikipedia.org/wiki/First-class_function) explains this way:

>this means the language supports passing functions as arguments to other functions, returning them as the
>values from other functions, and assigning them to variables or storing them in data structures

I wouldn’t like to focus on the functional aspects, but rather on the possibility of getting familiar with the new and completely
different programming paradigm that Groovy offers. For Java developers, this paradigm might be very confusing and new.
Java 8, although it is getting close to it with closures, is not fully a functional language.
[This article](http://www.beyondjava.net/blog/java-8-functional-programming-language/) explains well why. Some people will
say that Groovy is also not a pure functional language either. It only allows functional programming as one of available paradigms,
just like Scala does. Learning functional programming in Groovy, again, will be easy — it will just look like another feature. You will have
to start thinking in a brand new way, but without learning new syntax, like it would happen with Clojure or Haskell.
But on the other hand — you’ll often have a temptation to do things in an old, known way. Every coin has two sides,
but for me the ability to play with functional programming is definitely a virtue of Groovy.

### You can seamlessly integrate Groovy and Java
These two languages just work well with each other. You can make Java classes call Groovy code back and forth and it will
work just fine. No special language constructions or third party libraries. You can use this to write the following:

```groovy
import org.junit.Test
import static org.junit.Assert.assertEquals

public class JunitTest {
    @Test
    public void 'jUnit test written in groovy'() throws Exception {
        assertEquals(55, (0..10).sum())
    }
}
```

This is a test written in Groovy, using [jUnit](http://junit.org/) framework (written for Java), ran by jUnit runner. Groovy and Java integrated
seamlessly. Normal Java classes will work perfectly with Groovy classes as well,  the Java compiler will even see and use setters
and getters generated by Groovy.

### Beautiful tests in Spock
The example above shows that you can use good ol’ jUnit spiced with Groovy’s syntactic sugar. My favourite feature is naming
methods as strings containing spaces — it’s so much easier to read! But [Peter Niederwieser](https://twitter.com/pniederw)
wished to go one step further and created a full framework that helps to write better tests — [Spock](http://spockframework.org).
It forces you to use given-when-then sections, which helps you think of correct test construction; it gives a concise and almost
graphic way to write parametrized tests; when a test fails — it shows graphically which assertion failed. Let the code speak:

```groovy
class SpockTest extends Specification {
    @Unroll
    def 'should compute square root of #number correctly'() {
        expect:
        assert root == Math.sqrt(number)

        where:
        number | root
        1      | 1
        4      | 2
        9      | 3
        16     | 4
        25     | 6
    }
}
```

Note the @Unroll annotation. It will expand your test case into five separate ones. Each one named as you wish - thanks to “#number”
placeholder. Running the tests will result in:

```
io.tech.allegro.SpockTest > should compute square root of 25 correctly FAILED
Condition not satisfied:

     root == Math.sqrt(number)
     |    |       |    |
     6    false   5.0  25
```

There are more arguments in favour of Spock — its homepage [sums it up nicely](https://code.google.com/p/spock/wiki/WhySpock).

### Gradle
[Gradle](http://gradle.org/) is a build tool that is gaining popularity rapidly. Google chose Gradle as build
tool for Android — that’s enough to say about its potential. Gradle is covered in more detail in
[this blog post]({% post_url 2015-03-12-Adopting-Gradle-at-allegro-pl-a-success-story %}). I would like to add that
you don’t need to know Groovy to use Gradle at a basic level. But knowing it gives you an actual understanding of what
happens under the hood and can get you to the pro level.

### Widening your horizons
The last argument is not directly in favour of Groovy. Learning new things is always good, it widens your
horizons, you start to look at things from a different perspective. Groovy can give you insight into functional programming,
shows that things can be more concise or just better than what you know. For wise employers it’s very valuable to know that
you have not only deep knowledge, but also wide horizons, an ability and urge to learn new things. This increases your
chances to find and get a dream job.

### Every coin has two sides
Of course Groovy isn’t a perfect tool for every application. Great in script-like, Groovy is not necessarily equally useful in normal,
production coding. While dynamic typing gives you a productivity boost when writing code, it slows down refactoring afterwards. That’s a huge drawback
if you have dozens of classes in a project tangled by dependencies. There’s a way to turn on static compilation, but that’s disabling
most of Groovy’s features. However, with regular compilation syntax errors will be seen only at runtime.
Also in Groovy lots of magic happens behind the scenes. Every piece of that magic potentially might turn into a very hard to trace bug in
your code. Furthermore, the future of Groovy is very uncertain. [Pivotal](http://pivotal.io/), major sponsor of Groovy for the last few years, has stopped
its financial support in March this year. This will slow down the development of Groovy.

### Summary

In the paragraphs above I tried to show some interesting features, applications and frameworks of Groovy and the cost
at which we get these. The true power of Groovy lies in tests and scripting, when speed of coding, ease and readability
are the most important matters. In my opinion, despite its faults, Groovy is a good tool every engineer should know.
