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
The question is how good we are in integrating them on Fronted.

Typically, to process one HTTP Requests sent by user, we need do collect data from many
Microservices.
For example, when user runs a search query on our site,
we send him the Listing page.
This page collects data from several services: Header, Cart, Search, Category Tree, Listing, CEO, Recommendations.
Some of them provides only data (like Search) and some provides ready-to-serve HTML fragments (like Header).

Each service is maintained by a separate team.
Some teams have excellent Frontend skills but other...,
let’s say that they are really good in doing BigData (Reco, it’s nothing personal:).

Developing modern Frontend isn’t easy, following aspects are involved:

* Classical SOA-style data integration, often done by dedicated service, called Backend for Frontends ot Edge Service.
* Managing frontend dependencies (JS scrips, CSS) required by various HTML fragments.
* Allowing interactions between HTML fragments served by different services
  (example use cases: remove an offer from Recommendations box when it happens to be shown by Listing box).
* Consistent way of measuring users activities (traffic analytics).
* Providing tools for A/B testing.
* Handling errors and slow responses from Backend services.
* There are many Frontends: Web, Mobile... Smart TV and PSP are waiting in the queue.
* Offering excellent UX to users.

And the last 2 things are most important and most challenging.
It means that your Frontend applications should be consistent, well integrated and *smooth*.
Event if they shouldn’t necesserily be monolithic they should *look like* monoliths.

I give you one example from Spotify.
You can listen to the music on a TV set using PS4 Spotify app.
Then you can switch to Spotify app runnign on your laptop.
Both apps give you similar *look an feel*.
Not bad, but do you know that you can control what PS4 plays
by clicking on your laptop? It just works, that’s really impressive.

There are two opposite approaches to modern Frontend architecture.

a. Monolith style.
b. Frankenstein style.


## Current approach at allegro
...

## OpBox project &mdash; the new Frontend solution
...

## Future steps
...

