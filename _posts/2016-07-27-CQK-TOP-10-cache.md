---
layout: post
title: CQK TOP 10 — Caching
author: bartosz.walacik
tags: [tech, cqk-top-10, cache]
---

This article is a part of [CQK Top 10](). //TODO add link
Many developers add cache to their application without measuring performance impact.
We are advising here, that each application cache should have vary good reasons to exists.

## Do you know where you need a cache?

Using a cache makes costs, so it should earn for itself.
Caching makes sense only if hit ratio is high, let’s say above 50%.
Caching costs consist of:

* CPU and RAM resources,
* more work for GC (in case of on-heap cache),
* increased code complexity,
* risk of introducing bugs which can be very difficult to detect (e.g. keys interference).

If you don’t know hit ratio of your cache,
start to measure it. Remove ineffective caches from your application.

## Do you have metrics for your cache?

Following metrics let us evaluate performance of a cache:

* request-count – number of cache access operations,
* hit-count – number of access operations when results were returned from a cache,
* miss-count – number of access operations when a source service/function was called,
* cache-size - number of items stored in a cache,
* max-size - maximum number of items in a cache (constant),
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

**Following examples** shows hot to measure a
[Guava Cache](https://github.com/google/guava/wiki/CachesExplained) instance
using [Dropwizard Metrics](http://metrics.dropwizard.io/) (standard tool for gathering metrics in the JVM world).
In Dropwizard domain, throughput metric is called `Meter` and sampling metric is called `Gauge`.

Gauges are registered once when the cache is created and then Dropwizard samples metered values
whenever he wants:

```java
void registerCacheSizeMetric(Cache<K, V> myCache, MetricRegistry metricRegistry) {
    metricRegistry.register("myCache.cacheSize", (Gauge) () -> myCache.size());
}
```

Meters requires more code. You need to `mark()` them explicitly,
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

## Cache configuration

A poorly configured cache will never record high hit ratio if:

* the number of items significantly exceeds the cache size (high replacement rate),
* TTL is too short – your items will disappear before the cache warms up.

## Application performance and cold cache

Upon the application start, the cache is empty and its hit ratio amounts to 0%.
So, what influence does the process of warming up cache have on the application performance?
It might need more resources upon start or response time might be significantly
longer in case of cold cache.

One of the solutions involve loading cache before processing clients requests.

## Setting TTL
Quite often TTL, i.e. lifetime of data stored in a cache, is set upon no data at all.
Is one minute OK? How about 15 minutes?
Setting TTL properly without carrying out any research is actually almost impossible.
On the one hand, you have business requirements telling you to keep TTL short.
On the other hand, short TTL may translate into low hit ration.

Do not use a crystal ball, but metrics to make the decision.

## Data for performance testing

Test data of low variability is perfect for caching, so avoid it.
When testing performance of your cache,
always use data whose variability matches the variability of live environment data.

## Store necessary items only
If a collection of data is large, think twice whether you really need to store a domain object.
Perhaps several IDs will do just fine?

## Construction of cache keys
Any errors in the construction of cache keys are difficult to detect and cause a lot of problems.

* If the key is less distinctive (two different items are assigned the same cache key),
  the application will mix up some data, and errors will look like non-deterministic ones.
* If the key is more distinctive (two different items are assigned different, but incorrect keys),
  the hit ratio will be low and the cache will underperform.

## Using local cache in the first place
Use a local cache first if possible, as distributed cache (5Cache, Redis) is more demanding:

* Your items must be serialized.
* The serialization format must be backwards-compatible (within application version/model).
* In fact, a distributed cache is another service, which you have to maintain.

