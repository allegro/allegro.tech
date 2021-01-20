---
layout: post
title: Caching — CQK Top 10
author: bartosz.walacik
tags: [cqk-top-10, cache]
---

> This article is a part of [CQK Top 10]({% post_url 2016-09-23-CQK-TOP-10 %}) series.

Many developers add cache to their application without measuring its performance impact.
We are advising here that each application cache should have a very good reason to exists.

## Do you know where you need a cache?

Using a cache has its costs, so it should pay its way.
Caching makes sense only if hit ratio is high, let’s say above 50%.
Caching costs consist of:

* CPU and RAM resources,
* GC time (in case of on-heap cache),
* increased code complexity,
* risk of introducing bugs which can be very difficult to detect (e.g. keys interference).

If you don’t know the hit ratio of your cache,
start to measure it. Remove ineffective caches from your application.

## Do you have metrics for your cache?

Following metrics let us evaluate the performance of a cache:

* request-count – number of cache access operations,
* hit-count – number of access operations when results were returned from the cache,
* miss-count – number of access operations when a source service/function was called,
  because the result was not available in the cache
* cache-size - number of items stored in the cache,
* max-size - maximum number of items in the cache (usually constant),
* utilization – percentage of cache-size to max-size.

First three metrics are *throughput* metrics and the last three are simple *sampling* metrics.

Throughput metrics are usually visualized using moving average window, typically with one-minute or five-minute length.
For example, if request-count measured at some point in time is 1000 and
then measured after one minute is 2000, we calculate throughput as 1000 RPM (requests per minute)
== 17 RPS (requests per second).

It’s convenient to visualize hit and miss metrics as ratios or percentages:

```
hit-ratio = hit-count / request-count
miss-ratio = miss-count / request-count
```

**Following examples** show how to measure a
[Guava Cache](https://github.com/google/guava/wiki/CachesExplained) instance
using [Dropwizard Metrics](http://metrics.dropwizard.io/) (standard tool for gathering metrics in the JVM world).
In Dropwizard domain, a throughput metric is called `Meter` and a sampling metric is called `Gauge`.

Gauges are registered once when the cache is created and then Dropwizard samples metered values
whenever it wants:

```java
void registerCacheSizeMetric(Cache<K, V> myCache, MetricRegistry metricRegistry) {
    metricRegistry.register("myCache.cacheSize", (Gauge) () -> myCache.size());
}
```

Meters require more code. You need to `mark()` them explicitly,
each time the cache is accessed:

```java
Optional<V> meteredGet(Cache<K, V> myCache, K key, MetricRegistry metricRegistry) {
    metricRegistry.meter("myCache.requestCount").mark();

    Optional<V> result = Optional.ofNullable(myCache.getIfPresent(key));

    if (result.isPresent()){
        metricRegistry.meter("myCache.hitCount").mark();
    } else {
        metricRegistry.meter("myCache.missCount").mark();
    }
    return result;
}
```

Basic reporting to `System.out`:

```java
void printSomeMetrics(MetricRegistry metricRegistry) {
    double requests = metricRegistry.meter("myCache.requestCount").getOneMinuteRate();
    double hit = metricRegistry.meter("myCache.hitCount").getOneMinuteRate();
    double hitRatio = hit / requests;

    System.out.println("cache throughput = " + requests + " RPS (m1 rate)");
    System.out.println("cache hitRatio =   " + hitRatio +" (m1 rate)");
}
```

As it’s a good practice to visualize these metrics, think about adding them to your service’s
dashboard.

## Is your cache configured properly?

A poorly configured cache will never achieve high hit-ratio if:

* the number of possible items significantly exceeds the cache max-size (high replacement rate),
* TTL (time to live) is too short – items disappear before the cache warms up.

## Do you know how your application performs on cold cache?

Upon the application start, the cache is empty (cold) and its hit-ratio equals 0.
During the cache warm up phase the application might need more resources
and response time might be significantly longer.

One of the solutions involves forced loading the cache before processing clients requests.

## Can you justify your TTL configuration?

Often TTL configuration is just a shot in the dark.
Is one minute OK? How about 15 minutes? Setting TTL properly
using only expert knowledge is hard.
On the one hand, you have business requirements
telling you to return as fresh data as possible which means keeping TTL short.
On the other hand, short TTL may result in a low hit-ratio.

Do not use a crystal ball but metrics to make the decision.

## What kind of data do you use for performance testing?

Test data with low variability are perfect for caching, so avoid it.
When testing overall performance of your application,
always use test data with characteristics similar to data from live environment.

## Do you cache necessary data only?

If a cache size grows too large think whether you really need to store big domain objects.
Perhaps several IDs will do just fine?

## Do you know how your cache keys are constructed?

Errors in the construction of cache keys can be difficult to detect and very painful.

* If the key is less distinctive than it should be
  (different items are assigned to the same cache key) –
  the application will mix up some data, and errors will look non-deterministic.
* If the key is more distinctive than it should be
  (different keys are assigned to the same items) –
  the hit-ratio will be low and the cache will perform poorly.

## Do you use local cache in the first place?

Use the local cache as a first choice.
Distributed cache (like Hazelcast, Redis) complicates architecture and introduces additional
stability risks and requirements:

* Your items must be serialized.
* If your item model changes, some kind of migration/maintenance
  must be handled. Either your application must be backward-compatible
  with the previous item model or the cache must be purged before application deployment.
* In fact, a distributed cache is another service dependency. You are supposed
  to develop some fallback for the case of its outage.
