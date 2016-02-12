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
and communicate over the REST API.
Of course, microservice should be loosely-coupled from its neighbours.

Things gets complicated when we need to
use microservices as building blocks for a Fronted solution.
So how to build a consistent website or a mobile app
from tens or sometimes hundreds microservices?

In this post we describe our current Web Frontend approach
and the New One, meant as the small revolution.

## Doing Frontend in the Microservices World is tricky
Our users don’t care how good we are in dividing our Backend into Microservices.
The question is how good we are in integrating them in a user’s browser.

Typically, to process one HTTP Requests sent by user, we need do collect data from many
Microservices.
For example, when user runs a search query on our site,
we send him the Listing page.
This page collects data from several services: Header, Cart, Search, Category Tree, Listing, CEO, Recommendations.
Some of them provides only data (like Search) and some provides ready-to-serve HTML fragments (like Header).

Each service is maintained by a separate team.<br/>
Some teams have excellent frontend skills but other...<br/>
Let’s say that they are really good in doing BigData.<br/>

Developing modern Frontend isn’t easy, following aspects are involved:

* Classical SOA-style data integration, often done by dedicated service, called Backend for Frontends or Edge Service.
* Managing frontend dependencies (JS, CSS scripts) required by various HTML fragments.
* Allowing interactions between HTML fragments served by different services
  (example use cases: remove an offer from Recommendations box when it happens to be shown already by Listing box).
* Consistent way of measuring users activities (traffic analytics).
* Content customization.
* Providing tools for A/B testing.
* Handling errors and slow responses from Backend services.
* There are many Frontend devices: Web browser, mobile... Smart TV and PlayStation® are waiting in the queue.
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
Seams between page fragments becomes visible, number of page-level interactions is limited.
Even in page scope, each page fragment may look or even worse behave in a different way.
Pretty much like the Frankenstein monster.

**Between Monolith and Frankenstein** there is a whole spectrum of possible architectures.
What we want to build is the desirable middle ground between these two extremes.

Next, we describe the current approach at Allegro, which is close to the Frankenstein extreme
and the New Solution, which goes more into the Monolith direction.

## Current approach at Allegro

Nowadays at Allegro we have to struggle with legacy, monolithic application
(written on PHP) and with many new Microservices (written mostly in Java).
Everything is integrated by [Varnish Cache](https://www.varnish-cache.org) &mdash;
web application accelerator (a caching HTTP reverse proxy).

Varnish and its [ESI LANG](https://www.w3.org/TR/esi-lang) features
allows us to merge a lot of different parts of our platform into one website.
Therefore any page (or page fragment) at Allegro
can be a separate application/service.

Our Varnish farm also defines and greatly improves our overall performance.
Varnish servers are exposed to users and they caches all requests for static content.
We often say that *we are hiding behind Varnish* to survive massive traffic from our users.

Varnish really hit the bull’s-eye.

Below, we describe one page fragment, included in each page &mdash; the Header.

#### Header
// TODO bez Long, long time ago
// opiszmy po prostu jak teraz działa header

Long, long time ago (MVC age), there was an master layout of the page - it included a lot of 'partials'.
One of them was AllegroHeader. But during our company expansion header stopped being a simple html container.
It had grown it's own javascript behaviors, had to integrate search, manage Cart widget and be responsible for
the navigation bar.

How to provide assets consistency?
What's gonna happen when an app depends
on js library that was provided by header and will be deleted during next release?
We encountered a lot of new problems.

#### What has gone wrong?

Each page fragment comes with its own set of frontend assets: CSS, JS scripts, fonts and images.
At the page level, it sometimes leads to duplications and version conflicts.
Many page fragments depend implicitly on assets provided by the Header fragment.

But what if we want to create a page without any Header at all?
Or even worse &mdash;
how to handle two different version of [React](https://facebook.github.io/react/) within a single page?

Current approach based on Varnish server-side includes is
flexible, scalable and easy to develop but unfortunately, it’s hard to maintain.

Moreover, because every page fragment is a separate web application, it’s really hard to ensure
consistent look and feel on the website level.

We just had to think a better way...

## OpBox project &mdash; the new Frontend solution

Unofficial polish name of the OpBox project
is *Opierdalacz Boxów*, unfortunately there is no good english translation for this name.
Closest would be: *Box Manager*.

So Box is the main concept in our solution. What is Box after all?
Box is reusable, high-level fronted component, feedable from JSON data source.
Box can have slots, in each slot, you can put more Boxes.
Box can be rendered conditionally (for example, depending on A/B test variant).
Page is assembled from Boxes.

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

