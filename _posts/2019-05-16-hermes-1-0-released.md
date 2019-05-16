
layout: post
title: Hermes 1.0 released
tags: [tech, hermes, kafka, pubsub, broker]
author: lukasz.druminski
---

After 5 years of developing and maintaining Hermes, we are very excited to announce that version **1.0** has been released.

Version 1.0 is symbolic. It doesn’t contain any changes in comparison to the previous one.
It’s a cut-off from stable and mature code.

## What is Hermes?

Hermes is a message broker with REST API and push model. It’s built on top of [Apache Kafka](https://kafka.apache.org/) 2.0.


<img alt="Hermes pubsub" src="/img/articles/2019-05-16-hermes-1-0-released/hermes-pubsub.png" />

Hermes mediates in communication between services. It’s a [pub-sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
which means that publishing services (publishers) don’t know anything about subscribing services (subscribers).
Publishers only have to publish messages on a topic. They don’t have to worry about which subscriber is reading their
messages and whether it’s available or returns errors.


## Hermes advantages

* **Simple integration**
    * Publishing messages to Hermes comes down to sending them over HTTP to an appropriate address. Example:

        *curl http://{hermes_address}/topics/pl.allegro.events.clicks
        --data ‘{“id”: “1234”, “page”: “main”}’ -H”Content-Type: application/json”*

    * Message consumption from Hermes comes down to exposing an HTTP endpoint in a consuming service.
      Next we have to create a subscription in a simple and intuitive GUI or through the API.
      After this, Hermes starts sending messages to the address provided in the subscription.
      Furthermore, it automatically adjusts the rate of
      [messages sent per second](https://hermes-pubsub.readthedocs.io/en/latest/user/subscribing/) to the consuming service.
    * Hermes can be used by any technology supporting HTTP, for example: modern programming languages, shell scripts and
      old PHP in monolithic system
* **Reliability**. Number one priority for Hermes is not to lose any message even if in the cloud everything goes south.
* **Saving time**. Developers can focus on building business services. They don’t have to know Hermes or Kafka 
internals to use them successfully. When you use Hermes in business services, you don’t have to worry about client’s
dependency update or migration to a newer version.
* **Metrics**. Hermes measures everything that is important, for example for publishing and consuming messages measures
their rate, latency, throughput, successes, failures.
* **Multi-DC support**. Hermes can be spread across multiple data centers. When one DC goes down,
its traffic can be redirected to others. 
* **Tracking mechanism**. Based on *hermes-message-id*, we can track how and when our message was processed by Hermes.
* **AVRO support**. You can publish and consume messages in JSON or [AVRO](https://avro.apache.org/) format.
Furthermore, you can have a topic of AVRO type and still publish and consume JSON as Hermes converts messages on the fly.
Thanks to this, publishers and subscribers don’t have to use AVRO on their side but still can benefit from it on Hermes.  
Each AVRO topic has a schema attached to it. So, message structure is documented and it’s easier to verify what kind
of messages are on a given topic in order to be compatible with them. Moreover, AVRO lowers the volume of data being
sent and persisted in Kafka. It also simplifies data analysis when data is sent from Kafka to other Big Data
platforms such as Hadoop.
* **Scalability**. You can easily add and remove nodes in Hermes cluster.
* **Speed**. You get all of this at a price of milliseconds overhead over pure Kafka (plus network transfer time).
* **Modularity**. Hermes is divided into modules, you can use them all or pick the subset that fits your needs.
* **Backup storage**. It’s a buffer saving messages on local drive when Kafka is unavailable or responds too long
when messages are published to it. Thanks to backup storage you gain extra time for bringing Kafka to life or stabilizing it.
* **Filter support**. You can define message filters for a subscription. Thanks to them, subscribing service receive
only messages it’s interested in, not the whole topic.
* **OpenSource**. Hermes is available on [github](https://github.com/allegro/hermes). We are open for contributions.
* **Intuitive GUI**. Hermes-console is a web app for:
    * managing topics and subscriptions,
    * message retransmission -- you can choose the date and time from which messages should be sent again to subscribing service,
    * subscription filter defining.

    <p align="center">
      <img
        alt="Hermes console topic view"
        style="max-width:700px;width:90%"
        src="/img/articles/2019-05-16-hermes-1-0-released/hermes-console-topic-view.png">
    </p>
    <br/>
    <p align="center">
          <img
            alt="Hermes console subscription view"
            style="max-width:700px;width:90%"
            src="/img/articles/2019-05-16-hermes-1-0-released/hermes-console-subscription-view.png">
    </p>

## How important is Hermes for Allegro?

Hermes is the heart pumping messages in our microservice architecture.
Moreover, it’s a bridge between our old world in the form of PHP monolith and the new world, microservice architecture.

### In numbers

Approximate numbers for our main production cluster:

* Used by 60 teams and 400 services,
* Publishing on all topics: 40k msgs/s, subscribing from them: 50k msgs/s (we have more subscribers than publishers),
* Incoming throughput 80MB/s, outgoing 120MB/s,
* Response latency for [99p](https://en.wikipedia.org/wiki/Percentile):
    * [ack-leader](https://hermes-pubsub.readthedocs.io/en/latest/user/publishing/#acknowledgment-level): 45ms,
    * [ack-all](https://hermes-pubsub.readthedocs.io/en/latest/user/publishing/#acknowledgment-level): 60ms,
* Size of handled messages:
    * 50p: 0.4kB,
    * 75p: 1kB,
    * 95p: 5kB,
    * 99p: 10kB,
* 800 topics and 1300 subscriptions.

We have been running Hermes in production constantly since 2014. During this time we had several major datacenter
breakdowns but Hermes remained available to all it’s clients, because its spread onto many nodes and supports multiple DCs.
In our ecosystem, it’s one of the core services used by most development teams and business services.

## Who should consider using Hermes

Hermes fits very well into microservice architecture with HTTP as the main communication protocol.

It’s built from several modules. Additionally, to run it, Zookeeper and Kafka clusters are required.
Therefore, it’s reasonable to have a dedicated team responsible for its maintenance.
Altogether, maintenance of Hermes and its dependencies is costly. When is it worth to pay this cost?

When you have an environment with 20+ services, code sharing, maintenance and following updates become problematic.
At Allegro we had the chance to find it out. It’s better to take out dependencies from business services as much as possible.
This also applies to the message broker. It pays to use Hermes when you have an environment with 20+ services
developed by many teams.

Additionally, when you have a monolithic system and would like to connect it with a new architecture then you should also
consider Hermes as a bridge between these two worlds. At Allegro we have a PHP monolith which shrinks every month
thanks to our efforts moving towards microservice architecture. Hermes makes this process easier. 

## The right message broker

Hermes was open sourced in 2015. Key goals which we have been following during its development are still valid: 

* Integration as simple as possible
    * We already had services communicating with each other over HTTP. We had in mind that the easiest way to switch
    them to using a message broker was just to replace the URL address on publisher side.
    * No dependencies on client side. Thanks to the simple API based on HTTP, we don’t need to include any dependencies
    on client side. Upgrading Hermes is transparent to users — they don’t have to bother about it.
    Users don’t need to know how a message broker works under the hood, either, and can focus on developing their services.
* Performance. We are aware that HTTP is not the fastest communication protocol but we chose it,
  because it’s a very common one and we already use it widely in our infrastructure.
  However, we want to publish and acknowledge messages over HTTP with 50-60ms latency SLA for 99th percentile.
  So we use [Undertow](http://undertow.io/) as an HTTP server and Apache Kafka as a message broker under Hermes.
* Reliability. We want to send critical data using the message broker.
  When Hermes returns 2xx HTTP status code to a publisher, it provides a guarantee that the message will be delivered
  to topic subscribers. We rely on Kafka and its data consistency mechanisms. What’s more, we’ve implemented our own
  backup storage mechanism on the publisher’s side that can be used when brokers are unavailable.
* High-availability. We want a message broker which is available all the time even if in the datacenter everything
  can go down. Kafka provides high availability within a local datacenter. We extended this high availability by adding
  multi-DC support. It means that we share topics and subscriptions over all datacenters. When Hermes in one DC goes
  down or is in maintenance mode, we can redirect traffic (on load balancers) to the other DC.
* Scalability. We can easily add nodes to increase message broker cluster throughput.

Nowadays you can choose from a variety of messages brokers available on the market. We are aware of them.
They are more or less mature. We stick to Kafka as it proved itself in our BigData ecosystem,
being mature software which we trust and which provides us with the required functionality.

At Allegro we try to use open source as much as possible. Hermes and Kafka are all open source.
Also, they are cloud vendor agnostic. It means that you can install and migrate them on any cloud environment.
In addition, Hermes is extendable, meaning you can plug in custom implementations of many interfaces used underneath.
For example, our Hermes clusters are extended by internal functionalities like discovery service mechanism,
service catalog ownership or custom OAuth provider.

In the end, there is no silver bullet for all challenges. At Allegro for example, most developer teams use Hermes,
but a few teams use raw Kafka directly.

## How to try out Hermes

See our 10-minute [getting started guide](https://hermes-pubsub.readthedocs.io/en/latest/quickstart/) with Hermes.

## Roadmap

In the near future, Hermes team will be working on:

* Better support for dynamic environments such as Mesos, Kubernetes. We want to have auto-scalable Hermes.
  This will simplify its maintenance but also enable effective resource management.
* Zookeeper multi-DC support. Currently Hermes uses a single Zookeeper cluster.
  We want to have Zookeeper clusters independently per datacenter. Thanks to this, one DC-off will not affect in
  any way any other DC. Right now, when Zookeeper is down, you can still publish and consume from Hermes but topic and
  subscription management will not work properly. 
* Securing the connection between Hermes and Kafka.

If you have any requirements related to Hermes, please [let us know](https://github.com/allegro/hermes/issues).

## Thanks

Hermes has been in development and maintenance since 2014. This project depends on great people and talented developers
with whom to work is a pleasure and a positive adventure. To appreciate their work, below you can find the list
of all Hermes contributors (as of 9.5.2019):

- [adamdubiel](https://github.com/adamdubiel)
- [adididas122](https://github.com/adididas122)
- [ajayk](https://github.com/ajayk)
- [alasun](https://github.com/alasun)
- [alberskib](https://github.com/alberskib)
- [bgalek](https://github.com/bgalek)
- [chemicL](https://github.com/chemicL)
- [cristaloleg](https://github.com/cristaloleg)
- [dankraw](https://github.com/dankraw)
- [druminski](https://github.com/druminski)
- [faderskd](https://github.com/faderskd)
- [hajdukd](https://github.com/hajdukd)
- [ingwarsw](https://github.com/ingwarsw)
- [IvanVas](https://github.com/IvanVas)
- [jakubdyszkiewicz](https://github.com/jakubdyszkiewicz)
- [janisz](https://github.com/janisz)
- [jmnarloch](https://github.com/jmnarloch)
- [karolhor](https://github.com/karolhor)
- [klacia](https://github.com/klacia)
- [Kornel](https://github.com/Kornel)
- [kretes](https://github.com/kretes)
- [krzysiekbielicki](https://github.com/krzysiekbielicki)
- [lukaszjackowski](https://github.com/lukaszjackowski)
- [mictyd](https://github.com/mictyd)
- [miguelpuyol](https://github.com/miguelpuyol)
- [mproch](https://github.com/mproch)
- [msulima](https://github.com/msulima)
- [olekihnatowicz](https://github.com/olekihnatowicz)
- [pbetkier](https://github.com/pbetkier)
- [pbobruk](https://github.com/pbobruk)
- [piorkowskiprzemyslaw](https://github.com/piorkowskiprzemyslaw)
- [PiotrGoralczyk](https://github.com/PiotrGoralczyk)
- [piotrrzysko](https://github.com/piotrrzysko)
- [pivovarit](https://github.com/pivovarit)
- [pjagielski](https://github.com/pjagielski)
- [pszymczyk](https://github.com/pszymczyk)
- [pwolaq](https://github.com/pwolaq)
- [rprzystasz](https://github.com/rprzystasz)
- [rzukow](https://github.com/rzukow)
- [SathyaBhat](https://github.com/SathyaBhat)
- [szpak](https://github.com/szpak)
- [spooz](https://github.com/spooz)
- [TheCK](https://github.com/TheCK)
- [Theer108](https://github.com/Theer108)
- [tmmi](https://github.com/tmmi)
- [vi4m](https://github.com/vi4m)
- [wendigo](https://github.com/wendigo)
- [wojtkiewicz](https://github.com/wojtkiewicz)
