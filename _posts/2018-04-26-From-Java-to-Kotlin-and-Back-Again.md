---
layout: post
title: From Java to Kotlin and Back Again
author: bartosz.walacik
tags: [java, kotlin]
---

Kotlin is popular, Kotlin is trendy. Kotlin gives you compile-time null-safety and
less boilerplate. Naturally, it’s better than Java. You should switch to Kotlin or die
as a legacy coder. Hold on, or maybe you shouldn’t? Before you start writing in Kotlin,
read the story of one project. The story about quirks and obstacles becoming so
annoying that we decided to rewrite.

## We gave Kotlin a try, but now we are rewriting to Java 10

I have my favorite set of JVM languages. Java in `/main` and Groovy in `/test` are the
best-performing duo for me. In summer 2017 we started a new microservice project,
and as usual, we talked about languages and technologies. There are a few Kotlin
advocating teams at Allegro, and we wanted to try something new, so we decided to give
Kotlin a try. Since there is no [Spock](http://spockframework.org/) counterpart for Kotlin, we decided
to stick with Groovy in `/test`
([Speck](http://spekframework.org/) isn’t as good as Spock).
In winter 2018, after few months of working with
Kotlin on a daily basis,  we summarized pros and cons and arrived at the conclusion
that Kotlin made us *less* productive.  We started rewriting this microservice to Java.

Here are the reasons why.
 
* [Name shadowing](#name-shadowing) 
* [Type inference](#type-inference) 
* [Compile time null-safety](#compile-time-null-safety) 
* [Class literals](#class-literals) 
* [Reversed type declaration](#reversed-type-declaration) 
* [Companion object](#companion-object) 
* [Collection literals](#collection-literals) 
* [Maybe? Nope](#maybe-nope) 
* [Data classes](#data-classes) 
* [Open classes](#open-classes) 
* [Steep learning curve](#steep-learning-curve)
 
 
## Name shadowing

Shadowing was my biggest surprise in **Kotlin**. Consider this function:

```kotlin
fun inc(num : Int) {
    val num = 2
    if (num > 0) {
        val num = 3
    }
    println ("num: " + num)
}
```

What will be printed when you call `inc(1)`?
Well, in Kotlin, method arguments are values, so you can’t change
the `num` argument.
That’s good language design because you shouldn’t change method arguments.
But you can define another variable with the same name and initialize it to whatever you wish.
Now you have two variables named `num` in the method level scope.
Of course, you can access only the one `num` at a time, so effectively,
the value of the `num` is changed. Checkmate.

In the `if` body, you can add another `num`, which is less shocking
(new block-level scope).

Okay, so in Kotlin, `inc(1)` prints 2. The equivalent code in **Java**, won’t compile:

```java
void inc(int num) {
    int num = 2; //error: variable 'num' is already defined in the scope
    if (num > 0) {
        int num = 3; //error: variable 'num' is already defined in the scope
    }
    System.out.println ("num: " + num);
}
```

Name shadowing wasn’t invented by Kotlin. It’s common in programming languages.
In Java, we get used to shadowing class fields with methods arguments:

```java
public class Shadow {
    int val;

    public Shadow(int val) {
        this.val = val;
    }
}
``` 

In Kotlin, shadowing goes too far. Definitely, it’s a design flaw made by Kotlin team. 
IDEA team tried to fix this by showing you the laconic warning on each shadowed variable:
*Name shadowed*. Both teams work in the same company, so maybe they can talk to each other
and reach a consensus on the shadowing issue? My hint &mdash; IDEA guys are right.
I can’t imagine a valid use case for shadowing a method argument. 
 
## Type inference

In Kotlin, when you declare a `var` or `val`,
you usually let the compiler guess the variable type from the type of expression on the right.
We call it local variable type inference, and it’s a great improvement for programmers.
It allows us to simplify the code without compromising static type checking.
            
For example, this Kotlin code:

```kotlin
var a = "10"   
```

would be translated by the Kotlin compiler into:

```kotlin
var a : String = "10"
```

It was the real advantage over Java. I deliberately said *was*, because &mdash; good news &mdash;
Java 10 has it and Java 10 is available now.

Type inference in **Java 10**:

```java
var a = "10";
```

To be fair, I need to add, that Kotlin is still slightly better in this field.
You can use type inference also in other contexts, for example, one-line methods.

More about [Local-Variable Type Inference](https://medium.com/@afinlay/java-10-sneak-peek-local-variable-type-inference-var-3022016e1a2b) in Java 10.

### Compile time null-safety 
Null-safe types are Kotlin’s killer feature. The idea is great.
In Kotlin, types are by default non-nullable. If you need a nullable type you need
to add `?` to it, for example:
 
```kotlin 
val a: String? = null      // ok

val b: String = null       // compilation error
``` 

Kotlin won’t compile if you use a nullable variable without the null check, for example:

```kotlin
println (a.length)          // compilation error
println (a?.length)         // fine, prints null
println (a?.length ?: 0)    // fine, prints 0
```

Once you have these this two kind of types, non-nullable `T` and nullable `T?`,
you can forget about the most common exception in Java &mdash; NullPointerException.
Really? Unfortunately, it’s not that simple. 

Things get nasty when your Kotlin code has to get along with Java code
(libraries are written in Java, so it happens pretty often I guess).
Then, the third kind of type jumps in &mdash; `T!`.
It’s called platform type, and somehow it means `T` or `T?`.
Or if we want to be precise, `T!` means `T` with undefined nullability.
This weird type can’t be denoted in Kotlin, it can be only inferred from Java types. 
`T!` can mislead you because it’s relaxed about nulls and disables Kotlin’s null-safety net. 

Consider the following **Java** method:

```java
public class Utils {
    static String format(String text) {
        return text.isEmpty() ? null : text;
    }
}
```

Now, you want to call `format(String)` from Kotlin.
Which type should you use to consume the result of this Java method?
Well, you have **three** options.

**First approach**. You can use `String`, the code looks safe but can throw NPE.

```kotlin
fun doSth(text: String) {
    val f: String = Utils.format(text)       // compiles but assignment can throw NPE at runtime
    println ("f.len : " + f.length)
}
```

You need to fix it with Elvis:

```kotlin
fun doSth(text: String) {
    val f: String = Utils.format(text) ?: ""  // safe with Elvis
    println ("f.len : " + f.length)
}
```

**Second approach.** You can use `String?`, and then you are null-safe:
 
```kotlin
fun doSth(text: String) {
    val f: String? = Utils.format(text)   // safe
    println ("f.len : " + f.length)       // compilation error, fine
    println ("f.len : " + f?.length)      // null-safe with ? operator
}
```

**Third approach.**  What if you just let the Kotlin do the fabulous
local variable type inference?

```kotlin
fun doSth(text: String) {
    val f = Utils.format(text)            // f type inferred as String!
    println ("f.len : " + f.length)       // compiles but can throw NPE at runtime
}
```

Bad idea. This Kotlin code looks safe, compiles, but allows nulls for 
the unchecked journey through your code, pretty much like in Java.

There is one more trick, the `!!` operator. Use it to force inferring `f` type as `String`:  

```kotlin
fun doSth(text: String) {
    val f = Utils.format(text)!!          // throws NPE when format() returns null
    println ("f.len : " + f.length)       
}
```
 
In my opinion, Kotlin’s type system with all these scala-like `!`, `?`, and `!!` is too complex. 
Why Kotlin infers from Java `T` to `T!` and not to `T?`?
It seems like Java interoperability spoils Kotlin’s killer feature &mdash;
the type inference.
Looks like you should declare types explicitly (as `T?`) for all Kotlin variables
populated by Java methods.     

## Class literals

Class literals are common when using Java libraries like Log4j or Gson.

In **Java**, we write the class name with `.class` suffix:

```java
Gson gson = new GsonBuilder().registerTypeAdapter(LocalDate.class, new LocalDateAdapter()).create();
``` 
    
In **Groovy**, class literals are simplified to the essence. You can omit the `.class`
and it doesn’t matter if it’s a Groovy or Java class.

```groovy
def gson = new GsonBuilder().registerTypeAdapter(LocalDate, new LocalDateAdapter()).create()
```

**Kotlin** distinguishes between Kotlin and Java classes and has the syntax ceremony for it:

```kotlin
val kotlinClass : KClass<LocalDate> = LocalDate::class
val javaClass : Class<LocalDate> = LocalDate::class.java
```

So in **Kotlin**, you are forced to write:
   
```kotlin
val gson = GsonBuilder().registerTypeAdapter(LocalDate::class.java, LocalDateAdapter()).create()
```

Which is ugly.

## Reversed type declaration

In the C-family of programming languages, we have the standard way of declaring types of things.
Shortly, first goes a type, then goes a typed thing (variable, fields, method, and so on).

Standard notation in **Java**:

```java
int inc(int i) {
    return i + 1;
}
```

Reversed notation in **Kotlin**:

```kotlin
fun inc(i: Int): Int {
    return i + 1
}
``` 

This disorder is annoying for several reasons.

**First**, you need to type and read this noisy colon between names and types. 
What is the purpose of this extra character? Why are names **separated** from their types? 
I have no idea. Sadly, it makes your work in Kotlin harder. 

**The second problem.** When you read a method declaration, first of all, you are interested in 
the name and the return type, and then you scan the arguments.

In Kotlin, the method’s return type could be far at the end of the line, so you need to scroll:

```kotlin
private fun getMetricValue(kafkaTemplate : KafkaTemplate<String, ByteArray>, metricName : String) : Double {
    ...
}
```

Or, if arguments are formatted line-by-line, you need to search.
How much time do you need to find the return type of this method?

```kotlin
@Bean
fun kafkaTemplate(
        @Value("\${interactions.kafka.bootstrap-servers-dc1}") bootstrapServersDc1: String,
        @Value("\${interactions.kafka.bootstrap-servers-dc2}") bootstrapServersDc2: String,
        cloudMetadata: CloudMetadata,
        @Value("\${interactions.kafka.batch-size}") batchSize: Int,
        @Value("\${interactions.kafka.linger-ms}") lingerMs: Int,
        metricRegistry : MetricRegistry
): KafkaTemplate<String, ByteArray> {

    val bootstrapServer = if (cloudMetadata.datacenter == "dc1") {
        bootstrapServersDc1
    }
    ...
}
```   
  
**The third problem** with reversed notation is poor auto-completion in an IDE.
In standard notation, you start from a type name, and it’s easy to find a type.
Once you pick a type, an IDE gives you several suggestions about a variable name,
derived from selected type.
So you can quickly type variables like this:

```java
MongoExperimentsRepository repository
``` 

Typing this variable in Kotlin is harder even in IntelliJ, the greatest IDE ever.
If you have many repositories, you won’t find the right pair on the auto-completion list.
It means typing the full variable name by hand.

```kotlin
repository : MongoExperimentsRepository 
``` 

## Companion object

A Java programmer comes to Kotlin.

“Hi, Kotlin. I’m new here, may I use static members?” He asks.<br/>
“No. I’m object-oriented and static members aren’t object-oriented,” Kotlin replies.<br/>
“Fine, but I need the `logger` for `MyClass`, what should I do?”<br/>
“No problem, use a companion object then.” <br/>
“And what’s a companion object?”<br/>
“It’s the singleton object bounded to your class.
Put your logger in the companion object,” Kotlin explains.<br/>
“I see. Is it right?”<br/>

```kotlin
class MyClass {
    companion object {
        val logger = LoggerFactory.getLogger(MyClass::class.java)
    }
}
```

“Yes!“<br/>
“Quite verbose syntax," the programmer seems puzzled, "but okay, now I can call my logger like this &mdash; `MyClass.logger`,
just like a static member in Java?”<br/> 
“Um... yes, but it’s not a static member! There are only objects here.
Think of it as the anonymous inner class already instantiated as the singleton.
And in fact this class isn’t anonymous, it’s named `Companion`, but you can omit the name.
See? That’s simple.“<br/>

I appreciate the *object declaration* concept &mdash; singletons are useful.
But removing static members from the language is impractical.
In Java, we are using static loggers for years. It’s classic.
It’s just a logger, so we don’t care about object-oriented purity.
It works, and it never did any harm. 

Sometimes, you **have to** use static.
Old good `public static void main()` is still the only way to launch a Java app.
Try to write this companion object *spell* without googling.

```kotlin
class AppRunner {
    companion object {
        @JvmStatic fun main(args: Array<String>) {
            SpringApplication.run(AppRunner::class.java, *args)
        }
    }
}
```    

## Collection literals

In **Java**, initializing a list requires a lot of ceremony:

```java
import java.util.Arrays;
...

List<String> strings = Arrays.asList("Saab", "Volvo");
```

Initializing a Map is so verbose, that lot of people use **Guava**:

```java
import com.google.common.collect.ImmutableMap;
...

Map<String, String> string = ImmutableMap.of("firstName", "John", "lastName", "Doe");
```

In Java, we are still waiting for the new syntax to express collection and map literals.
The syntax, which is so natural and handy in many languages.

**JavaScript**:

```javascript
const list = ['Saab', 'Volvo']
const map = {'firstName': 'John', 'lastName' : 'Doe'}
```

**Python**:

```python
list = ['Saab', 'Volvo']
map = {'firstName': 'John', 'lastName': 'Doe'}
```

**Groovy**:

```groovy
def list = ['Saab', 'Volvo']
def map = ['firstName': 'John', 'lastName': 'Doe']
```

Simply, the neat syntax for collection literals is what you expect
from a modern programming language, especially if it’s created from scratch. 
Instead of collection literals, Kotlin offers the bunch of built-in functions: 
`listOf()`, `mutableListOf()`, `mapOf()`, `hashMapOf()`, and so on.

**Kotlin**:

```kotlin
val list = listOf("Saab", "Volvo")
val map = mapOf("firstName" to "John", "lastName" to "Doe")
```

In maps, keys and values are paired with the `to` operator, which is good, but why not use
well-known `:` for that? Disappointing. 


## Maybe? Nope

Functional languages (like Haskell) don’t have nulls.
Instead, they offer the *Maybe* monad
(if you are not familiar with monads, read [this article](http://www.nurkiewicz.com/2016/06/functor-and-monad-examples-in-plain-java.html) by Tomasz Nurkiewicz).

Maybe was introduced to the JVM world the long time ago by Scala as Option, 
and then, became adopted in Java 8 as Optional.
Now, Optional are quite popular way of dealing with nulls in return types at API boundaries.
  
There is no Optional equivalent in Kotlin. 
It seems that you should use bare Kotlin’s nullable types.
Let’s investigate this issue.

Typically, when you have an Optional,
you want to apply a series of null-safe transformations and deal with null at the and.

For example, in **Java**: 

```java
public int parseAndInc(String number) {
    return Optional.ofNullable(number)
                   .map(Integer::parseInt)
                   .map(it -> it + 1)
                   .orElse(0);
}
```  
  
No problem one might say, in **Kotlin**, for mapping you can use the `let` function:

```kotlin
fun parseAndInc(number: String?): Int {
    return number.let { Integer.parseInt(it) }
                 .let { it -> it + 1 } ?: 0
}
```        

Can you? Yes, but it’s not that simple. The above code is wrong and throws NPE from `parseInt()`.  
The monadic-style `map()` is executed only if the value is present.
Otherwise, null is just passed by. That’s why `map()` is so handy.
Unfortunately, Kotlin’s `let` doesn’t work that way.
It’s just called on everything from the left, including nulls.

So in order make this code null-safe, you have to add `?` before each `let`:

```kotlin
fun parseAndInc(number: String?): Int {
    return number?.let { Integer.parseInt(it) }
                 ?.let { it -> it + 1 } ?: 0
}
```      

Now, compare readability of the Java and Kotlin versions. Which one do you prefer?

Read more about Optionals at [Stephen Colebourne’s blog](http://blog.joda.org/2015/08/java-se-8-optional-pragmatic-approach.html).

## Data classes

[Data classes](https://kotlinlang.org/docs/reference/data-classes.html)
are Kotlin’s way to reduce the boilerplate that is inevitable in
Java when implementing Value Objects (aka DTO).

For example, in **Kotlin**, you write only the essence of a Value Object:

```kotlin
data class User(val name: String, val age: Int)
```

and Kotlin generates good implementations of `equals()`, `hashCode()`, `toString()`, and `copy()`.

It’s really useful when implementing simple DTOs.
But remember, Data classes come with the serious limitation &mdash;
they are final. You cannot extend a Data class or make it abstract.
So probably, you won’t use them in a core domain model. 

This limitation is not Kotlin’s fault.
There is no way to generate the correct value-based `equals()` without violating the Liskov Principle.
That’s why Kotlin doesn’t allow inheritance for Data classes.

## Open classes

In Kotlin, classes are final by default. If you want to extend a class,
you have to add the `open` modifier to it.

Inheritance syntax looks like this:

```kotlin
open class Base

class Derived : Base()
```

Kotlin changed the `extends` keyword into the `:` operator,
which is already used to separate variable name from its type.
Back to C++ syntax? For me it’s confusing. 

What is controversial here is  making classes final by default.
Maybe Java programmers overuse inheritance. 
Maybe you should think twice before allowing for extending your class.
But we live in the frameworks world, and frameworks love AOP.
Spring uses libraries (cglib, jassist) to generate dynamic proxies for your beans.
Hibernate extends you entities to enable lazy loading.

If you are using Spring, you have two options.
You can put `open` in front of all bean classes (which is rather boring),
or use this tricky compiler plugin:

```groovy
buildscript {
    dependencies {
        classpath group: 'org.jetbrains.kotlin', name: 'kotlin-allopen', version: "$versions.kotlin"
    }
}
```

## Steep learning curve

If you think that you can learn Kotlin quickly because you already know Java &mdash;
you are wrong. Kotlin would throw you in the deep end.
In fact, Kotlin’s syntax is far closer to Scala.
It’s the all-in bet. You would have to forget Java and switch
to the completely different language. 

On the contrary, learning Groovy is a pleasant journey. 
Groovy would lead you by the hand.
Java code is correct Groovy code, so you can start by
changing the file extension from `.java` to `.groovy`.
Each time when you learn a new Groovy feature, you can decide. Do you like it
or do you prefer to stay with the Java way? That’s awesome.

## Final thoughts

Learning a new technology is like an investment.
We invest our time and then the technology should pay off.
I’m not saying that Kotlin is a bad language.
I’m just saying that in our case, the Return On Investment
was dissatisfactory.

## Funny facts about Kotlin

In Poland, Kotlin is one of the best selling brands of ketchup. 
This name clash is nobody’s fault, but it’s funny.
Kotlin sounds to our ears like Heinz.
 
![Kotlin ketckup](/img/articles/2018-03-From-Java-to-Kotlin-and-Back-Again/Kotlin.jpg){: .center-image }
