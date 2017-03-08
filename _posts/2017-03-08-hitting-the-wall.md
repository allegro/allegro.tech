---
layout: post
title: How to Avoid Hitting the Wall in Mesosphere Marathon
author: [tomasz.janiszewski]
tags: [tech, mesos, marathon, mesosphere]
publish: true
---

_If there is no mention about marathon version it is 1.3.10 and below. We need
some time to test and deploy latest 1.4 release._

Running Mesosphere Marathon is like running... a marathon. When you are
preparing for long distance run, you’ll often hear about
[Hitting the wall](https://en.wikipedia.org/wiki/Hitting_the_wall).
This effect is described mostly in running and cycling but affects all
endurance sports. It happen when your body does not have enough glycogen to
produce power and this results in sudden “power loss” so you can’t run
anymore. At Allegro we experienced similar thing with Mesosphere Marathon. This
is our story of using Marathon on growing microservice ecosystem from tens of
tasks and couple applications to thousands tasks and hundred applications.

If you are interested how our ecosystem is build take a look at this MesosCon
presentation where we presented our Apache Mesos ecosystem after
First Year of Production Use

<iframe
  width="100%"
  height="530"
  src="https://www.youtube.com/embed/2dlCObSvgBc"
  frameborder="0"
  allowfullscreen>
</iframe>

## History
Couple of years ago we decided to completely change architecture of our system.
We used to have monolithic application written in PHP with bunch of maintenance
scripts around it. Changing in this system was not easy and what matter the
most not fast enough for our business to grow. We decided to switch to
Microservice architecture. This switch require changing our infrastructure and
the way we operate with our applications. We used to have one application and
now we want to move to many small applications that can be  developed, deployed
and scaled separately. At the beginning we try to launch application in
dedicated VMs but it wasn’t as efficient in resources nor fast and agile, so
we searched for something new.
When we began our journey to microservices and containers there were not so
many solutions on a market as today. Most of them were fresh and not battle
proven. We evaluated couple of them and finally decided to use Mesos and
Marathon as our main framework. Below is the story of our scaling issues with
Marathon.

![Microservices visualization](/img/articles/2017-03-08-hitting-the-wall/vizceral.jpg)

## Problems

### JVM
Marathon running on JVM. It's default setting is modest. Take a look at metrics
and if you see Marathon spends much time in GC or you can't see razor shape on
your heap, check your GC and heap settings. There are many talks and talks on
tuning JVM. Finally we are running Marathon on 16 CPU VM with 6 GB of heap.

#### Zookeeper
Marathon uses [Zookeeper (ZK)](https://zookeeper.apache.org/) as it’s storage.
ZK is a key value store focused
more on data consistency then availability. One of disadvantage of ZK is it
doesn’t work well with huge objects. If stored objects are getting bigger
write to ZK take more. By default stored entry must fits in 1MB. Unfortunately
Marathon data layout does not fit well with this constraint. Marathon saves
deployments as a state before and after. This means if you deploy new
application, deployment will take double of your applications state. In small
installations it’s not a problem, but when you have more and more
applications at some point you can notice your ZK write times takes longer and
at some point you will end with following error:

```shell
422 - Failed to deploy app [/really/important/fix] to [prod].
Caused by: (http status: 422 from https://production).
RESPONSE: [{
  "message":"Object is not valid",
  "details":[{
    "path":"/",
    "errors":[
      "The way we persist data in ZooKeeper would exceed the maximum ZK node
      size (1024000 bytes). You can adjust this value via --zk_max_node_size,
      but make sure this value is compatible with your ZooKeeper ensemble!
      See: http://zookeeper.apache.org/doc/r3.3.1/zookeeperAdmin.html#Unsafe+Options"
    ]
  }]
}]
```

It will thrown by Marathon when you want to deploy critical fix
([Murphy's law](https://en.wikipedia.org/wiki/Murphy's_law) works perfectly).
This was a huge problem until Marathon 0.13 but now ZK compression is default
and it’s generally working but still it’s not unlimited especially if you
app definitions does not compress well.

Another issue with ZK like with any other high consistency storage is delay
between the nodes. You really want to put them close and created backup cluster
in other zone/region to quickly switch if there is an outage. Having cross DC
ZK cluster will cause long write times and often reelection.

ZK works best if you minimize number of objects it store. Changing
`zk_max_version` _(deprecated)_ from default 25 to 5 or less will save some space.
Be careful with this if you often scale your applications because you can hit
[MARATHON-4338](https://jira.mesosphere.com/browse/MARATHON-4338).

### Metrics
[Marathon 0.13](https://github.com/mesosphere/marathon/releases/tag/v0.13.0)
was one of the biggest release in Marathon. It brings many
improvements and bugfixes. It also bring metrics collection and sending them to
graphite and datadog. This is nice.
We started having problems with CPU usage on our Marathon cluster. We profiled
it with honest profiler and it turns out Marathon spent 20% of it’s time on
metrics collection. By default metrics are collected every 10s we changed this
to 55s and reduced time to less than 2%.

![Flame graph with default metrics setting](/img/articles/2017-03-08-hitting-the-wall/flam_metrics.png)

### Threads
Marathon is build with Scala. It’s using Akka as a actor framework. It’s
configuration suggest that there should be
[64 threads in akka pool](https://github.com/mesosphere/marathon/blob/v1.3.10/src/main/scala/mesosphere/marathon/Main.scala#L100) and [100 threads in IO pool](https://github.com/mesosphere/marathon/blob/v1.3.10/src/main/scala/mesosphere/util/ThreadPoolContext.scala#L8).
This configuration seems valid. When our cluster grows and
we were having more and more applications we noticed that threads number also
increased. With 2k tasks we have up to 4k of threads. This is quite a lot and
we lost precious CPU time on task switching. After weeks of hard work we manage
to reduce this number to 200 threads and our changes
[was merged and released](https://github.com/mesosphere/marathon/pull/4912).
Still it’s more than configured value but we can handle this.

![Marathon threads](/img/articles/2017-03-08-hitting-the-wall/marathon_threads_1.png)

Another optimization we introduced was to increase
`akka.default-dispatcher.throughput` to 20. According to
[the docs](http://doc.akka.io/docs/akka/current/scala/dispatchers.html)
this setting will make actor operate on batch of messages.

> Throughput defines the maximum number of messages to be
> processed per actor before the thread jumps to the next actor.
> Set to 1 for as fair as possible.

This is double edge sword. Too low value will totally decrease performance
because of actor switching and totally disabling cache. On the other hand to
high value could cause actor starvation and timeouts. We increased it 4 times
and see small improvement.

### Healthchecks
Marathon has health checks from the beginning, before they were introduced in
Mesos. Every our task has configured HTTP healthcheck. Because Marathon makes
makes requests from single machine - currently leading master it’s quite
expensive especially when you need to make thousands HTTP requests. To reduce
the load we increased Marathon health check interval. Fortunately Mesos in a
mean time Mesos incorporated HTTP health checks and it was added to Marathon
1.4 so soon we can switch and make checks locally on agents.
There is a great post on
[Mesos Native HTTP healtchecks](https://mesosphere.com/blog/2017/01/05/introducing-mesos-native-health-checks-ap
ache-mesos-part-1/)
You can read there Marathon checks works up to 2k tasks while Mesos scales well.
If you want to switch to Marathon 1.4 and use Mesos healthchecks keep in mind
it's new mechanism and there are issues with it:
[MESOS-6786](https://issues.apache.org/jira/browse/MESOS-6786)
[MESOS-6790](https://issues.apache.org/jira/browse/MESOS-6790)

### Events
Marathon allow two way of events subscription. HTTP callbacks
([deprecated from 1.4](https://jira.mesosphere.com/browse/MARATHON-2378))
when events are pushed to subscriber with HTTP POST and SSE when
subscriber make connection and receives events on one connection. Since
callbacks looks easier from developer perspective we created services using
this method. It’s just regular web application accepting POSTs. First problem
is the size of events. They could be big
[(MARATHON-4510)](https://jira.mesosphere.com/browse/MARATHON-4510).
For example deployment events
contains whole deployment object this mean whole Marathon applications state
before and after deployment and steps that will be performed to achieve it.
Another drawback is with callbacks events can’t be filtered so it need to be
done on subscriber side. This is waste of CPU and network because events need
to be parsed from Scala to JSON and then form JSON and eventually dropped.
Currently Marathon spends most of it’s time on parsing events. We added
[filtering by event type](https://github.com/mesosphere/marathon/blob/d408ef6abeea1e0d06de1d568c6f2cc79e90328a/docs/docs/event-bus.md#filtering-the-event-stream)
to SSE and moved to this subscription.

Another problem with subscription is that it is asynchronous way of
communication. We are currently using it in
[marathon-consul](https://github.com/allegro/marathon-consul)
but we see it’s not the best way of registering services in discovery service.
Due to JSON
parsing and sending subscriptions are sensitive to CPU and network load. When
many deployments are triggered in same time we experienced lag on events over
couple of minutes.

![Marathon events delay](/img/articles/2017-03-08-hitting-the-wall/marathon-consul-dev.png)

Our solution to this problems it to create custom executor
that will register application in our systems just like Aurora does. This will
give use necessary blocking features on actions that are critical and could not
be done asynchronous. Unfortunately there is an issue with custom executor
support and it's looks like nobody is using it
[MARATHON-4210](https://jira.mesosphere.com/browse/MARATHON-4210)

### Deployments
In company with over 600 developers located in one timezone deployments
multiple deployments occurs at the same time. This is a problem for Marathon
since it must update the state in ZK and this sometimes timeout. If you can try
to group deployments and sent them in one batch. Then marathon will work.
Unfortunately this coupling is not perfect and we don’t introduced it yet.

### Autentication and Authorization
Marathon has plugin module that allows adding custom fine grained authentication
and authorization. Do not use it. We tried and we failed. API change with every
release. But what's more important plugin API is designed to get permissions For
single application. This means if you have thousands applications and you want
to query `/v2/apps` Marathon will call your plugin thousands times and then
render response with only applications you can see.

Instead of using plugin create a facade that will authenticate requests and
sanitize output from data user should not see.

## Summary
To sum up, marathon is nice Mesos framework for small installations. If you
have more than thousands application and more then 10k tasks you will hit the
wall.

### How to avoid the wall:

* Monitor - enable metrics but remember to reduce gather interval.
* Update to 1.3.10 (usign edge release could be painful).
* Tune JVM - add more heap and CPUs :)
* Do not use event bus if you really need to use filtered SSE and accept it is
asynchronous and events are delivery at most once.
* If you need task life cycle events use custom executor.
* Prefer batch deployments instead of many single ones.

If above suggestions does not help think about sharding. You can use project like
[Triatlon](https://github.com/schibsted/triathlon). If this still does not help
try [Aurora](https://aurora.apache.org/).
It has less features and slower development but is proven to work
on huge capacity at Twitter and more stable then Marathon.
