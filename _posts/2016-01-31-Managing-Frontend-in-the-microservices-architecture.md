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

Nowadays at Allegro we have to struggle with old legacy applications, new redesigned services
and page fragments from developer teams. Everything is joined through web application accelerator
also known as a caching HTTP reverse proxy - [Varnish](https://www.varnish-cache.org)

[Varnish Cache](https://www.varnish-cache.org) and it's [ESI LANG](https://www.w3.org/TR/esi-lang) features
allows us to merge a lot of different parts of our platform into one piece. Therefore any page at Allegro could be an separate application/bundle.
Our Varnish farm also describes our platform performance. Because only Varnish servers are exposed to clients out there we're sure that our services
behind won't get all the load if not requested so. Varnish was a bullseye

I'll describe example application (homepage) with header, hero image, recommended offers carousel, last visited offers carousel and footer.

## Header

Long, long time ago (MVC age), there was an master layout of the page - it included a lot of 'partials'.
One of them was AllegroHeader. But during our company expansion header stopped being a simple html container.
It had grown it's own javascript behaviors, had to integrate search, manage basket widget, be responsible for
mobile view of menu, manage shown categories. Along a lot of responsibilities any change in it's viewport was
depending on platform release. I remember when a national wide occasion was a good opportunity to add some 'sparkles'
to our logo. It took a lot of time and effort to release a new version to production.

Hopefully Microservices came to town. It was obvious then that Header should be extracted outside the old core platform.
Team responsible for HeaderService thought that if they could provide a complete html with it's dependencies (js, css, img)
they could replace old html partial inclusion part with an [ESI INCLUDE](https://en.wikipedia.org/wiki/Edge_Side_Includes).

Then we could make header more intelligent and it's configuration could be depended from platform release. YAY Microservices!
It's obvious that now our Header is more dynamic - we even include other ESI inside (thx to [ESI SUROGGATE](https://www.w3.org/TR/edge-arch/))
It's possible to reconfigure it at runtime and deployment process is a lot easier. Not mentioning refreshed technology stack.

Now we are facing new problems.

For example how to provide consistency? Some applications shared old partial file some had it's own implementation and some even copied
html with assets for their own reasons. How to be sure, that our header is the only one out there? What's gonna happen when an app depends
on js library that was provided by original header and will be deleted during next release? We encountered a lot of new problems.

## Hero image

Showcase service has shown up at our company. It worked liked previously described Header. It provided it's full html solution, it was easily
configurable and easy to deploy. Problems with duplicating assets, decomposed css styles and tight coupling with page <head> recurred again.

## Carousels (recommended and last visited)

It was obvious that replacing application logic and views fragments with services using ESI tag was simple and profitable.
So now we also have carousel service. Carousel service can generate stand-alone carousel solution. Under the hood it will request for
user recommendations and last visited offers and show them in consistent and user friendly way. As before, it was easy to manage now.
But what if our stakeholders want to show carousel from search or chosen category - just for fun? For now - in such situation we will
need to develop another functionality in our carousels. Event then we thought that carousel should be just an container for any data
but it had specific logic so far.

### Footer

Footer is the simplest one - it's only html with some styles. It's not manageable but supports i18n.

### What has gone wrong?

The approach seemed simple enough. But was also not easy to extend and to maintain.

Because every page can be a separate web application we cannot ensure that everybody uses our frontend services.
Each component had it's own dependencies, sometimes duplicated or linked to other ones i.e. header & carousel - they both needed our company icon set
- should header expose it to all other? What to do when a page does not have any header at all?
Should carousel should have any fallback for the assets? What about measuring? How to require exact the same measuring solution?
What if footer is written in [AngularJS](https://angularjs.org) and showcases are [React](https://facebook.github.io/react/) compontents?
Or even worse - how to handle two different version of [BackboneJS](http://backbonejs.org) within two services?

Testing one component was really easy, everybody had their own set of tests. Cross modules testing was a real problem.
How to maintain relations between frontend parts? How to be sure that security within them is satisfying? 

We've noticed very fast that this approach should be only temporary because we cannot provide a good level on consistency and
flexibility. We just had to think a better way...

...

## OpBox project &mdash; the new Frontend solution
...

## Future steps
...

