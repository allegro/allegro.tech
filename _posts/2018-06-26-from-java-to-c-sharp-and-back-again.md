---
layout: post
title: From Java to C# and back again
author: hubert.gezikiewicz
tags: [java, C#]
---

Throughout my studies at university and work in the industry I switched my primary programming language from Java to 
C# and back again to Java. This article gathers some of my thoughts on using both languages. It’s not intended to be 
a comprehensive comparison of Java and C#. There are a lot of other resources on the Internet that cover this topic. 
Instead, I want to focus on what I personally liked about both languages and how it felt to transition between them.

## From Java to C\#
Over the course of my computer science studies, Java was my primary programming language. It had everything I needed and 
felt much easier to use than C++. Around that time I also briefly tried C# but was instantly discouraged by the horribly 
slow Visual Studio 2008 IDE. So I stuck with Java for 5 years and considered myself a Java developer. That was until I 
found an interesting job offer that required C#. I decided to give it another try. I wrote some small projects using 
it and, to my surprise, I almost didn’t notice it was a different language. Actually, the thing that was most difficult 
for me to get used to was coding conventions, like starting method names with a capital letter. Everything else felt 
very familiar. So I dug a bit deeper into the language and found things that I actually considered an improvement over 
Java. First and foremost [LINQ](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/).

### LINQ
When I first started to use C#, LINQ was the feature that I liked most. The name is an acronym for Language Integrated 
Query. It lets you query collections and other data sources in a way that’s both consistent and convenient to use. For 
example, let’s say you have a list of users and you want to narrow it down to only these whose names start with “A”. 
In plain C#, you could write this as:

```C#
IEnumerable<User> result = new List<User>();
for (User user in users) {
    if (user.name.StartsWith('A')) {
        result.Add(user);
    }
}
```

This code would work just fine, but when you glance at it, it’s not immediately obvious what it does. Also, it’s a lot 
of typing. Using LINQ this code could be simplified to:

```C#
List<User> result = users.Where(user -> user.name.StartsWith('A'));
```

Or if you prefer a more SQL-like syntax:

```C#
IEnumerable<User> result =
    from users
    where user.name.StartsWith('A')
    select user;
```

In addition to filtering, LINQ also supports various methods for transforming (or projecting) results to a different 
form (like [Select](https://msdn.microsoft.com/en-us/library/system.linq.enumerable.select(v=vs.110).aspx) or 
[SelectMany](https://msdn.microsoft.com/en-us/library/system.linq.enumerable.selectmany(v=vs.110).aspx)), aggregation 
(for example [Aggregate](https://msdn.microsoft.com/en-us/library/bb548651(v=vs.110).aspx), or 
[GroupBy](https://msdn.microsoft.com/en-us/library/system.linq.enumerable.groupby(v=vs.110).aspx)) or 
joining multiple collections (for example [Join](https://msdn.microsoft.com/en-us/library/system.linq.enumerable.join(v=vs.110).aspx), 
or [Zip](https://msdn.microsoft.com/en-us/library/dd267698(v=vs.110).aspx)). .NET 4 further extended 
LINQ by adding support for parallel processing 
([PLINQ](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/parallel-linq-plinq)). All in all, 
the feature is quite powerful. People even wrote some one line queries to solve riddles like Sudoku. Of course LINQ 
doesn’t come without some drawbacks. Most notably, queries are notoriously difficult to debug as they are treated as 
just one statement by the debugger. The fact that query results are lazily evaluated also complicates stepping through 
the code a bit. 

After I switched to C#, Java 8 introduced a feature very similar to LINQ called 
[Streams](http://www.oracle.com/technetwork/articles/java/ma14-java-se-8-streams-2177646.html) which was then further 
improved in Java 9. Our previous example of filtering a list of users could look like this:

```java
List<User> result = users.stream().filter(user -> user.name.startsWith("A")).collect(toList());
```

The syntax of both technologies is very similar. The set of available convenience methods is a bit different but you can 
fill in the gaps by combining other, more basic, methods.

When learning C# I really liked how LINQ simplified the source code by removing unnecessary loops. C# also has some other 
features that help make the code more concise, such as for example properties or optional parameters.

### Properties and Optional Parameters
Properties are an alternative to Java getters and setters. Having to add field accessors was one of the things that I 
liked the least about Java. Sure, most Java IDEs can generate them on demand, but it’s still another action you need 
to do. The code also gets more cluttered. There are some libraries that let you add accessors by annotating a class 
(such as [Lombok](https://projectlombok.org/)), 
but this only really works if your IDE understands them. C# properties are built into the core language and offer a 
concise syntax for accessing fields. Instead of declaring a field with two accompanying accessor methods you can simply 
write:

```C#
public int SomeProperty {get; set;}
```

If required, you can provide custom logic after the get or set keywords, or remove the setter altogether if the property 
should be read-only. 

Another feature that helps reduce code clutter is allowing optional method arguments. This reduces the need for 
overloading method names with different sets of parameters. For example, let’s take a standard ```IndexOf()``` method used to 
find the index of a particular character in a string. It usually has two versions: one that allows you to specify only 
the character you’re looking for and another which lets you specify where to start the search. This could be written as 
two methods:

```C#
public int IndexOf(char character) {
    return IndexOf(character, 0);
}

public int IndexOf(char character, int startIndex) {
    // find the first occurence of character starting from startIndex
}
```

Using optional parameters we only need one method:

```C#
public int IndexOf(char character, int startIndex = 0) {
    // find the first occurence of character starting from startIndex
}
```

### Generics
Both Java and C# support generic types, but the way the feature is implemented differs significantly. In Java generics 
only exist at the language level. The runtime environment doesn’t support type parameters so the compiler removes them 
in a process called type erasure. It replaces all instances of a type parameter with the top level ```Object``` class or 
a constraint defined for the type parameter. It then inserts casts to preserve type safety. In contrast, C# compiler 
only verifies type constraints without removing the parameters. Actual code generation is deferred until the class is 
loaded. At that point, the type parameter is replaced with the actual runtime type. Both approaches to generics have 
their advantages and disadvantages. I won’t go into too much detail here as there are a lot of other resources that explain 
the topic better than I can. Setting aside some differences in resource consumption, in most use cases both approaches 
work just as well. But type erasure can cause some inconveniences. For example consider these two methods:

```java
private void doSomething(List<String> list) { ... }
private void doSomething(List<URL> list) { ... }
```

After type erasure takes place, the type of items contained in the collections is replaced by ```Object```. Because of this, 
the two methods end up with an identical signature and the code would fail to compile. To overcome this, one needs to 
modify the names of the methods.

Type erasure can also make it more difficult to use reflection. For example, let’s say we have two classes A and B,
and that B inherits from A. Let’s also create a list of type A which contains a mix of instances of A and B.

```C#
public class A {
}

public class B : A {
}

...

List<A> list = new List<A>();
list.Add(new A());
list.Add(new B());
```

Now let’s write a generic method that starts with logging the type of the list and then processes it some way: 

```C#
public void Process<T>(List<T> list) where T : A {
    Console.WriteLine("Processing a list of {0}", typeof(T).Name);
    
    // do something else
}
```

Calling the method as:

```C#
Process(list);
```

would print the following line:

```
Processing a list of A
```

This approach would not work in Java. It relies on the fact that we can get the actual runtime value of ```T``` using 
the ```typeof``` operator. Since Java’s type erasure replaces ```T``` with ```Object```, there’s no way we can determine 
the type of items in the list. We could try to iterate through them and check their types using the ```getClass()``` method, 
but, because our list contains a mixture of different classes, we would need to walk up the inheritance tree and calculate a 
common ancestor for them. This could get tricky if the classes implemented the same interfaces.
A better approach, would be to define an additional ```Class``` parameter. We can then use it to explicitly 
tell the method what type we’re processing.

```java
public <T extends A> void process(List<T> value, Class<T> type) {
    System.out.printf("Processing a list of %s", type.getName());

    // do something else
}
```

The method would then be called like this:

```java
process(list, A.class);
```

Adding the extra information in this case might not seem like a huge problem, but having to pass the type explicitly 
is a bit unintuitive since the method already has a type parameter.

## From C# to Java
Over the 5 years I was using C# I really got used to the convenience offered by these and other language features. At some 
point I decided it was time to change jobs and found an interesting position at Allegro. The primary language required 
was Java. Because of that, I decided to refresh my skills a bit and started a small project. I must say, transitioning 
back to Java wasn’t as smooth as moving to C# earlier. The language felt way less expressive. It seemed I needed to do 
much more to get the same result. But that was before I tried [Spring](https://spring.io/).

### Spring
I never really used Spring before I switched to C#. I wanted to give it a try and was very impressed. Without any 
real knowledge of the framework I managed to get a simple REST service running within a few minutes. This ease of 
configuration is something .NET [WCF](https://docs.microsoft.com/en-us/dotnet/framework/wcf/whats-wcf) framework really 
lacks. The acronym stands for Windows Communication Foundation. It’s a framework for building services-oriented 
applications. It handles all the details of sending messages over the network, supporting multiple message patterns 
(like a request-response model, or a duplex channel), different transport protocols, encodings, and has a host of other 
features. It’s quite powerful but the drawback is it relies on a rather complicated XML configuration file. It’s not 
easy to get everything set up correctly without doing some research upfront. In Spring the XML configuration file is 
optional. The more convenient method is to configure the application in code by adding annotations and registering bean 
classes. Spring also decreases the entry cost by hiding all of the configuration settings you don’t need at first. 
[Spring Boot](https://projects.spring.io/spring-boot/) sets some sensible defaults for you. Later, if you need to, 
you can always configure them the way you want, but until then, the framework takes care of everything. 

Another thing I liked about Spring was the built-in dependency container. It requires the user to just add a few annotations 
on classes and the framework takes care of wiring them together. In general, I really liked how Spring makes use of 
annotations. They exist in C# as well but are nowhere near as utilised. I was surprised to see how easy it was to add 
validation for input messages of my service or to gather metrics for endpoints. All this without cluttering business 
logic with extra code that doesn’t really belong there. For example the below code creates a service endpoint that 
accepts PUT requests, with a URL path parameter that’s not null and a request body that’s validated using annotations 
defined for fields in the Request class.

```java
@PutMapping(value = "/{pathParameter}")
public Response update(
            @PathVariable("pathParameter") @NotNull String pathParameter,
            @RequestBody @Valid @NotNull Request requestBody)
```

But all this convenience comes at a cost. When using Spring, it sometimes feels there’s some sort of magic going on 
inside the framework. Sometimes even too much magic. For example, when accessing databases using Spring you can use 
repository interfaces. These are ordinary Java interfaces to which you add methods using a defined naming convention. 
Spring then generates a class with query implementations based on method names and injects it whenever you use 
the interface. Things get even more implicit if you want to add some custom queries. I read the documentation for 
this a few times and still didn’t quite believe the approach described there would just work. The solution was to add a 
class with the same name as the interface and an "Impl" suffix. It doesn’t need to implement the original interface or 
have any other connection to it. The name alone is enough for Spring to know it should be merged into the automatically 
generated class I mentioned earlier. This kind of implicit behavior makes it a bit difficult to understand what’s going 
on in a Spring application, especially when you’re not familiar with some of the framework’s features. But, all in all, 
Spring does a great job when it comes to configuring most common use cases. 

Spring wasn’t the only thing I liked about Java. Some core language features also caught my attention, such as for example 
Optionals.

### Optionals
Java Optionals are something C# could really use. It’s not uncommon to have C# programs cluttered with 
``` if (something == null)``` conditions everywhere. C# 6.0 introduced an optional chaining operator which improved this 
a bit by allowing method calls like this:

```C#
String value = GetSomething()?.GetSomethingElse()?.AndExtractString();
```

The new operator makes sure a method is only invoked on a non-null reference. Otherwise it just returns null. But you 
most likely still need to guard against a null when you try to use the final value returned from the call chain. Java 
has a much more flexible mechanism for handling null values. For example, it lets you define default values to use 
like this.

```java
String value = Optional.ofNullable(GetSomething()).orElse("default");
```

It also allows you to transform the object or filter based on a predicate:

```java
String value = Optional.ofNullable(getSomething())
    .map(something -> something.getSomethingElse())
    .filter(somethingElse -> somethingElse.isOk)
    .map(somethingElse -> somethingElse.andExtractString())
    .orElse("default");
```

The syntax really resembles Java Streams that I mentioned earlier and C# LINQ. It’s a really powerful way to handle 
possible null values in the code without dotting business logic with null checks.

## Some final thoughts
So, after using both Java and C#, which language do I like more? The most honest answer is: I don’t really know. 
If I were to compare only core language features, C# seems to be more expressive, but Spring easily makes up for 
the difference. Both Java and C# are general purpose programming languages that let you code pretty much whatever 
you want. Is one better suited for some projects than the other? Probably so. C# seems to be a more natural choice 
when the main platform you want to target is Windows. There are also official APIs available to use all Microsoft 
services like OneDrive or Active Directory. On the other hand, Java seems to be a better choice outside of Windows 
platform. Then again, recent actions taken by Microsoft seem to indicate a change in the previous approach to favour 
its own platform and language. Acquisition of [Xamarin](https://www.xamarin.com/) and 
[increasing support for .NET Core](https://blogs.msdn.microsoft.com/dotnet/2018/02/02/net-core-2-1-roadmap/) makes it 
easier to use C# on operating systems other than Windows. Client libraries and official code samples in most popular 
languages are also added to most of Microsoft’s services opening them to developers that don’t use C#. Java is also picking 
up momentum by shortening release cycles of new versions and adding a lot of interesting features. With all that, 
the line between the two worlds becomes increasingly blurry and the choice between C# and Java will often boil down to 
personal or company preference.

And what about picking a language when starting to learn programming? Looking back, do I think it was good to start with 
Java? I think so. The core language is probably easier to learn than C#. LINQ, Events and Properties can be a bit 
confusing at first. On the other hand, Spring gives Java a big advantage. And once you get a bit more experience in programming, 
the language isn’t that important anymore. After all, it’s just a way to express our ideas. It’s a bit like with natural 
languages: you can write poetry no matter which one you use. What really matters is the developer that turns an idea 
into an amazing application.
