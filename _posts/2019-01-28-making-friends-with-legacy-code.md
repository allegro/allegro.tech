---
layout: post
title: Making friends with legacy code
author: wojciech.jurczyk
tags: [cleancode, craftsmanship, tests, legacy]
---

What kind of builders do you use in your tests? Do you use the old good builders
where properties are set by a withProperty method? Or maybe, you use builders
that make use of closures? As soon as I joined my team, I found out that there
is another approach to test builders, and it embraces maps. It seemed
innovative, but after a while, it became annoying legacy code. After one of
the debugging sessions, I decided to get rid of it, but the monster fought me
back.

### Peculiar test builders

When I joined the team, I noticed that test builders were constructed in a
very strange way. There was no class with a group of setters and a build()
method. Instead, there was a class with a static map called `defaults` that had
all default values for domain object’s properties, and a factory method that
took another map with overrides. Let’s take a look at an example Kotlin domain
object and the corresponding Groovy map-based test builder:

```kotlin
data class DomainObject(id: String, size: Long, createdAt: DateTime)
```

```groovy
class DomainObjectTestBuilder {
  private DomainObjectTestBuilder() {}

  private static final def defaults = [
    "id"       : "object-1",
    "size"     : 100,
    "createdAt": "2019-04-23"
]

static DomainObject domainObject(Map params = [:]) {
  def args = defaults + params
  return new DomainObject(
    args.id,
    args.size,
    DateTime.parse(args.createdAt)
  )
}
```

DomainObjects creation is straightforward and would look like this:

```groovy
def obj = domainObject([
  id       : "some-object-id",
  createdAt: "2019-10-07"
])
```

This approach to test builders was peculiar to me and I started wondering why we
use builders like this. In comparison to “classic” method-based builders, I
didn’t see any killer-feature. Passing properties’ values using methods in
method-based builders give more type-safety than using arbitrary maps. IDE
doesn’t hint what properties can be set. Moreover, you can make a typo in a
property’s name, and, if you’re lucky a runtime exception will be thrown. If
you’re not, you’ll spend hours in debugging sessions in frustration wondering
why the test does not pass. In the worst case, the test will pass (because of
defaults) and you’ll release with a bug.

### Trying to replace legacy code

I couldn’t find any good reason why we were using map-based builders. My teammates
didn’t really know the reason, either. Maybe the person that introduced the
approach does not work with us anymore? Maybe the approach seemed elegant and
innovative? Maybe we didn’t know much about Groovy at the time we introduced
map-based builders? So why bother?

