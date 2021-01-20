---
layout: post
title: Let your tests tell a story
author: mateusz.sulima
tags: [java, scala, testing, bdd, jbehave]
---

In the team that develops Allegro Recommendation Platform we weren’t happy with our integration tests. Long setup and
assertions blocks resulted in a low signal—to—noise ratio and poor readability. These tests were also full of _ad hoc_
variables like `1`, `ABC`, `OK` or `NOK`, which caused that it was hard to find a connection between input and output
data. Moreover, any change in an API caused changes in many tests.

In this article we show how we managed to write integration tests, which are very clean and easy to maintain. Inspired
by [Domain—driven design](https://en.wikipedia.org/wiki/Domain-driven_design) (DDD) ubiquitous language, we introduced
common domain context not just to our business logic, but also to our tests.

We’re using [Scala](http://www.scala-lang.org/) language and [specs2](https://etorreborre.github.io/specs2/) testing
framework in our team, so this article contains a few technical details specific to this toolset. However, ideas
presented in this article are applicable to any framework. They work very well with
[Behavior—driven development](https://en.wikipedia.org/wiki/Behavior-driven_development) (BDD) frameworks, like JBehave,
about which Grzegorz Witkowski recently
[blogged]({% post_url 2015-03-02-acceptance-testing-with-jbehave-and-gradle %}).

### Ubiquitous language in tests

In Domain-driven Design “ubiquitous language” means a common, consistent language between developers and project
stakeholders. We’ve taken this idea a step further and decided that our integration tests will share a common context,
so developers can better understand the system under test and more easily discuss it.

Just like in BDD, every test should be a short story of a user performing an action. Instead of naming users and entities
with _ad hoc_ identifiers like `ABC`, `123` or `foo` we decided to introduce meaningful characters.
To make them easy to distinguish and remember, each one of them has some unique traits.
We reuse these characters in multiple tests. This helps us to quickly understand a test, just by checking which characters it uses.

First step of finding characters was to choose a domain well-known to all of the team members. Picking a pop-culture
domain has the benefit that we can use examples straight from our code base to explain some concepts to our Product Owner
or people outside our team. In our case we’ve considered: James Bond movies, Marvel comics universe
and the Witcher books. Finally we’ve picked the Lord of the Rings, because everyone read the books or watched the movies.

Once we’ve picked the domain, we needed to select characters that would suit our needs. They should be easy to remember
and have traits that can be connected to application's domain. There should be a few characters, and every character
should have some unique set of attributes. After some time developers remember that these characters’ names have
special meaning in context of usage. They can be easily reused in many tests, which removes unnecessary code duplication.

In our case Gandalf is going to buy and sell things related to wizardry, like magic hats or staffs. Saruman posts items,
which usually are of poor quality and we should not recommend them for other users. We’ve even picked a
“black character” — Sauron — who always posts invalid input.

More possible examples in different application domains are:

- Finance — James Bond movies, using characters like James Bond, Goldfinger, Miss Moneypenny.
- Education — Harry Potter books.
- Health Care — medical drama like ER, Grey’s Anatomy or House M.D.

### Example

Let’s consider a simple case — request for recommendations from a new anonymous user, who doesn’t have any browsing
history. The most basic recommendation that we can show to him is just some bestselling item in the category which he’s
browsing right now. We could implement it in the following way:

```
Scenario: recommendations for an anonymous user in a category listing.
Given an Item 1 in Category A and an Item 2 in Category B
When anonymous user visits Category A
Then he sees Item 1 as recommended item
```

Here’s the same example, but using characters and items from our domain:

```
Scenario: recommendations for an anonymous user in a category listing.
Given a Gold Ring and a Wooden Staff
When anonymous user visits a Magic Rings category
Then he sees a Gold Ring as recommended item
```

In our opinion the second scenario is more readable, as it’s obvious that Wooden Staff doesn’t match Magic Rings
category.

### Implementation

We did not use dedicated BDD framework, but decided to create our own components, which try to encapsulate performed
business logic and hide implementation details. We call them “manipulators” and they have three purposes:

- Setting a system under test to initial state.
- Performing actions on the service.
- Getting data from service on which assertions can be performed.

Internally manipulators can perform whatever is required to set the application in desired state or to verify it.
This includes REST requests, direct method calls, execution of SQL scripts, etc. We try to reuse manipulators between
tests, because it limits the number of places we have to modify in case of API changes.

We’ve implemented the simple recommendation scenario mentioned above as:

```scala
"serve bestsellers in visited category" in {
  // given
  itemsManipulator.postMagicStaff()
  itemsManipulator.postGoldenRing()

  // when
  val recommendations = recommendationsManipulator.
    categoryListing(MagicRingsCategoryId)

  // then
  recommendations.items.map(_.itemId) must contain(exactly(GoldRingId))
}
```

In our opinion this solution hides all implementation details from test, giving readability comparable to specialized
BDD frameworks like JBehave. Moreover, we still have benefits of compile-time checks, code highlighting and IDE
refactorization support. We could go a little further and use more Scala-specific features like postfix notation,
implicit methods etc. but it adds complexity. This is a trade-off which you have to consider on your own.

### More examples

Dan North in his [Introducing BDD](http://dannorth.net/introducing-bdd/) article gives an ATM cash withdrawal example:

```
+Scenario 1: Account is in credit+
Given the account is in credit
And the card is valid
And the dispenser contains cash
When the customer requests cash
Then ensure the account is debited
And ensure cash is dispensed
And ensure the card is returned
```

If we were working in a banking domain, we would probably choose James Bond movies domain. We could reflect these steps
by using manipulators and our own specs2 matchers to implement this scenario as follows:

```scala
"Scenario 1: Account is in credit" in {
  val `James Bond` = customersManipulator.createJamesBond()
  val account = accountsManipulator.jamesBondSwissAccount()
  val card = cardsManipulator.jamesBondPlatinumCreditCard()
  val cash = 1000
  val dispenser = dispensersManipulator.dispenserWithCash(cash)

  dispenser.withdraw(`James Bond`, card, cash)

  account must beDebitedWith(cash)
  cash must beDispensedTo(`James Bond`)
  card must beReturnedTo(`James Bond`)
}
```

We admit that the Scala implementation is not as readable as _pure_ BDD specification. However in our opinion when there
are a lot of tests, reusing characters makes it easier to write new tests and see differences between existing ones.
Another benefit is that we may still use plain Scala, without introducing new tools.

### Summary

Picking a domain for tests makes them easier to write and understand. A set of well-know characters with unique
attributes adds valuable context to tests and helps remove repetitions. The domain is also well-known to
Product Owner, so this enables us to communicate more efficiently.

To implement test cases we used the technical stack that we were already familiar with. We encapsulated logic for
test setup and results verification into separate components, which made the code more maintainable.
