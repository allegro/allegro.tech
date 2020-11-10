--- 
layout: post 
title: Big data marketing. The story of how technology behind Allegro marketing works.  
author: [filip.blaszczyk, piotr.goralczyk, grzegorz.kaczmarczyk] 
tags: [tech, architecture, bigdata, spark] 
---

Marketing is a very important department in every company. In case of Allegro,
marketing is especially difficult because you have so many products to promote.
In this post we will tell a story of a platform we built for marketing
purposes.

## Background

Allegro is the biggest e-commerce platform in Poland and is in the top 10 of
biggest e-commerce platforms in the world. Our catalog numbers almost
200 million offers at this moment (september 2020), and the number is still growing.
The marketing team uses tools such as
[Google Merchant Center](https://www.google.com/retail/solutions/merchant-center/)
and [Facebook Ads](https://www.facebook.com/business/ads) in order to advertise
Allegro offers and get more traffic to the platform. To integrate with
them we need to prepare an XML file containing information about our offers.
Such XML files are called _"feed"_ . We will use this name later on.

Process of finding offers may suggest using a search engine. Unfortunately,
Allegro's search engine is not suited for this task. Feed could contain
millions of offers, which would result in deep pagination issues. A decision
was made to simply generate static files using batch jobs run in our [Hadoop](https://hadoop.apache.org/)
ecosystem. The ability to handle large volumes of data, powerful query
capabilities as well as access to various datasets across the platform were
major advantages. [Apache Spark](https://spark.apache.org/), an already tried and tested tool, was an
obvious choice.

Since it was not expected that the number of feeds exceeds a few dozen, every
feed was calculated in a separate (but executed in parallel) Spark job. Every
feed was described by business users by providing predicates that offers must
satisfy to be included in feed, as well as expected XML format and recipient.
You can see that architecture in the diagram below. `AggregateGeneratorJob` and
`FeedGeneratorJob` are batch jobs written in Apache Spark. First one gathers
data from different sources on Hive and HDFS and assembles them into a single
Parquet-based file called simply “aggregate” (we will use this name later on).
Second job, `FeedGeneratorJob` generates a single feed (XML file) and uploads
it to S3. They were run in parallel.

![Old architecture diagram](/img/articles/2020-10-12-bigdata-marketing/old_arch.svg)

But soon, against initial assumptions a number of feeds exploded. Finally, we
came to a situation where there were… 1300 feeds! Updating all of them (we need
to do that to have current data in advertisements) took more than 24 hours.
We managed to improve the situation a little bit by vertical scaling and
removing some of unused/poor performing feeds. But that was just temporary
improvement. We still needed 13 hours to refresh all the feeds.

Unfortunately, poor performance was just a tip of the iceberg. Much bigger
problem was the architecture that no longer suited our needs and made
implementing new features time-consuming. Codebase used a famous at that time
[cake
(anti)pattern](https://medium.com/rahasak/scala-cake-pattern-e0cd894dae4e)
which worked really bad in connection with Spark (painful serialization
issues). Add to that leaky monitoring and hand written scheduler and you will
get a full picture of our despair. Oh and the tool itself became very
important. It handled more and more integrations and was crucial for the
company.

## Brave new ~~world~~ solution

Ok, so that was the moment when we knew that we needed a new solution. What
requirements we had:

- Execution time cut off to 1h (2h at most) while keeping same amount of
  resources
- Possibility to query over any offer property (in old solution we had only
  some predefined predicates)
- Possibility of choosing offer by some key (or in programmers language: group
  by + aggregate)
- Easy extensibility of new data sources (let’s say some new feature shows up
  in Allegro, we should be able to introduce new data related with that
feature ASAP)
- Possibility to create feed with arbitrary size: from just a few offers to
  whole catalog
- Possibility to scale horizontally
- Last but not least: possibility of integration with our partners not only by
  files, but also using an event-based approach (streaming API)

Those requirements would be easy to comply with in case of a “normal” shop with
a few thousands of products. But what scale do we have in Allegro?

- almost 200M offers (and still growing)
- ~25-40M changes in offers per day

Also, Allegro is based on microservices architecture and we don’t have a single
DB with whole information about the system. This leaves us with yet another
problem: how to gather all needed data. We have to use not only information
about offers, but also about sellers, campaigns, ratings, products and few
others. So the first item on our TODO list was to find a solution for gathering
the data. In Allegro most of the services use
[Hermes](http://hermes.allegro.tech/) as a message broker. Also, all of the
data that is sent by Hermes is dumped to HDFS in near real time manner.  To
make this more clear, let me show you that on diagram:

![Event flow in Allegro](/img/articles/2020-10-12-bigdata-marketing/hermes.svg)

At that moment, we were thinking which approach would suit our requirements
best. We saw three options here:

- Find some existing solution in our platform, but customize it for our needs
- Use Hermes topics directly (online)
- Gather data from HDFS (offline)

First option would be nice, but there was one problem… we haven’t found any
suitable source.  So basically we had to choose between collecting all data
online vs offline. Beside the most obvious difference: latency, what else
differentiates those solutions?

It is always more difficult to join data online. We would need to maintain a
database with the whole state and we would be prone to all kinds of bugs
related with concurrency. In case of any detected problem, we would have to
recover using historical data.

Offline solution would be similar to what we had in the old platform
(`AggregateGeneratorJob` described before). In offline, joins are
straightforward. We won’t have any problems with concurrency. Recreating data
is easy, well basically it is done on every job execution. But of course we pay
for that with latency. But, the question was how long will it take to create
such aggregate and how much latency we will get at that stage. Because it was
easy to implement we decided to simply measure it. In the end it turned out
that it was not that bad: in usual cases we were able to maintain latency of
about 30 minutes.

![Aggregate job](/img/articles/2020-10-12-bigdata-marketing/aggregate-job.svg)

That was acceptable for a start. We took into account that at least, if that
won’t be enough we can always transform it later into delta architecture and
read the newest data (or at least some subset of it, for example products
prices) from Hermes to make it more up to date.

Once we had a data source, we had to find a way to generate feeds based on
them. We were a bit biased against Apache Spark, because of poor performance
and hard maintainability of the old platform. Back then we didn’t know that
problem was in our solution, not in Spark itself. That’s why we decided to
spend a few weeks on research. We made a few prototypes based on Spark
Streaming, Kafka Streams and on databases. We even had an idea of writing our
own engine for computation. During those research we came up with a concept of
how to generate feeds in an efficient way and… we realized that it will be
pretty easy to implement in Spark! **We also made an important decision: we
decided to focus on generating files, and get back to streaming API later**.

## I am speed

Basically, to generate feed, we have to look through offers catalog and find
all offers matching defined criteria. In a database you typically use indexes
on a subset of fields to simplify searching. Because we needed the possibility
of making predicates on all fields and because we had a use case where we
needed almost all offers integrated with our partner we decided that linear
scanning would be best in that case. Is it bad? Well, it depends on next steps.
Just by deciding on linear scanning we knew that complexity of our process
would be at least O(N). We could handle that, but only as long as we would be
able to make complexity independent of the number of feeds (integrations). More
important in this case is scalability. It would be best to partition data and
calculate it concurrently, while sharing as little common state as possible.

In the old process every feed was calculated by a separate job. Although we had
hundreds of integrations, lots of them use the same XML schema (later called
“template”). Also, lots of feeds use similar predicates, so their results can
be cached and reused. So, the first thing was to calculate everything in one
go. We simply divide our aggregate into partitions and for each partition we
evaluate predicates to figure out which feeds will include which offer. When we
know that, we also know in which templates we need to render an offer. At the
end of the process we pivot and write data to appropriate partition-files on
S3. From S3 we serve partitioned files using our file server that knows how to
assemble parts and serve them as a single piece. Ok, so how much speedup we
gained thanks to that approach? After rewriting we were able to recalculate all
feeds in little more than 1h (comparing to 13h previously). But that's not all.
We not only sped it up 13 times, we also reduced memory usage two times! And
well, in the end we used the same tools, but in a better way.

![How engine works](/img/articles/2020-10-12-bigdata-marketing/engine.svg)

## Streaming API

After we drank our champagne, and cooled down a little bit, we had to return to
the problem with providing streaming API. Due to high ambitions of our
marketing business, we wanted to integrate Allegro's offers in a more effective
way. This type of integration results in smaller latency of products’ updates
and also fewer resources are required on the partner’s side.

At that moment we returned to the problem that we stated before: **what should
we use as a source of data?** Catching every event in the moment that it was
produced would be very difficult according to the scale and resources required
to handle such traffic.

Moreover, being a constant listener to all events emitted in our platform and
sending them instantly to a various partners’ APIs brings no benefits in terms
of data freshness.  This is due to the fact that updates are not applied
immediately by partners’ sides - even though the latency is lower than in the
XML solution, it still occurs and can take up to a couple of hours.

We decided that we can start with taking data from offer’s aggregate built for
file based feeds.  We didn’t want to send all offers that should be integrated
with a partner at every job’s run because in most cases we would generate
redundant events. Some offers didn’t change between two successive runs at all,
some of them were newly added to the feed or removed from the feed but in most
cases they had only partial updates like i.e. price change.  So we had an idea
that we will **send only the difference between the previous and current event
feed state**. How? Here’s a simplified version of algorithm for this approach:

- load latest state of all Allegro’s offers from HDFS - we call it aggregate,
- extract from aggregate and save on HDFS only this offers that should be
  included in event feed - we will call it snapshot X,
- load the previous state of the event feed (from the previous run) - snapshot
  Y,
- make a full join on X and Y using offer’s unique key - dataset Z of type
  `Tuple(OfferStateX, OfferStateY)`,
- based on dataset Z content, we decide to generate appropriate events:
- if both values are non-empty, we generate an event with the calculated
  difference between state X and Y
- if the value of X is empty, we generate an event about removal from the feed
- if the Y value is empty, we generate an event about adding a new offer to the
  event feed
- generated events are sent to Kafka’s topic that is constantly consumed by the
  service (connector) responsible for sending offers to a marketing partner,
- save snapshot X on HDFS (in the next run it will act as a snapshot Y)

![Streaming API architecture](/img/articles/2020-10-12-bigdata-marketing/streaming-api.svg)

And how much latency this solution adds? It occured that it was only additional
~20 minutes and in our case it is totally acceptable.  It is also worth to
mention that our Kafka’s topic is scalable in case a new partnership appears.
This is because the event model contains information about its destinations.
Thanks to this approach, we reduce the amount of data sent, thus limiting the
traffic of millions of sent events to tens of thousands.

## Self-healing system

Every complex system is prone to inconsistencies. Especially when this
complexity increases and it is hard to stop that - as it was before our big
refactor. New architecture lets us create a self-healing and fully controllable
system which is convenient to maintain even taking into account the scale we
are facing everyday.  While we were designing the architecture we were focused
mainly on two things: availability and control.

### Availability

The first step that should be considered is: **how to properly
define the responsibilities of individual system components?**

System works as a whole of cooperating elements. But it is easier to maintain
these elements when they have very specific tasks to handle.  There are three
main components in our system (introduced earlier):

1. Aggregator - knows everything about every offer’s current state. It gathers
all needed data and save them on HDFS,
2. Generator - it takes data generated by Aggregate, filters and prepares it
for delivery to a partner,
3. Connector (possibility of having many connectors) - holds integration with
partner, acts as a data mapper and sender.

*Aggregator* and *Generator* are **based on a complementary set of information
about the whole system and offers’ state at a certain point in time**.  So in
case if the aggregate contained damaged offers and the generator already took
it to prepare for sent, in the next cycle it will be overwritten by fixed ones
because each cycle run’s result overwrites the previous one.  Additionally,
both Aggregate and Generator stage results are persisted on HDFS. Thanks to
this, we can run the whole computation for any period of time and go back to
any system state.  Also, the Generator stage can be based on data generated at
any time. In case Aggregate is failing while generating new data, Generator
works properly using earlier data.  Then, we have a Connector. It consumes
events from Kafka and pushes them, in appropriate form, on partner’s API. It
has no responsibility for checking data or state correctness. It simply gets
what the Generator prepared and tries to deliver it to a partner.  Thanks to
this separation of responsibility, Connector is not dependent on Generator -
even if Generator has a breakdown, the Connector at most may have nothing to
do.

### Control

In the previous paragraph we mentioned a few processing issues we are
struggling with.  But also we proved that despite this our system can still
work in such conditions - maybe not as effectively as in standard scenarios but
always it is something.  To react faster, we’ve managed to make quite “garbage
data”-resistant notifications-based alerting system that will alarm about
anomalies that have occurred during computation.  In short, if the difference
between states of previous and current Generator run is significant (experience
based numbers), the system will stop and inform us about it so that we can
decide if this change is acceptable or not.  (By difference between states I
mean difference between parameters such as feed’ offers count, amount of
offers’ parameters changes etc.) If change is approved, the system normally
returns to its work, otherwise, data are not propagated from Generator to
Kafka, resulting in lack of data to consume by Connector.  Even if we will pass
some incorrect data to a partner and it will be too late to retreat, we have a
special mechanism that refreshes any offer that was updated more than 28 days
ago.  So if an offer wasn’t updated for such a long time, it doesn’t matter if
it is damaged or not, it will be refreshed eventually.

## Summary

Key takeaway points:

- Just because something does not work well it doesn’t mean that tool is bad,
  maybe there is something wrong in the way you are using it?
- Ideas can be complex, but it doesn’t mean that they have to be complicated!
- Research is a key. Even when your business tells you that there is no time
  for it, fight for it. Without it you will end up spending even more time on
fixes.
- Apache Spark is a beast. It can simplify your computation dramatically and
  you can achieve amazing results with it, but at the same time you need to
think more about how your data will be calculated. One small problem may result
in slow computation. Unfortunately lots of them are hard to notice.
- [Join us](allegro.pl/praca) if you like such challenges :-)
