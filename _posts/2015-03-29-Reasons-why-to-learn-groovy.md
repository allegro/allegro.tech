# ??? reasons why Java developer should consider learning Groovy

Groovy is a dynamic, object-oriented programming language for Java platform. Its name comes
from slang, where "groovy" means "cool", "amazing" or "fashionable". This programming
language was designed to be so, but is it still *groovy* nowadays? Creator of Groovy,
James Strachan, after seeing a book "Programming in Scala", admitted that he wouldn't have
created Groovy if he had known anything about Scala. But his project started living its own
life. Let's take a look what it has to offer us now.

### It's easy for Java developer
Groovy is easy. Most of the code you write in Java will compile and work as expected. Sure,
sometimes you'll get surprised by Groovy's behaviour, but such cases are very limited. E.g.
== operator won't compare instances but call equals method instead. Isn't it more intuitive though?

Learning curve for Groovy is flat, it won't be challenging for someone who is fluent with Java.
Also you don't need to learn everything new from Groovy — you can discover new features step by step,
so you won't get overwhelmed.

### Groovy's syntax is groovy
Groovy was thought and designed to be less *verbose* than Java. Unnecessary semicolons, lots of
syntactic sugar make you write faster and also without worrying about most of boiler plate code. Let's
compare:

```groovy
// Java 7
for (int i = 0; i < 10; i++) {
    System.out.println("Hello world, " + i);
}
// Java 8
IntStream.range(0, 10).forEach(i -> {
    System.out.println("Hello world, " + i);
});
// Groovy
(0..9).each {
    println "Hello world, $it"
}
```
Sure, Java 8 and Stream API made a huge step towards better expressiveness, but I believe these examples
are still way too verbose in pure Java world:
```groovy
["Let's", "create", "a", "list"]
//konstruktor bezargumentowy
//generowanie getterow i setterow
//more to come
```

### Groovy is functional
Function in Groovy is a first-class citizen, what [Wikipedia](http://en.wikipedia.org/wiki/First-class_function)
explains this way:

```
this means the language supports passing functions as arguments to other functions, returning them as the
values from other functions, and assigning them to variables or storing them in data structures
```

TODO

### You can seamlessly integrate Groovy and Java



### Beautiful tests
- tests' names that are

### Spock, Gerb

### Gradle
[Gradle](http://gradle.org/) is a build tool that gains popularity rapidly. Google chose Gradle as build
tool for Android - that's enough to say. Topic of Gradle is covered in
[this blog post](/Adopting-Gradle-at-allegro-pl-a-success-story.html)). What I would like to add is fact that
you don't need Groovy to use Gradle at basic level. But knowing it gives you an actual understanding what
happens under the hood and you can get on the pro level.

### Widening your horizons
Last argument is not directly in favour of Groovy. Learning new things is always good, it widens your
horizons, you start to see things in a different way. Groovy can give you insight into functional programming,
shows that things can be more concise or just better than what you know.


