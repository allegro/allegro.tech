---
layout: post
title: From Java to Kotlin and Back Again
author: bartosz.walacik
tags: [java, kotlin]
---

Kotlin is popular, Kotlin is trendy. Kotlin gives you compile time null-safety and
less boilerplate. Simply, it's better than Java. You should switch to Kotlin or die
as a legacy coder. Hold on, maybe you shouldn't? Before you start writing in Kotlin
read the story of one project. The story about quirks and obstacles that become so
annoying that we decided to rewrite.

## We gave Kotlin a try, but now we are rewriting to Java 

I have my favorite set of JVM languages. Java in `/main` and Groovy in `/test` are the
best-performing duo for me. In summer 2017 we started a new microservice project,
and as usual, we talked about languages and technologies. There are few Kotlin
advocating teams in Allegro and we wanted to try something new so we decided to give
Kotlin a try in `/main`. Since there is no Spock counterpart for Kotlin, we decided
to stick with Groovy in `/test`. In winter 2018, after few months of working with
Kotlin on the daily basis,  we summarized pros and cons and arrived at that conclusion
that Kotlin made us *less* productive.  We started rewriting this microservice to Java.
Here are the reasons why.

### Compile time null-safety 
Null-safe types are the Kotlin's killer feature. The idea is great.
In Kotlin, types are by default non-nullable. If you need a nullable type you need
to add `?` to it, for example:
 
```kotlin 
val a: String? = null      // ok

val b: String = null       // compilation error
``` 

Kotlin won't compile if you use a nullable variable without the null check, for example:

```kotlin
println (a.length)          // compilation error
println (a?.length)         // fine, prints null
println (a?.length ?: 0)    // fine, prints 0
```

So you can forget about the most common exception in Java &mdash; NullPointerException.
Really? Unfortunately, it's not that simple. 
Things get nasty when your Kotlin code has to get along with Java code because
libraries are written in Java (so pretty often I guess).

Then, the third kind of type jumps in &mdash; `T!`.
It's called platform type and somehow it means `T` or `T?`.
Or if we want to be precise, `T!` means `T` with undefined nullability.
This weird type can't be denoted in Kotlin, it can be only inferred from Java types. 
`T!` can mislead you because it's relaxed about nulls and disables compile time safety net
in Kotlin code. 

Consider the following Java method:

```java
public class Utils {
    static String format(String text) {
        return text.isEmpty() ? null : text;
    }
}
```

which we want to call from Kotlin. Which type should you use? You have three options.
When you use `String`, the code looks safe but can throw NPE:

```kotlin
fun doSth(text: String) {
    val f: String = Utils.format(text)       // compiles but assignment can throw NPE at runtime
    println ("f.len : " + f.length)
}
```

You need to fix it with Elvis:

```kotlin
fun doSth(text: String) {
    val f: String = Utils.format(text) : ''  // safe
    println ("f.len : " + f.length)
}
```

If you use `String?` &mdash; looks like you are null-safe.
 
fun doSth(text: String) {
    val f: String? = Utils.format(text)   // safe
    println ("f.len : " + f.length)       // compilation error, fine
    println ("f.len : " + f?.length)      // null-safe with ? operator
}

But what if you just let the Kotlin do the fabulous type inferring?

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
 
In my opinion, the type system with all these `!`, `?`, and `!!` is too complex. 
Why Kotlin infers from Java `T` to `T!` and not to `T?`?
Seems like Java interoperability spoils the Kotlin's killer feature &mdash; null-safe type system.     
 

  