After another debugging session that ended with fixing a typo in the test
builder, I was full of anger and decided to get rid of map-based builders. To
make a [decision](https://www.youtube.com/watch?v=EauykEv_2iA), I started
experiments with different approaches to see what would fit us best.

The “classic”, method-based builders seem to be the best if you care about
type-safety and IDE hints. On the other hand, you have to repeat the build
method.

In Groovy, builders can be defined in a number of different ways. One of the
possibilities is the
[@Builder](http://docs.groovy-lang.org/2.4.15/html/gapi/groovy/transform/builder/Builder.html)
annotation. However, this approach doesn't work with immutable classes.

Also, there’s another, but similar type of builders. It uses functions where
certain properties are set. In Groovy it might be Closures, and I’ll refer to
them as closure-based builders:

```groovy
def obj = domainObject {
    id = "some-object-id",
    createdAt = "2019-10-07"
}
```
The idea behind this kind of builders is to have a method that has a name
corresponding to the domain object and takes a closure as a parameter. In the
closure, the values are assigned to a mutable, temporary object, and then passed
to the DomainObject's constructor:

```groovy
class DomainObjectGroovyDelegatedClosureBuilder {
    String id = "object-1"
    Int size = 100
    DateTime createdAt = DateTime.parse("2019-04-23")

    private DomainObject build() {
        new DomainObject(
                id,
                size,
                createdAt
        )
    }

    @TypeChecked
    static DomainObject domainObject(
            @DelegatesTo(
                    value = DomainObjectGroovyDelegatedClosureBuilder,
                    strategy = Closure.DELEGATE_ONLY)
                    Closure closure
    ) {
        final DomainObjectGroovyDelegatedClosureBuilder builder = new DomainObjectGroovyDelegatedClosureBuilder()
        builder.with closure
        builder.build()
    }
}
```

The usage looks almost the same as in the map-based approach, but we gain some
type-safety and IDE hints. In case of maps, IDE’s automatic formatting can
easily align field names and values in columns, but it can't format this way
automatically in the case of closures.

Closure-based builders allow you to hide the build method inside the factory method,
and the usage looks really similar to map-based approach. However, using
Closures confuse IDE and the hints you get are sometimes not as precise
as in method-based builders.

### If you can’t beat them, join them

I was trying to adapt our code to method- and closure-based builders, but every
time I felt dissatisfied. I found out I was used to the map-based builders. The
code in each approach looked misformatted and wordy. I value both the quality
and the beauty of the code, but in this case, ugliness was not enough to stop me
from trying to throw away map-based builders. However, I was uncertain whether
it was worth rewriting tons of tests to a different approach. I wasn’t sure
about the gains. Then, I found a case where map-based builders won.

In some of the tests, we build objects with incorrect values. We
build an object that has certain properties with correct values and other
properties with incorrect. To achieve that, we add two maps.

```groovy
given:
def aCertainCorrectState = ["size": 100]
def obj = domainObject(aCertainCorrectState + incorrectProperties)

// ...

where:
incorrectProperties << [[createdAt: "2018-10-07"] /*, other cases */]
```

Of course, a similar thing can be achieved in method-based builders by
overloading the plus operator. However, doing so for every domain object test
builder sounds like lots of boilerplate where stupid mistakes can happen. The same applies to closure-based builders. Adding a map to
another is a simple operation that is easy to write and read. This is what I
need for tests!

Using map-based builders is concise. IDE formats the code in a pretty way. It
looks to me more declarative than imperative, which plays well with the given
section of the tests. Moreover, if we don’t switch the approach, then our code
will stay uniform. If we don’t switch the approach, we save a lot of time on
rewriting tests (or maintaining two approaches). So what’s missing in the
map-based approach? Even though IDE does not suggest properties’ names and even
though type errors are uncovered at runtime instead of compile time, the
important thing is that this approach doesn’t save you from making typos.

To fix the most important issue, in the factory method, before we sum both maps
we have to assure that the map from parameters contains only correct keys. Easy
as it sounds! The simplest solution could be as follows:

```groovy
def verifyPropertyNames(Map defaults, Map properties) {
   def allowedPropertyNames = defaults.keySet()
   def candidatePropertyNames = properties.keySet()
   def illegalProperties = candidatePropertyNames - allowedPropertyNames
   if (!illegalProperties.empty) {
       throw new IllegalArgumentException(
         "Validation failed. Unknown properties: " + illegalProperties)
   }
}

static DomainObject domainObject(Map params = [:]) {
   verifyPropertyNames(defaults, params)
   def args = defaults + params
   return new DomainObject(
      args.id,
      args.size,
      DateTime.parse(args.createdAt)
   )
}
```

This six-line method saved a lot of time. Builders became typo-proof and we
spend less time debugging. We don’t have to rewrite test builders. We don’t
have to maintain builders in two different approaches. Moreover, after adding
verifyPropertyNames to the rest of the builders we discovered a couple of typos
were passing anyway. Luckily, no bugs this time. The code became less error
prone. The “legacy code” was actually a pretty good piece of code, but with
previously unsolved problems.

### Conclusion

My battle with map-based builders reminds me of a couple of things.
First, different approaches have different advantages, but also disadvantages.
Which one is the best? Well, it depends on what you value the most.
Second, switching an approach may cost a lot. Sometimes more than the actual
gain of the change, so make the decisions wisely. Third, legacy code can be a
dangerous monster, but in some cases, it is better to make friends instead of
killing it (evolution over revolution). Forth, sometimes we overuse the term
“legacy code”. Just because we can’t fix it, it doesn’t mean it’s legacy.
