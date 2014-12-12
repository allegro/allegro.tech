---
layout: post
title: Quick introduction to Swift
author: szymon.tur
tags: [swift, objective-c, ios, apple, playgrounds, xcode]
---

Introduction of [Swift](https://developer.apple.com/swift/ "Swift") programming language during WWDC 2014 was big news in developers' world. The community
warmly welcomed the language created by Apple and many developers started learning and using it immediately.
This article explains what Swift is and its basic concepts. If you are an iOS (or OS X) developer it means that you probably already know all the
things described below, but if you haven't started your iOS development adventure yet (but you want to), this article could be a good introduction for you.

![Swift](https://devimages.apple.com.edgekey.net/home/images/home-hero-swift-hero.png  "Swift logo")

(source [Apple](https://developer.apple.com/ "Apple"))

## An Objective-C successor

Objective-C is the language widely used to create applications for Apple devices. This language is already 30 years old, that's quite a lot of time.
This verbose language with complicated syntax doesn't make a good impression so developers were not very willing to learn it. This is one of the
reasons why iOS developers' community is small when compare to the size of the market. It's not surprising that introducing the Objective-C replacement
language with many cool features caused applause in the Apple developers' community.

Everyone who wants to start experimenting with Swift can use a great tool provided by Apple called Playgrounds. It allows you to write code and
see the result immediately. You don't have to compile and run your code on the simulator or a device. I love to use it when I'm searching for a solution
to some algorithmic problem. Actually, I'm using it now to write examples to this article :)
To use Playgrounds you need to install [Xcode](https://developer.apple.com/xcode/downloads/) (version 6.0 or higher).

![Playgrounds](https://devimages.apple.com.edgekey.net/swift/images/swift-screenshot.jpg  "Playgrounds")

(source [Apple](https://developer.apple.com/swift/ "Apple"))

If you have Xcode 6 already installed just create a new Playground (File -> New -> Playground…), save it and start developing in Swift.

## Variables

Let's start with variable declaration:

```swift
var company: String = "Allegro"
var year: Int = 2014
var active: Bool = true

company = "Allegro Group"
year = 2013
active = false
```

To create a variable we need to use `var` keyword followed by a name, type (not obligatory, it's explained later). After the var declaration we could
give it a value. As you can see, in Swift semicolons are not obligatory, but you still can use them.

## Constants

Creating a constant is very similar to the previous example, but instead of `var` we must use `let` keyword. Of course, after initializing a constant
we cannot change its value.

```swift
let name: String = "Anna"
let temperature: Double = 36.6

temperature = 36.7 // Error
```

## Type inference

In the two paragraphs above we declared variables and constants by providing their names and types. Actually, in Swift we can omit the data type in
the declaration and compiler infers the type (if possible). It is possible when developer provides an initial value for the variable or constant.

```swift
let country = "Poland" // Constant country inferred as String
var population = 36.49 // Variable population inferred as Double
```

The listing above shows how to initialize variables and constants without providing their data types. Personally, I'm not a huge fan of this feature.
Of course it makes the code less verbose, but for me it also makes it a bit more complicated to understand.
One thing that should be mentioned here is that floating-point numbers are always inferred as **Double**.

## Collection Types

In Swift, we have two collection types: `Array` and `Dictionary`. Both of them are mutable if not declared as constants. It means that you can add
elements and modify them later in different places in code.
Arrays and dictionaries can contain only values of one type (Strings, Bools, Floats, etc.). It is different approach than Objective-C where we were
able to put data of many different types into the same collection. It was handy, but on the other hand it caused many errors during runtime.
I assume that everyone knows arrays so I'm not going to explain them. A dictionary is a collection that keeps values associated with their unique keys.
Objects inside the dictionary are not ordered and you can access them only using their identifiers (keys).

```swift
// Creating arrays
var results: [Float] = [11.0, 10.9, 12.223]
var cities = ["Poznan", "Warszawa", "Torun", "Wroclaw"]
var mixedArray = ["Poznan", 11.0] // Error.

// Creating dictionaries
var students: [Int: String] = [1: "John", 2: "Mark", 3: "Jane"]
var populations = ["Poznan": 552735, "Krakow": 755546]
var mixedDictionary = [1.0: "Warszawa", 2.0: 111] // Error

// Adding elements
cities.append("Krakow")

// Accessing elements
var city = cities[0]
var cityPopulation = populations["Poznan"]

println("Population of \(city) is \(cityPopulation).")
```

The code above shows how we can create, modify and access arrays and dictionaries. The example uses two different ways of creating arrays — using type
inference and without it. Actually there is one more way to create an array `var name: Array<Type>`, but personally I prefer to use shorter and more
readable forms presented in the example. Similar situation is with dictionaries — you can use `var name: Dictionary<Key: Value>` initializer.
The last line just prints sample data fetched from our collections.

## Optionals

Until now all the described conventions were already known from Objective-C. Time to discuss something new.
It is called optional values. When we declare a variable (as we did at the beginning of this article) it is a non-optional by default, so it always
must contain some value. We cannot set its value to nil. If we want to have a variable that could be set to nil we must create an optional variable.
To achieve this we have to add a question mark (?) after the variable type.

```swift
var city: String
var cityPopulation: Int?

city = nil // Error.
cityPopulation = nil // That's correct
```

In other words, creating a variable of optional type means that it can contain either some value (e.g. Int) or `nil`. You have to remember that
it's not an Int variable that could be nil. It's literally a nothing or integer value. So whenever you see a declaration of a variable with
question mark you will know that it can be nil.


### Unwrapping

Since optionals can contain nil values we have to be careful when using them. Luckily, the compiler warns us when we try to use optionals in incorrect way.

```swift
var name: String?
var hello = "Hello " + name // Compiler error.
```

The example above produces a compiler error because we try to use a optional value without checking its value before. So how can we use it? There are
two possibilities. First one is called **optional binding**, which is safer but requires more code. In the listing below we use this technique to
get a value of optional name to build a simple string.

```swift
var name: String?

if let unwrappedName = name {
    var welcome = "Hi " + unwrappedName // Now it doesn't cause a compiler error.
} else {
    var welcome = "Hi!"
}
```

When we are sure that some optional won't be nil, then we can unwrap it using `!` operator. Using this technique brings a risk of runtime error,
so we have to be careful with it.

```swift
var name: String? = "Anna"
var welcome = "Hi " + name!
```

Optionals are one of the most important features in Swift language so it's really important to know them well. I believe optionals are one of the
things that make Swift a safe language. By giving us compile-time errors it protects our application from a crash. It might take some time to get used
to optionals, but it's really worth it.

## Summary

As you can see, Apple gathered many good practices known from other languages to a create brand new programming language. Like most developers, we are still at the beginning of our adventure with Swift. This language is getting more and more popular and we see it as a future of iOS and OS X development.
Hopefully, after reading this article you became more interested in learning Swift. If you want to get more familiar with this language, please follow
this blog — we are going to explore functions and methods in Swift shortly.
