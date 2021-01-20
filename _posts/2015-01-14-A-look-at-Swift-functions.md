---
layout: post
title: A look at Swift functions
author: szymon.tur
tags: [ios, swift, objective-c, xcode, apple]
---

At the beginning of December we published our [first post about Swift](/2014/12/quick-introduction-to-Swift.html "Quick introduction to Swift").
Today we want to continue the Swift thread and introduce a few interesting facts about functions in Swift language.

### Functions basics

If you have ever seen some Objective-C (ancestor of Swift) code you probably remember this weird syntax:

```objective-c
// Method definition
- (NSString *)personWithName:(NSString *)name lastName:(NSString *)lastName age:(NSInteger)age {
    // Method body
}

// Method call
[self personWithName:@"Szymon" lastName:@"Tur" age:27];
```

Swift function syntax looks totally different from Objective-C and is similar to other popular languages like Scala.
Function declaration starts with `func` keyword followed by a list of parameters and returned type.

```swift
func person(name: String, lastName: String, age: Int) -> String {
    return "\(name) \(lastName), \(age)."
}

var myDescription: String = person("Szymon", "Tur", 27)
```

This is a basic example of a function that takes 3 arguments and returns an object (of the `String` type in this example).

One important thing which should be mentioned here is the difference between functions and methods in Swift. As is described in
[Apple’s Swift book](https://developer.apple.com/library/ios/documentation/Swift/Conceptual/Swift_Programming_Language/index.html "Apple’s Swift book")
functions are blocks of code that performs specific tasks. Methods are basically functions encapsulated in classes, structs, or enums.
They’re similar but in some situations they behave differently.

### Parameters

Take a look at the function call from the first listing.

```swift
person("Szymon", "Tur", 27)
```

While reading this code you can assume that function input parameters are first and last name, and age of some person. Of course it’s just a simple example.
I’m sure that in daily programming routine you have to read code that is way more complicated. Usually it’s not possible to check what some parameters
mean without searching the documentation. This is why Swift introduces a feature called **external parameters**.

```swift
func person(firstName name: String, familyName lastName: String, personAge age: Int) -> String {
    return "\(name) \(lastName), \(age)."
}

var me: String = person(firstName: "Szymon", familyName: "Tur", personAge: 27)
```

Each function parameter could have two names: external and local. External parameter name (firstName, familyName, personAge) is used when you call a function
while the local (name, lastName, age) inside the function body. If you want to use the same word as the external and local name you can use a shorter notation by adding **#** character before it.

```swift
func person(#name: String, #lastName: String, #age: Int) -> String {
    return "\(name) \(lastName), \(age)."
}

var me: String = person(name: "Szymon", lastName: "Tur", age: 27)
```

Personally I’m a fan of this solution, because it’s similar to well known Objectve-C syntax. Of course it doesn’t make sense
to always use external parameters names. You should know that when external name is defined it has to be always written when the function is called.

Function parameters can have default values defined in their declarations.

```swift
func hello(name: String = "stranger") {
    println("Hello, \(name)")
}

hello(name: "world") // Hello, world
hello() // Hello, stranger
```

The function in the listing above takes one parameter (of String type) and doesn’t return anything. When you call a function with a default parameter its value can be omitted
(as in the example above). Please remember to put all parameters with default values at the end of parameters list.  It will help to avoid confusing parameters of a function.
Let’s say that we want to write a simple function that sets text and background color of a UILabel.

```swift
func configureLabel(label: UILabel, text: NSString,
    backgroundColor: UIColor = UIColor.orangeColor())
{
    label.text = text
    label.backgroundColor = backgroundColor
}
```

Function `configureLabel` could be called in two ways.

```swift
configureLabel(label, "Hello") // 1
configureLabel(label, "Hello", backgroundColor: UIColor.whiteColor()) // 2
```

If almost all labels in our application should have an orange background the function could be called in the first, short way. However, when there is a need to use some other color
we are still able to add third parameter with our custom one. This is a very flexible solution which makes development faster and code less verbose.

Another thing that should be mentioned are variadic parameters. It means that you can write a method with a variable number of input parameters,
something similar to passing an array. Let’s take a look at the example.

```swift
func sum(values: Int...) -> Int {
    var sum = 0
    for value in values {
        sum += value
    }
    return sum
}
```

As with default parameters, variadic parameter should be placed as the last parameter of the method. Honestly, I don’t use this functionality too often.
For me it’s more natural to pass arrays or other data structures than make usage of variadic params.

### Return values

Until now we were exploring input parameters of the function. It’s time to say a few words about return values.
Functions used in the previous paragraphs were returning String, Int or nothing. Optionals (described in our first Swift article) can be returned
from methods as well. In Swift we can create a function that returns not only one but multiple values by returning tuple type.
This functionality is known for Python and Scala developers. Let’s take a look at the listing below:

```swift
func shortestAndLongest(array: [String]) -> (shortest: String, longest: String) {
    var shortest: String = array[0]
    var shortestCount = countElements(shortest)
    var longest: String = array[0]
    var longestCount = countElements(longest)

    for word in array {
        var wordCount = countElements(word);

        if  wordCount < shortestCount {
            shortest = word
            shortestCount = wordCount
        } else if wordCount > longestCount {
            longest = word
            longestCount = wordCount
        }
    }

    return (shortest, longest)
}

var value = shortestAndLongest(["Warsaw", "Paris", "Rome", "Lisbon", "Barcelona"])
println("\(value.shortest), \(value.longest)")
```

This function takes an array of strings and returns the shortest and longest words. As you can see we don’t need to create two separate functions to calculate two separate values anymore.
It’s enough if we create only one function which returns multiple values. If you have some experience in Objective-C you probably know that using
exceptions isn’t very popular — **NSErrors** are used instead. In the next example let’s create a function which processes some data and returns either a result or an error.

```swift
func processData(data: NSData) -> (processedData: NSData?, error: NSError?) {
    // Function body
}

var result = processData(NSData());
if (result.error != nil) {
  // Handle an error
} else {
  // Do something with result.processedData
}
```

As you see tuples can be very useful when it comes to handling unexpected situations. This pattern of error handling is already known from Objective-C but
Swift way is more elegant and less verbose. Using tuples is very handy, but you must remember to not overuse them.

### Summary

Functions in Swift were designed in a very deliberate way. Hence, they bring many great functionalities for developers. Some of them are described in this article but there still are a few
(e.g. nested functions, function types) that will be covered on our blog in the future. I hope that you enjoyed this post and programming in Swift as well!
