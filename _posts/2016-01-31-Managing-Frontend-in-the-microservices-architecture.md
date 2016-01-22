---
layout: post
title: Managing Frontend in the Microservices Architecture
author: [bartosz.galek, bartosz.walacik, pawel.wieladek]
tags: [tech, frontend, microservices, architecture]
---

[Microservices](http://martinfowler.com/articles/microservices.html)
are now mainstream approach for scalable systems architecture.
There are little controversy when we are talking about designing Backend services.
Well-behaved backend microservice should cover one
[BoundedContext](http://martinfowler.com/bliki/BoundedContext.html)
and communicate over REST API.
Of course, microservice should be loosely-coupled from its neighbours.

Things gets complicated when we need to
use microservices as building blocks for a Fronted solution.
So how to build a consistent website or mobile app
from tens or sometimes hundreds microservices?

In this post we describe our current Web Frontend approach
and the New One, meant as a small revolution.

## Doing Frontend in the Microservices World is tricky
Our users don’t care how good we are in dividing our Backend into Microservices.
The question is how good we are in integrating them in a browser.

Typically, to process one HTTP Requests sent by user, we need do collect data from many
Microservices.
For example, when user runs a search query on our site,
we send him the Listing page.
This page collects data from several services: Header, Cart, Search, Category Tree, Listing, CEO, Recommendations.
Some of them provides only data (like Search) and some provides ready-to-serve HTML fragments (like Header).

Each service is maintained by a separate team.
Some teams have excellent Frontend skills but other...,
let’s say that they are really good in doing BigData.

Developing modern Frontend isn’t easy, following aspects are involved:

* Classical SOA-style data integration, often done by dedicated service, called Backend for Frontends or Edge Service.
* Managing frontend dependencies (JS scrips, CSS) required by various HTML fragments.
* Allowing interactions between HTML fragments served by different services
  (example use cases: remove an offer from Recommendations box when it happens to be shown by Listing box).
* Consistent way of measuring users activities (traffic analytics).
* Content customization.
* Providing tools for A/B testing.
* Handling errors and slow responses from Backend services.
* There are many Frontend devices: browser, mobile... Smart TV and PlayStation® are waiting in the queue.
* Offering excellent UX to all users (omnichannel).

And the last 2 things are most important and most challenging.
It means that your Frontend applications should be consistent, well integrated and *smooth*.
Event if they shouldn’t necesserily be monolithic they should *look like* a monolith.

I give you one example from Spotify.
You can listen to the music on a TV set using PS4 Spotify app.
Then you can switch to Spotify app runnign on your laptop.
Both apps give you similar *look an feel*.
Not bad, but do you know that you can control what PS4 plays
by clicking on your laptop? It just works, that’s really impressive.

There are two opposite approaches to modern Frontend architecture.

a. Monolith approach,
b. Frankenstein approach

**Monolith approach** is dead simple: one Frontend team creates and maintains one Frontend application,
which gathers data from backend services using REST API. This approach have one huge advantage, if done right,
provides excellent user experience. Main disadvantage is that it doesn’t scale well. In a big company,
with many development teams,
single Frontend team could become a development bottleneck.

In **Frankenstein approach** (shared nothing) approach,
Frontend application is divided into modules and each module is developed independently by separated teams.

In Web applications modules are HTML page fragments (like Header, Cart, Search).
Each team takes whole responsibility for their product. So a team develops not only backend logic 
but also provides endpoint which serves HTML fragment with their *piece of Frontend*.
Then, HTML page is assembled using some low level server-side include technology like ESI tags.

This approach scales well, but the big disadvantage is lack of consistency on the user side.  
There are seams between page fragments, number of page-level interactions is limited.
Pretty much like Frankenstein monster.

Between Monolith and Frankenstein there is a whole spectrum of possible architectures.
We want to build is the desirable middle ground between these two extremes.

Next, we describe current approach at Allegro, which is close to Frankenstein extreme
and the new solution, which goes more into Monolith direction. 
 
## Current approach at Allegro

Nowadays at Allegro we have to struggle with legacy applications and new Microservices.
Everything is joined by [Varnish Cache](https://www.varnish-cache.org) 
web application accelerator (a caching HTTP reverse proxy). 

Varnish and it's [ESI LANG](https://www.w3.org/TR/esi-lang) features
allows us to merge a lot of different parts of our platform into one piece. Therefore any page at Allegro
can be an separate application/service.
Our Varnish farm also defines our platform performance.
Because only Varnish servers are exposed to users, we're sure that our services
behind won't get all the load. Varnish was a bullseye.

I'll describe example application (homepage) with Header, Hero Image, Recommendations,
Last Visited and Footer.

### Header

Long, long time ago (MVC age), there was an master layout of the page - it included a lot of 'partials'.
One of them was AllegroHeader. But during our company expansion header stopped being a simple html container.
It had grown it's own javascript behaviors, had to integrate search, manage Cart widget and be responsible for
the navigation bar.

How to provide assets consistency? 
What's gonna happen when an app depends
on js library that was provided by header and will be deleted during next release?
We encountered a lot of new problems.

### Hero image

It works like previously described Header. It provides it's full HTML, it is easily
configurable and easy to deploy.
Problems with duplicating assets, decomposed css styles and tight coupling with page `<head>` recurred again.

### Carousels (recommended and last visited)

Carousel service can generate stand-alone carousel solution. Under the hood it will request for
user recommendations and last visited offers and show them in consistent and user friendly way. 
But what if our stakeholders want to show carousel from search or chosen category - just for fun? 
For now - in such situation we will need to develop another functionality in our carousels.
Carousel should be just an container for any data but it has specific logic so far.

### What has gone wrong?

The approach seemed simple enough. But was also not easy to extend and to maintain.

Because every page can be a separate web application we cannot ensure that everybody uses our frontend services.
Each component had it's own dependencies, sometimes duplicated or linked to other ones i.e. header & carousel
- they both needed our company icon set - should header expose it to all other?
What to do when a page does not have any header at all?
Should carousel have any fallback for the assets? What about measuring? 
How to assure exact the same measuring solution?
What if footer is written in [AngularJS](https://angularjs.org) and showcases are [React](https://facebook.github.io/react/) 
compontents? Or even worse - how to handle two different version of [BackboneJS](http://backbonejs.org) within two services?

Testing one component was really easy, everybody had their own set of tests. Cross modules testing was a real problem.
How to maintain relations between frontend parts? How to be sure that security within them is satisfying? 

We've noticed very fast that this approach should be only temporary because we
cannot provide enough consistency and
flexibility. We just had to think a better way...

## OpBox project &mdash; the new Frontend solution

Unofficial polish name of the OpBox project
is *Opierdalacz Boxów*, unfortunately there is no good english translation for this name.
Closest would be: *Box Manager*.


 
So Box is the main concept of our solution.
What is Box?

### OpBox principles:
-- obrazek

#### dynamic page creation (CMS-like)

#### reusable frontend component

#### separating View from Data Sources

#### conditional content (profiling)

#### frontend dependencies management

#### consistent traffic analytics

#### omnichannel (many Renderers)

#### Page Definition separeted from Renderers

#### future: Component Event Bus

#### one place for integration all backend services through REST API

### How we did it
-- obrazek

#### core BG

#### web BW

#### admin PW lub BW

#### Mobile Adapter BG


## Future steps
...

