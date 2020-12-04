--- 
layout: post 
title: Big data marketing. The story of how technology behind Allegro marketing works. 
author: [filip.blaszczyk, piotr.goralczyk, grzegorz.kaczmarczyk] 
tags: [tech, architecture, bigdata, spark] 
---

Marketing is a very important department in every company. In case of Allegro,
marketing is especially difficult because you have so many products to promote.
In this post we will tell the story of a platform we built for marketing
purposes.

## Background

Allegro is the biggest e-commerce platform in Poland and one of top 10 largest e-commerce platforms worldwide.
Our catalog holds almost 200 million offers at this moment (December 2020), and the number is still growing.
The marketing team uses tools such as
[Google Merchant Center](https://www.google.com/retail/solutions/merchant-center/)
and [Facebook Ads](https://www.facebook.com/business/ads) in order to advertise
Allegro offers and get more traffic to the platform. To integrate with
them we need to prepare an XML file containing information about our offers.
Such XML files are called _"feed"_ . We will use this name later on.

Since we need to find specific offers, using a search engine may seem natural.
However, Allegro's search engine is not suited for this task. Feed could contain
millions of offers, what would result in deep pagination issues. A decision
was made to simply generate static files using batch jobs run in our [Hadoop](https://hadoop.apache.org/)
ecosystem. The ability to handle large volumes of data, powerful query
capabilities as well as access to various datasets across the platform were
major advantages. [Apache Spark](https://spark.apache.org/), an already tried and tested tool, was an
obvious choice.

Since we didn't expect the number of feeds to exceed a few dozen, every
feed was calculated in a separate (but executed in parallel) Spark job.
Business users created every feed definition by providing predicates that offers must
satisfy to be included in feed, as well as expected XML format and recipient.
You can see that architecture in the diagram below. `AggregateGeneratorJob` and
`FeedGeneratorJob` were batch jobs written in Apache Spark. First one collected
data from different sources on Hive and HDFS, then assembled them into a single
Parquet-based file called simply “aggregate” (we will use this name later on).
Second job, `FeedGeneratorJob` generated and uploaded a single feed (XML file)
to S3. All jobs were run in parallel.

![Old architecture diagram](/img/articles/2020-10-12-bigdata-marketing/old_arch.svg)

But soon, against initial assumptions, a number of feeds exploded. Eventually,
we encountered as much as... 1300 feeds! Updating all of them, to
present current data in advertisements, took more than 24 hours.
We managed to improve this situation a little by vertical scaling and
removing some of unused/poor performing feeds. However, it was just a temporary
improvement, since it still took as much as 13 hours to refresh all the feeds.

We were yet to find out that poor performance was just the tip of the iceberg. Much bigger
problem was the architecture that no longer suited our needs and made
implementing new features time-consuming. Codebase used a then acclaimed
[cake (anti)pattern](https://medium.com/rahasak/scala-cake-pattern-e0cd894dae4e)
that turned out to work poorly in connection with Spark. It caused serious serialization issues.
Add to that leaky monitoring and handwritten scheduler, and you will
get a full picture of our despair. Besides, the tool itself became very
important. It handled more and more integrations and was crucial for the
company.

## Brave new ~~world~~ solution

At that moment we knew that we needed a new solution.
We decided that our target solution should let us:

- Reduce the execution time to 1h (2h at most) while keeping same amount of resources
- Query over any offer property (in old solution we had only some predefined predicates)
- Choose offer by a key (or in programmers language: group by + aggregate)
- Introduce new data sources quickly
- Create feed with arbitrary size: from just a few offers to whole catalog
- Scale horizontally
- Last but not least: integrate with our partners not only by files
but also using an event-based approach (streaming API)

These requirements would be easy to comply with in case of a “normal” shop with
a few thousands products. However, Allegro operates on a much larger scale of:

- almost 200M offers (and still growing)
- ~25-40M changes in offers per day

Also, Allegro is based on microservices architecture and we don’t have a single
DB with full information about the system. This leaves us with yet another
problem: how to gather all needed data. We have to use information
on offers, sellers, campaigns, ratings, products and few others.
So the first item on our TODO list was to find a solution for collecting
the data. In Allegro most of the services use
[Hermes](http://hermes.allegro.tech/) as a message broker. Also, all of the
data that is sent by Hermes is dumped to HDFS in near real-time manner. To
make this clearer, let me show you that on diagram:

![Event flow in Allegro](/img/articles/2020-10-12-bigdata-marketing/hermes.svg)

At that moment, we wondered which approach would suit our requirements
best. We saw three options here:

- Find some existing solution in our platform and customize it for our needs
- Use Hermes topics directly (online)
- Collect data from HDFS (offline)

First option would be nice, but there was one problem… we haven’t found any
suitable source. So basically, we had to choose between collecting all data
online vs offline. Beside the most obvious difference, latency, what else
differentiates these solutions?

It is always more difficult to join data online. We would need to maintain a
database with the whole state and we would be prone to all kinds of
concurrency-related bugs. In case of any detected problem we would have to
recover using historical data.

Offline solution would be similar to what we had in the old platform
(`AggregateGeneratorJob` described before). Joins between various data sources
would be straightforward. We wouldn't have any problems with concurrency.
Recreating data is easy, since basically it is done on every job execution,
although we pay for that with latency. The question though was how long would it take
to create such aggregate and how much latency we would get at that stage.
Considering it was easy to implement we decided to simply measure it. In the end it
turned out not that bad: in typical cases we were able to maintain
latency of about 30 minutes.

![Aggregate job](/img/articles/2020-10-12-bigdata-marketing/aggregate-job.svg)

That was acceptable for a start. In case of it being not enough, we could always transform
it later into delta architecture and read the newest data (or at least some subset of it,
for example products prices) from Hermes to bring it up-to-date.

Once we had a data source, we had to find a way to generate feeds based on
it. We were a bit biased against Apache Spark, because of poor performance
and hard maintainability of the old platform. Back then we didn’t know that
problem was in our solution, not in Spark itself. That’s why we decided to
spend a few weeks on research. We made a few prototypes based on Spark
Streaming, Kafka Streams and on databases. We even had an idea of writing our
own engine for computation. During that research we came up with the idea of generating
feeds in an efficient way and… we realized that it will be
pretty easy to implement in Spark! **We also made an important decision: we
will focus on generating files, and get back to streaming API later**.

## I am speed

Basically, in order to generate feed we need to look through offers catalog and find
all offers matching defined criteria. In a database you typically use indexes
on a subset of fields to simplify searching. Since we need the possibility of
making predicates on all fields as well as of integrating all offers with our
partner, we decided to go for linear scanning. Is it bad? Well, it depends on next steps.
Since we decided on linear scanning, we knew that complexity of our process
would be at least O(N). We could handle that, but only as long as we would be
able to make complexity independent of the number of feeds (integrations). Even more
importantly, we had to take care of scalability. It would be best to partition data and
calculate it concurrently, while sharing as little common state as possible.

In the old process every feed was calculated by a separate job. Although we had
hundreds of integrations, lots of them use the same XML schema (later called
“template”). Also, lots of feeds use similar predicates, so their results can
be cached and reused. Therefore, our first priority was to calculate everything in one
go. In order to achieve that we simply divide our aggregate into partitions and for each partition we
evaluate predicates to figure out which feed includes which offer. When we
know that, we also know in which templates we need to render an offer. At the
end of the process we pivot and write data to appropriate partition-files on
S3. From S3 we serve partitioned files using our file server that knows how to
assemble parts and serve them as a single piece.

Ok, so how much speedup we gained thanks to that approach? After rewriting we
were able to recalculate all feeds in a little over 1h (comparing to 13h previously).
It wasn't all, though. Not only have we sped the process up 13 times, we also
reduced memory usage twofold! And well, in the end we used the same tools, but in a better way.

![How engine works](/img/articles/2020-10-12-bigdata-marketing/engine.svg)

## Streaming API

After we drank our champagne, and cooled down a little bit, we had to return to
the problem with providing streaming API. Following ambitious targets of our
marketing business, we wanted to integrate Allegro's offers in a more effective
way. This type of integration results in smaller latency of products’ updates
and also fewer resources are required on the partner’s side.

At that moment we returned to the problem stated before: **what should
we use as a source of data?** Catching every event in the moment that it was
produced would be very difficult due to the scale and resources required
to handle such traffic.

Moreover, being a constant listener to all events emitted in our platform and
sending them instantly to various partners’ APIs brings no benefits in terms
of data freshness. This is due to the fact that updates are not applied
immediately by partners’ sides - even though the latency is lower than in the
XML solution, it still occurs and can take up to a couple of hours.

We decided that we can start with taking data from offers' aggregate built for
file-based feeds. We didn’t want to send all offers that should be integrated
with a partner at every job’s run because in most cases we would generate
redundant events. Some offers didn’t change between two successive runs at all,
some of them were newly added or removed from the feed, but in most
cases they had only partial updates e.g. price change. So we had the idea of **sending
just the difference between the previous and current event
feed state**. How? Here’s a simplified version of algorithm for this approach:

- load latest state of all Allegro’s offers from HDFS - let's call it aggregate,
- extract from aggregate and save on HDFS only the offers that should be
 included in event feed - let's call it snapshot X,
- load the previous state of the event feed (from the previous run) - snapshot
 Y,
- make a full join on X and Y using offer’s unique key - dataset Z of type
 `Tuple(OfferStateX, OfferStateY)`,
- decide to generate appropriate events based on dataset Z content:
    - if both values are non-empty, we generate an event with the calculated difference
    between state X and Y
    - if the value of X is empty, we generate an event on removal from the feed
    - if the Y value is empty, we generate an event on addition of a new offer to the event feed
- send generated events to Kafka topic that is constantly consumed by the
 service (connector) responsible for sending offers to a marketing partner,
- save snapshot X on HDFS (in the next run it will act as a snapshot Y)

![Streaming API architecture](/img/articles/2020-10-12-bigdata-marketing/streaming-api.svg)

I'm sure you're wondering how much latency this solution adds.
Well, it turned out to be only 20 minutes and in our case it is totally acceptable.
It is also worth mentioning that our Kafka topic is scalable in case a new partnership appears.
This is because the event model contains information about its destinations.
Thanks to this approach, we reduce the amount of data sent, thus limiting the
traffic of millions of sent events to just tens of thousands.

## Self-healing system

Every complex system is prone to inconsistencies. Especially when this
complexity increases and it is hard to stop that - as it was before our big
refactor. New architecture let us create a self-healing and fully controllable
system that is convenient to maintain even taking into account the scale we
face everyday. When designing the architecture we focused mainly on two things:
availability and control.

### Availability

The first step that should be considered is: **how to properly
define the responsibilities of individual system components?**

System works as a sum of cooperating elements. But it is easier to maintain
these elements when they have very specific tasks to handle. There are three
main components in our system (introduced earlier):

1. Aggregator - knows everything about every offer’s current state. It gathers
all needed data and saves them to HDFS,
2. Generator - it takes data generated by Aggregate, filters it and prepares
for delivery to a partner,
3. Connector (possibility of having many connectors) - holds integration with
partner, acts as a data mapper and sender.

*Aggregator* and *Generator* are **based on a complementary set of information
about the whole system and offers’ state at a certain point in time**.
So in case the aggregate contains damaged offers and the generator already
took it to prepare for sending, in the next cycle it will get overwritten by fixed ones.
This happens because each cycle run's results overwrite the previous ones.
Additionally, both Aggregate and Generator stage results are persisted on HDFS.
Thanks to this we can run the whole computation for any period of time and go back to
any system state. Also, the Generator stage can be based on data generated at
any time. In case Aggregate is failing while generating new data, Generator
works properly using earlier data.

Then, we have a Connector. It consumes events from Kafka and pushes them,
in appropriate form, on partner’s API. It has no responsibility for checking
data or state correctness. It simply gets what the Generator prepared and
tries to deliver it to a partner. Thanks to this separation of responsibility,
Connector is not dependent on Generator - even if Generator has a breakdown,
the Connector at worst may have nothing to do.

### Control

In the previous paragraph we mentioned a few processing issues we are
struggling with. However, we also proved that despite this our system can still
work in such conditions - maybe not as effectively as in standard scenarios,
but it still does. To react faster, we’ve managed to make quite “garbage
data”-resistant, notifications-based alerting system that will alarm about
anomalies occuring during computation. In short, if the difference
between states of previous and current Generator run is significant (experience
based numbers), the system will stop and inform us about it so that we can
decide if this change is acceptable or not. (By difference between states I
mean difference between parameters such as feed’s offer count, number of
offers’ parameters changes etc.) Once the change is approved, the system returns
to its work. Otherwise, data is not propagated from Generator to Kafka, resulting
in lack of data to be consumed by Connector. Even if we pass some incorrect
data to a partner and it will be too late to retreat, we have a
special mechanism refreshing any offer that was updated more than 28 days
ago. So if an offer wasn’t updated for such a long time, it doesn’t matter if
it is damaged or not – it will be refreshed eventually.

## Summary

Key takeaway points:

- Just because something does not work well it doesn’t mean the tool is bad.
Maybe there is something wrong with the way you are using it?
- Ideas can be complex but it doesn’t mean that they have to be complicated!
- Research is key. Even if your business tells you there is no time for it, insist on it.
Otherwise you will end up spending even more time on fixes.
- Apache Spark is a beast. It can simplify your computation dramatically and
give amazing results with it, but at the same time you need to
think more about how your data will be calculated. One small problem may result
in slow computation. Unfortunately lots of them are hard to notice.
- [Join us](allegro.pl/praca) if you like such challenges :-)
