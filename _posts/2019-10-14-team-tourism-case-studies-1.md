---
layout: post
title: Team tourism at Allegro — part 2 — case studies
author: [tomasz.nurkiewicz, michal.lewandowski, bartosz.galek, bartosz.balukiewicz]
tags: [tech]
---
Following up on our previous post about [team tourism](/2019/09/team-tourism-at-allegro.html) at Allegro,
as promised we present you with three case studies describing experiences of our engineers during their visits in other teams.
The teams visited worked on content automation, machine learning and search engine optimisation.

## Case study 1
### Content Automation (Google Cloud Dataflow) - Tomasz Nurkiewicz
On a daily basis I work for a team responsible for calculating commissions. It's an insanely important, but also rather mundane
part of a marketplace business. We work in two environments: real-time and batch. We charge and refund commissions in
near real-time, typically a few seconds after each transaction. This is done through a bunch of microservices, accessed
via RESTful interfaces or [Hermes events](/2019/05/hermes-1-0-released.html). On the other hand, there are a
bunch of Spark jobs calculating daily and monthly reports, discovering inconsistencies and frauds.

<img alt="content automation" src="/img/articles/2019-10-14-team-tourism-case-studies-1/content-automation.jpg" />

I enjoy this domain but for a while I've also been interested in streaming architectures. Processing large amounts of
data, especially detecting trends and correlations over time, sounds really exciting to me, especially after reading
[“_Designing Data-Intensive Applications_”](https://allegro.pl listing?string=designing%20data%20intensive%20applications).
Long story short, it turned out that [Marcin Kuthan's](/authors/marcin.kuthan/) team does exactly that,
a few office rooms away. After a casual talk over coffee and finding some time in my permanent team, I moved temporarily,
for a month, to the new project.

Marcin and his team’s task was to calculate ["click-through rates"](https://en.wikipedia.org/wiki/Click-through_rate)
of pages and individual [boxes](/2016/03/Managing-Frontend-in-the-microservices-architecture.html).
It basically means how many people clicked on a page or a box upon seeing it. They prepared a proof of concept
and took advantage of [Google Cloud Dataflow](https://cloud.google.com/dataflow/). At Allegro scale it amounts to ten thousand
and more events per second. The classic approach would probably involve a heavy, monolithic batch job using Spark
that calculates these metrics daily. Streaming architecture, on the other hand, yields results every minute for the last
ten minutes or so. We need this data in (almost) real time in order to measure the effectiveness of presented content.

The overall architecture pushes raw events from our internal Kafka to [Google Cloud
Pub/Sub](https://cloud.google.com/pubsub/docs/) through Kafka Connect. When anonymised raw data is available in the
cloud, we declaratively build data flows using [Apache BEAM](https://beam.apache.org/) abstraction over many streaming
engines. Additionally we used [scio](https://github.com/spotify/scio) from Spotify that provides a more idiomatic Scala
experience to BEAM. We even [contributed](https://github.com/spotify/scio/commits?author=piter75) some bug fixes to
scio. Dataflow graphs we implemented calculate CTRs in real time, publishing results to [Google Cloud BigQuery](https://cloud.google.com/bigquery/).
Not going too much into details, Cloud Dataflow worked well for us. It provided a rather smooth experience
and a fast feedback loop. I managed to push my first changes to production (*the* cloud) the day I started in my new team.
Unfortunately, we also experienced a [20-hour long outage](https://status.cloud.google.com/incident/cloud-dataflow/19001)
of Cloud Dataflow - which was an important lesson.

Stream processing is quite complex once you are dealing with real problems like late data arrival, processing vs.
creation time, understanding various windowing policies. My biggest "Eureka" moment was realising that stream processing
is no different than batch processing. But with small, often overlapping batches. I learnt that virtually all
non-trivial operations happen within windows, especially complex aggregations like grouping by key or joining two
unrelated streams. A truly eye-opening experience.

While getting back to my permanent team my head was full of ideas. Not only did I manage to deliver my small task but
also gained experience that can definitely impact my day-to-day work.

## Case study 2
### Machine Learning - Michał Lewandowski
Data scientists are now one of the most sought-after employees on the market and machine learning is a big thing. Ten years
ago, when I was a student at Warsaw University of Technology I only had one subject called “Artificial Neural Networks”.
Although the topic was interesting, the tooling was primitive compared to software development and there were little to
none job perspectives. A few months ago I decided to join the “Machine Learning Research” team for a couple of days to
work with them, to see how they prepare models and how these models are used in a microservice ecosystem as big as Allegro
has.

<img alt="machine learning" src="/img/articles/2019-10-14-team-tourism-case-studies-1/machine-learning.jpg" />

The knowledge I had from the university was priceless. Although the amount of data, training methods and models have
developed over time, the core concept is still the same. With the help of team members, I was able to quickly understand
the whole process.

The thing that surprised me the most was the amount of time the team spent on collecting data to train and test the
models. If you take part in any online course on machine learning, you will be provided with ready datasets.
In the real world, you have to find and gather them by yourself, which is an error-prone and time-consuming process.
Another thing that was quite unusual for me was the amount of time spent on reading and analysing other people’s scientific papers.
Reviewing the research conducted by other scientists is a part and parcel of this job. Those papers are not like articles
in popular science magazines and have a high entry level.

After a few days, putting together all the pieces of the solution was straightforward. Integrating a model with a
microservice is not as hard as I imagined. The knowledge I gained enabled me to better understand the data scientists,
and to work better in cross-functional teams.

The final thought I had is that this branch of engineering is extremely extensive. My observation is that you can not be
on top with both Software Engineering and Machine Learning. If you decide to do Machine Learning on your daily basis you
have to agree that you won't be able to keep up with all the stuff that is going on in Software Engineering.

## Case study 3
### SEO - Bartosz Gałek
In my everyday work I’m involved in developing [Opbox Project](/2016/03/Managing-Frontend-in-the-microservices-architecture.html).
For a software engineer like myself this project comes with a lot of challenges regarding high performance and traffic.
Since my team rarely interact with the main product area (we are a platform for them) - I’ve decided to try and learn
something totally different - [Search Engine Optimisation](https://en.wikipedia.org/wiki/Search_engine_optimization)!
I’ve done tourism few times so far, but this was my first time away from the pure development sector.

<img alt="seo" src="/img/articles/2019-10-14-team-tourism-case-studies-1/seo.jpg" />

At the beginning, we agreed that the main goal was to exchange our experiences. While working with web development,
SEO was always one of the main concerns, but I’ve never experienced working with this topic like I did during my tourism.
Our SEO team also had some web development talents, but never actually coded.

On the first day I was trained and lectured. I was showed a lot of data and statistics about our users and I’ve been
introduced to a lot of team's online tools. We also went through our site and discussed places were improvements should
be made. In general my tourism had two parts:
* Choose one of Allegro’s nearly 40k categories, and do something to improve its Search Engine Result Page position.
* Fix a lot of small issues throughout the platform, to allow Search Engines to perform better.

These were astonishing two weeks. I’ve gained a new perspective - just by seeing how SEO team works - hopefully some
experiences will change my everyday work forever. Not only could I learn something new but also I was able to bond with
marketing part of the company (they’re really cool!). The best part was - I made some tangible changes improving our site
search visibility. I’ve made over ten pull requests in various projects and my category got to the TOP3 of major Search
Engine Result Pages.

## Summary
As you can see, one can never be bored at Allegro. Purely technical and more business oriented team tourism is
a great example of branching out, which should be a powerful tool of self-development for every engineer.

In the next part we will talk about tourism in teams working on [Hermes](/2019/05/hermes-1-0-released.html)
and web performance.
<style type="text/css">.post img{margin: 0 auto;display: block;}</style>