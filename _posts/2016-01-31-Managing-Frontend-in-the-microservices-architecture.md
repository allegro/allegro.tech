---
layout: post
title: Managing Frontend in the Microservices Architecture
author: [bartosz.galek, bartosz.walacik, pawel.wieladek]
tags: [tech, frontend, microservices, architecture]
---

[Microservices](http://martinfowler.com/articles/microservices.html)
are now mainstream approach for scalable systems architecture.
There is little controversy when we are talking about designing backend services.
Well-behaved backend microservice should cover one
[BoundedContext](http://martinfowler.com/bliki/BoundedContext.html)
and communicate over the REST API.
Of course, microservice should be loosely-coupled from its neighbours.

Things gets complicated when we need to
use microservices as building blocks for a fronted solution.
So how to build a consistent website or a mobile app
from tens or sometimes hundreds microservices?

In this post we describe our current Web Frontend approach
and the New One, meant as the small revolution.

## Doing frontend in the microservices world is tricky
Our users don’t care how good we are in dividing our Backend into Microservices.
The question is how good we are in integrating them in a user’s browser.

Typically, to process one HTTP Requests sent by user, we need do collect data from many
Microservices.
For example, when user runs a search query on our site,
we send him the Listing page.
This page collects data from several services: AllegroHeader, Cart, Search, Category Tree, Listing, SEO, Recommendations.
Some of them provides only data (like Search) and some provides ready-to-serve HTML fragments (like AllegroHeader).

Each service is maintained by a separate team.<br/>
Some teams have excellent frontend skills but other...<br/>
Let’s say that they are really good in doing BigData.<br/>

Developing modern Frontend isn’t easy, following aspects are involved:

* Classical SOA-style data integration, often done by dedicated service, called Backend for Frontends or Edge Service.
* Managing frontend dependencies (JS, CSS scripts) required by various HTML fragments.
* Allowing interactions between HTML fragments served by different services.
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

<ol type="a">
  <li>Monolith approach</li>
  <li>Frankenstein approach</li>
</ol>

**Monolith approach** is dead simple: one Frontend team creates and maintains one Frontend application,
which gathers data from backend services using REST API. This approach have one huge advantage, if done right,
provides excellent user experience. Main disadvantage is that it doesn’t scale well. In a big company,
with many development teams,
single Frontend team could become a development bottleneck.

In **Frankenstein approach** (shared nothing) approach,
Frontend application is divided into modules and each module is developed independently by separated teams.

In Web applications modules are HTML page fragments (like AllegroHeader, Cart, Search).
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

![ESI Page Example](/img/articles/2016-01-31-Managing-Frontend-in-the-microservices-architecture/allegro_esi_homepage.png "esi page example")

Our Varnish farm also defines and greatly improves our overall performance.
Varnish servers are exposed to users and they caches all requests for static content.
We often say that *we are hiding behind Varnish* to survive massive traffic from our users.

Varnish really hit the bull’s-eye.

Below, we describe one page fragment, included in each page &mdash; the AllegroHeader.

**Allegro Header** is a service that returns complete HTML/JS/CSS application — so it can be easily included
as the varnish ESI tag at the beginning of any webpage. Under the hood it collects data from few other services
like category service or cart service. It integrates search box and it’s responsible for top level messages
(cookies policy warning, under maintenance banner).

### What has gone wrong?

Each page fragment comes with its own set of frontend assets: CSS, JS scripts, fonts and images.
At the page level, it sometimes leads to duplications and version conflicts.
Many page fragments depend implicitly on assets provided by the AllegroHeader fragment.

But what if we want to create a page without any AllegroHeader at all?
Or even worse &mdash;
how to handle two different version of [React](https://facebook.github.io/react/) within a single page?

Current approach based on Varnish server-side includes is
flexible, scalable and easy to develop but unfortunately, it’s hard to maintain.

Moreover, because every page fragment is a separate web application, it’s really hard to ensure
consistent look and feel on the website level.

We just had to think a better way...

## OpBox project &mdash; the new Frontend solution

So Box is the main concept in our solution. What is Box after all?

* Box is reusable, high-level fronted component.
* Box is feedable from a JSON data source.
* Box can have slots, in each slot, you can put more Boxes.
* Box can be rendered conditionally (for example, depending on A/B test variant).
* Page is assembled from Boxes.

<p style="text-align: center; background-color:#E3E3E3">
    <img alt="OpBox goals" style="width:75%; padding-top:10px;" src="/img/articles/2016-01-31-Managing-Frontend-in-the-microservices-architecture/opbox-goals.png" />
</p>

### OpBox principles

Below, we describe principles of OpBox architecture and functionality.
Most of them are already implemented and battle-tested. Last two are
in the design phase.

**Dynamic page creation (CMS-like)**<br/>
Pages are created and maintained
by non-technical users in our Admin application.

**Reusable components**<br/>
Each page is assembled from boxes like AllegroHeader, ShowCase, OfferList, Tabs.
Boxes are configured to show required content, typically provided via
REST API by backend services.

**Separating View from Data Sources**<br/>
Box is a high-level abstraction, it joins two things:

  * Frontend design (often referred as View).
    Concrete View implementation is called Frontend Component.
    For example, our ShowCase box has two Frontend implementations: Web and Mobile.
  * Data Source (REST service) which feeds data for Frontend Components.
    One Component can be feeded by any Data Source as soon as its API matches Box contract.
    For example, Offer component knows how to present nice offer box
    with offer title, price, image and so on.
    Since Offer component is decoupled from Backends by Box contract abstraction,
    it can show offers from many sources: Recommendations, Listing or Ads servicees.

**Conditional content**<br/>
Boxes can be rendered conditionally, this is the way to content customization.
Various types od conditions are implemented:

* date from/to condition
* A/B test condition
* condition based on user profile

For example, page administrator can prepare two versions of given box,
one for male users and another for female users.
In runtime, when page is rendered, users gender is identified
an one of these two boxed is pruned from boxes tree.

**Consistent traffic analytics**<br/>
Basic traffic analytics is easy to achieve. It’s enough to include a tracking script in
the page footer. When a page is opened by a user, the script reports Page View event.

What we need is more fine-grained data:

* Box View event &mdash; when box is shown in a browser viewport.
* Box Click event &mdash; when users clicked on a link which navigates him from one box to another
  (for example Recommendation Box can emmit Box Click event when users clicks
  on of the recommended products)

Once we have these data, we can calculate click-through rate ([CTR](https://en.wikipedia.org/wiki/Click-through_rate)).
for each box.
CTR is valuable information for page administrators, it helps them to decide
which boxes should promoted and which should be removed from a page.

**Multi-frontend**<br/>
One of the OpBox key features is separation page definitions
from frontend renderers.
Page definition is a JSON document with page structure and page data (content).
It’s up to the renderer how the page is presented to frontend users.

For now, we have two renderers: Web, implemented as NodeJS service,
responsible for serving HTML and Mobile, implemented as Android library,
responsible for presenting the same content in Android app.

**One place for integrating backend services through REST API**<br/>
OpBox Core does the whole data integration job
and sends complete page definition to frontend renderers.

It’s a great advantage for frontend developers.
They can treat OpBox Core as the single point of contact and facade to various backend services.

**Future: component Event Bus**<br/>
There are many use cases when we want boxes to interact with each other.
For example, our Search page lets user to search through offers available on Allegro.
Search results are shown by the Listing box.
Below we have Recommendations box which shows some offers, possibly related with the search query.

What if we would like to remove an offer from Recommendations box when it
happens to be shown already by Listing box?
We think that the best place to implement such logic is Frontend.

Desired solution would let rendered boxes to talk with each other via a
publish-subscribe message bus, e.g.:

“Hi, I’m Listing box, I’ve just arrived to a client’s browser to show offers A, C and X.”<br/>
“Hi, I’m Recommendations box,
 I’m here for a while and I’m showing offers D, E and X. Ouch! Looks like I’m supposed
 to replace X with something more decent.”

**Future: dependencies management**<br/>
Page is assembled from frontend components developed by different
teams.
Since we don’t force frontend developers to use any particular technology.
each component requires its own dependency set of various kind:
CSS, JS libraries, fonts and so on.

Reconciliation of those all dependency sets is kind of advanced topic,
to be honest, we don’t have well-thought-out plan for this yet.

### How we did it
<p style="text-align: center; background-color:#E3E3E3">
    <img alt="OpBox architecture" style="width:75%; padding-top:10px;" src="/img/articles/2016-01-31-Managing-Frontend-in-the-microservices-architecture/opbox-architecture.gif" />
</p>

#### Core
OpBox Core primary responsibility is serving page definitions for Frontend renderers.
Moreover, Core provides an API to OpBox Admin for pages management (creating, editing, publishing).

Core is the only stateful service in the OpBox family.
It stores pages definitions in MongoDB and box prototypes in Git (prototypes are explained below).

Since Core is responsible for serving page definitions it also manages the page routing
and the most though work — fetching data from backend services. That’s the content to be injected into
page boxes.

We’ve put a lot of effort to make it well performing, fault-tolerant and asynchronous.
Core is the only gateway for renderers to our internal services.

**Box types** <br/>
Each Box has a type — it’s a definition that describes data parameters required
by the box and also defines a list of named slots. Slot is a placeholder for embedding child boxes.
We use ([JSON Schema](http://json-schema.org/)) to define parameter types.

Here is an example of the showcase box — along with its type and the type of the data parameter that it uses.

Showcase box type:

```json
{
  "slots": [],
  "parameters": [
    {
      "name": "allegro.box.showcase",
      "type": {
        "name": "CUSTOM",
        "typeName" : "allegro.type.showcasesList"
      },
      "description": "Showcase box",
      "required": false
    }
  ],
  "nameRequired" : true
}
```

Showcase data parameter type:

```json
{
  "title": "allegro.showcasesList",
  "description": "showcases list",
  "type": "array",
  "items": {
    "description": "showcase",
    "type": "object",
    "properties": {
      "imageUrl": {
        "type": "string"
      },
      "imageAlt": {
        "type": "string"
      },
      "linkUrl": {
        "type": "string"
      }
    }
  }
}
```

Rendered showcase box:

![rendered showcase box](/img/articles/2016-01-31-Managing-Frontend-in-the-microservices-architecture/showcase_box.png "rendered showcase box")

**Data-source types** <br/>
Data-source is our way to specify underlying backend microservice.
It contains: service URL in Service Discovery, input parameters and custom data required by a service,
for example:

```json
{
  "url": "service://opbox-content/teasers",
  "parameters": [
    {
      "type": {
        "name": "INTEGER"
      },
      "name": "id",
      "description": "Meerkat articles identifiers",
      "required": true
    }
  ],
  "dataType": "allegro.article.teasers",
  "timeoutMillis": 1500,
  "allowCustomParameters": false,
  "ttlMillis": 60000
}
```

#### Web renderer
When all necessary data from services is finally fetched and everything is ready to be drawn for the end-user there’s a place for
our web renderer. Every box prototype has to be implemented and added to our web-components
repository ([Artifactory](https://www.jfrog.com/artifactory/)).
After all the work your content should be rendered as HTML representation — optimized for your browser.

#### Mobile renderer library
One of our requirements was to support mobile platforms, so we have created android library for rendering pages
the same way as web renderer does but using native mobile code. Now when you create a page you don’t have to care about it’s mobile version.
This way android developers can implement better user experience using the same components definitions.
By the way — now we can update our pages in your phone instantly ;) (without deploying new version)

#### Admin
Simultaneously we had to develop some kind of management application (on top of [React](https://facebook.github.io/react/))
to easily create new pages and enable our users to publish new routes when needed.
So we’ve made an administrative panel and gave it to our colleagues at content department.
Now we’re getting features requests from them and we respond with updates in our project — so the project keeps on growing.

#### Mobile Adapter
We wanted to treat all rendering channels equally so we’re providing single api for retrieving pages data. Unfortunately
mobile application developers need their API to be accessible from public web and in slightly different form.
So we decided that we should cut out any irrelevant data — but instead of doing it in our core service,
we’ve made a proxy (mobile adapter) which transforms Core page api to a mobile friendly version
i.e. adding deep links or filtering not yet supported mobile features. We hope for another adapters in future (tv, smart-watches...)

#### Ecosystem is growing
To be agile we needed some tooling around our project — so we’ve made:

* **component generator** (upon [YEOMAN](http://yeoman.io))
* **opbox-web preview** (for local development)

Many more to come to simplify developing process.
