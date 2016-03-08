---
layout: post
title: Microservices and macro mistakes
author: piotr.ciemielewski
tags: [microservice, nanoservice, architecture, antipattern, tech]
---

Microservices architecture has been given a lot of attention in recent years.
You can find many articles defining what it is and explaining the difference
between microservices and monolithic applications. Unfortunately, the dark side
of the solution is rarely mentioned — such as its level of complexity and how difficult it is to
design it correctly.
Nevertheless, I would like to talk about my experience with microservices
architecture. I hope that this article will help you avoid the mistakes I made
and save time.

## Definitions
First, we should begin with defining fine architecture. I find two major features
that make architecture fine — it must be easy to understand and introduction
of any changes should require as little effort as possible. In fact, these features, so crucial in an agile
environment, describe the microservices architecture perfectly. Let’s examine the
issue in a more detailed manner and try to define a single microservice. The best
definition I have heard is the one proposed by
[Adrian Cockroft](https://www.linkedin.com/in/adriancockcroft):

> loosely-coupled service with bounded context, which allows updates without needing
> to understand how everything else works.

[Loose coupling](https://en.wikipedia.org/wiki/Loose_coupling)
and high [cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science))
are the core features
of a microservice that make it so convenient to use. On the other hand, bounded
context is a [Domain Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
term that defines a model in a given domain along
with all the related issues. This covers a consistent context and protects against
implementing any invalid dependencies inside it.

Having learned some basic theory, let’s focus on a practical part and risks one
may face when working in the microservices architecture.

## Antipatterns
### My own piece of architecture
When working on complex projects, we are often divided into many teams responsible
for a given area. We start working by designing our own small ‚garden’ as a separate
entity to make our work convenient and effective. However, by doing so we often keep the
big picture out of sight. This is the very way to end up with an architecture that
reflects the ‚territories’ of particular teams instead of business contexts of
an application. We create a factory that generates unnecessary services and problems
I describe in a section below.

Let’s remember that it is the business context that rules here — we should remember
about it when setting architectural frames and dividing it into microservices.
Naturally, sometimes such division imposes further granularity, but each time the
decision should be well justified due to costs that follow.

### Nanoservices
In the pursuit of trends we tend to split a piece of application to smaller and smaller
chunks when designing it. Instead of building an application based on microservices
that reflect particular contexts, we break the microservices into nanoservices. In an
extreme case, a nanoservice may become a single functionality with a simple model
and interface. Let me quote what [Arnon Rotem-Gal-Oz](https://www.linkedin.com/in/arnonrgo)
wrote in his book SOA Patterns:

> Nanoservice is an Anti-pattern where a service is too fine grained. Nanoservice is
> a service whose overhead (communications, maintenance etc.) out-weights its utility.

Now let’s analyze the negative impact.

As I mentioned, when examining nanoservice’s code and its business logic,
you will notice that most of the code describes communication interface and conversion
objects between interface models, domain models, persistence layers, etc. Unfortunately,
number of lines of code increases too quickly — and keep in mind that every codebase needs
maintenance. Moreover, frequent though simple model-related changes force further
alteration made to the interfaces of numerous services, which eventually extends
[time to market](https://en.wikipedia.org/wiki/Time_to_market).

Another downside involves increased network traffic between services — a chain reaction
that kills application efficiency. As a result, to perform a simple operation
the application must make a series of calls and each call is associated with a network
request. Besides, if you overlook prioritizing service communication within a data center,
the efficiency may be even lower. Naturally, you can think about caching at every level,
but delivering such a service is labor-intensive.

Besides, in this example even bug handling becomes complex. You have to
make sure that an API used by client receives a coherent message and status based on whole
requests chain.

Naturally, you should avoid any extremes and not assume that dividing microservices
is always bad. Instead of creating solutions for the sake of creating them, you
should always respond to your current needs by adjusting the service granularity
and keeping in mind the costs of creating new entities. Remember that microservices provide
you with flexibility that allows you to think about the future on a much smaller
scale without forecasting all the possibilities.

### Mixing contexts
When working on my first projects based upon microservices architecture I followed unduly
the [Don't Repeat Yourself](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
principle. When creating nano-services for micro-functionalities,
you are tempted to use them in other places within a project. Unfortunately, this leads to
mixing models and logic of different business contexts, thus having microservices spaghetti.
As a result, when introducing changes to only one particular context, you may face
an unpleasant surprise.

Let’s analyze the case with a sample e-shop and a product model. We can assume that products
appear in several contexts, e.g. as part of marketing, warehouse and selling content. If you
create a single service to cover all of them, you will notice that each change concerning
sale (e.g. VAT rate) will force suitable changes in marketing content. On the other hand,
entering information about e.g. video content has no value from the point of view of warehouse
business logic. As you can see, the very definition of a product is different in every context
thus each context should include only suitable information. Proper solution should have coherent and
independent contexts and it will be easier to implement any changes as the works will involve
one domain only.

Naturally, you can find plenty of so-called general services, i.e. services that do not belong
strictly to any of the contexts. Just think about services for scaling images or storing files.

### Sharing persistence layer
One of the most common mistakes related to development of services is making them share a
persistence layer. This little sin results in consequences that one becomes familiar with
when working with the monolithic architecture. Low cohesion and high coupling are behind
problems during every code change and cause lack of stability and make the code prone to
errors during development. Besides, if the services communicate through other channels than
a dedicated API, then they are no longer independent. API should always be the only communication
channel between services.

## Summary
Designing a good architecture based on microservices is definitely not a trivial task.
I hope that after reading this article you will avoid the most obvious traps.

To sum up, when designing your code keep the whole project in mind and always remember about business
contexts. Start with larger and coherent services that cover the context. Only then, if
necessary, you can divide the context into smaller microservices. Never use many business
contexts in the same service. On the other hand, never mix the same service in many contexts if
it is closely related to one of them. The architecture has to reflect your current needs.
Do not be over-pragmatic trying to protect yourself against eventualities that may never
take place as the very microservices architecture will protect you against them.
