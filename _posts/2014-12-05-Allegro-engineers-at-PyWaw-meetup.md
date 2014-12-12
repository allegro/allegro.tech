---
layout: post
title: Allegro engineers at PyWaw meetup
author: piotr.betkier
tags: [python, community]
---

At Allegro, we always try to pick the right tool for the job. As a result, despite focusing on JVM for implementing our
services, we do use Python extensively for infrastructure automation and management.

We also like to share our knowledge with others in the community. That’s why we supported the latest
[PyWaw](http://pywaw.org/42/) (Warsaw Python User Group) meeting and had our engineers as
speakers sharing their experience.

### The talks

Our first engineer, **Kamil Chmielewski**, talked about his toolbox which allows him to quickly build developer tools
in Python. He presented useful tools and libraries for developing, documenting and distributing Python programs. Things
like defining command line interfaces, handling configuration files in different formats, generating documentation,
versioning based on git tags and distributing a self-contained executable are all solved problems if you know which
tools to pick. Kamil also emphasised the importance of having continuous integration and continuous delivery in place which,
whether you lead an open-source project that invites contributors or want to attract developers to your team from within
your company, helps invite contributors to your project.

View the [slides](http://kamilchm.github.io/developer-experience/) for more information, especially on the libraries
mentioned. Also, this and all the other talks were recorded so the video in Polish is available on [PyWaw meetup page](http://pywaw.org/42).

Then we had our second engineer, **Marcin Kliks**, sharing his lessons learned from three years of developing open-source
Python projects at Allegro - the most recognised one being [Ralph](https://github.com/allegro/ralph) for datacenter
assets management. He gave a lot of tips on developing successful products, the most important one being to take your
time before starting to code. The product needs to have a clear vision from one person, solve problems of one domain and
have performance requirements discovered up front. Marcin argued for strong code ownership, limiting unnecessary
dependencies on external libraries and avoiding excessive abstractions as they slow you down by making your code
harder to understand, debug and customize.

Consult the [slides](http://pywaw.org/site_media/upload/slides/pywaw-42-droga-do-lepszego-oprogramowania.pdf) and
the [video](http://pywaw.org/42) in Polish for more tips and pitfalls to avoid.

The third speaker was [**Rodolfo Carvalho**](http://rodolfocarvalho.net/) from [Base](https://getbase.com/) talking
about poor language support for concurrency in Python and ways to solve the problem. The old tools are threading and
multiprocessing which are inconvenient to use. We also have [asyncio](https://docs.python.org/3/library/asyncio.html)
since Python 3.4, but it is not stable yet. Rodolfo explained a better model for concurrency,
CSP (Communicating Sequential Processes), showing examples in Go language. He ended with an advice to emulate such
a model in Python using Greenlets and Queues from [gevent](http://www.gevent.org/) library, or using asyncio if
we don’t mind being early adopters.

Again, view the [slides](http://www.slideshare.net/rhcarvalho/concurrency-in-python4k) and the [video](http://pywaw.org/42) in English.

### After the meetup

Many attendees stayed in the bar where PyWaw took place for networking after the talks. It’s always a great
opportunity to meet other developers and share experiences. Countless interesting topics were covered that night and
we had quite a few Allegro engineers taking part in discussions.

It was a very successful meetup with inspiring talks and conversations. We keep supporting local developer communities
and hope to meet you there next time!
