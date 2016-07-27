---
layout: post
title: CQK TOP 10 — Caching
author: bartosz.walacik
tags: [tech, cqk-top-10, cache]
---

This article is a part of [CQK Top 10](). //TODO add link
Many developers add cache to their application without measuring
how it influences performance.
We are advising here, that application caches should be used sparingly
and each application cache should have vary good reasons to exists.

## Placing cache in the right place

Decision about using and maintaining a cache must be well-considered.
An application cache makes sense only when you have high hit ratio.
When creating a cache remember about:

* extra use of resources, CPU and RAM,
* extended duration of GC cycle (in case of heap-based allocation),
* your code becoming even more complex,
* potential errors that may occur, but are difficult to detect.

If you do not know your hit ratio, measure it and remove any ineffective caches
from your application.

## Metrics for your cache

To evaluate the performance of your cache, you need to monitor the following metrics:

* hit ratio – percentage of access operations that result in cache hits,
* request count – number of cache hits indicating how often it is used,
* miss ratio – percentage of access requests to source service/function,
* utilization – percentage of the cache in use.

As it’s a good practice to monitor these metrics, think about adding them to your service’s dashboard.
In the event you use [Guava Cache](https://github.com/google/guava/wiki/CachesExplained),
monitor metrics of the *gauge* type,
which retrieve a `CacheStats` object on a regular basis from the `Cache.stats()`
method and display values such as `CacheStats.hitRatio()` or `CacheStats.missRatio()`:

```java
MetricRegistry registry = ... // see https://github.com/dropwizard/metrics
Cache<String, Object> myCache = CacheBuilder.newBuilder().build();

registry.register("myCache.hit-ratio", (Gauge<Double>) () -> myCache.stats().hitRate());
registry.register("myCache.miss-ratio", (Gauge<Double>) () -> myCache.stats().missRate());
registry.register("myCache.request-count", (Gauge<Double>) () -> myCache.stats().requestCount());
```

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

