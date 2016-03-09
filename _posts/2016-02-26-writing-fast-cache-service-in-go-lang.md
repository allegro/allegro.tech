---
layout: post
title: Writing a very fast cache service with millions of entries in Go
author: [lukasz.druminski,tomasz.janiszewski]
tags: [tech, cache, service, golang, go, bigcache]
---

Recently our team has been tasked to write a very fast cache service. The goal was pretty clear but it was a possible
to achieve it in many ways and in many programming languages. Finally we decided to try something new and implement the service in [Go](https://golang.org/).
We described how we did it and what values come from that.

## Table of contents:
1. [Requirements](#requirements)
2. [Why Go?](#why-go)
3. [The Cache](#the-cache)
    1. [Concurrency](#concurrency)
    2. [Eviction](#eviction)
    3. [Omitting Garbage Collection](#omitting-garbage-collection)
    4. [BigCache](#bigcache)
4. [Http server](#http-server)
5. [JSON deserialization](#json-deserialization)
6. [Final results](#final-results)
7. [Summary](#summary)

## Requirements
We received following requirements:

* uses HTTP protocol to handle requests
* handles 10k rps (5k for writes, 5k for reads)
* caches entries for at least 10 minutes
* serves responses within (measured without time spent on the network) below than
    * 5ms --  mean
    * 10ms for 99.9th percentile
    * 400ms for 99.999th percentile
* handles POST requests with JSON messages, where each message:
    * contains a entry and its ID
    * is not larger than 500 bytes
* can retrieve an entry and return int via a GET request immediately after the
entry was added via a POST request (consistency)

In simple words, our task was to write a fast, evicting dictionary with a REST interface.

## Why Go?

Most microservices at our company are written in Java or another JVM based language, some in Python.
We also have monolithic, legacy platform written in PHP but we don’t touch it unless we have to.
We already know those technologies but we are open to exploring a new one.
Our task could be realized in any language, therefore we decided to write it in Go.

Go has been available for a while now, backed by [a big company](https://www.google.pl/) and a growing community of users.
It’s advertised as a compiled, concurrent, imperative, structured programming language. It also has managed memory,
so it looks safer and easier to use than C/C++. We have quite good experience with tools written in Go and decided to use it here.
We have one [open source project in Go](https://github.com/allegro/marathon-consul/#marathon-consul-),
now we wanted to know how Go handles big traffic. We believed the whole project would take less than 100 lines of code and be fast
enough to meet our requirements just because of Go.

## The Cache
To meet the requirements, the cache in itself needed to:

* be very fast even with millions of entries
* provide concurrent access
* evict entries after a predetermined amount of time

Considering the first point we have decided to give up external caches like [Redis](http://redis.io/), [Memcached](http://memcached.org/) or [Couchbase](http://www.couchbase.com/) mainly because
of additional time needed on the network. Therefore we have focused on in-memory caches, with HTTP facade easy to deploy in out stack.
In Go there are already ready to use caches of this type, i.e. [LRU groups cache](https://github.com/golang/groupcache/tree/master/lru),
[go-cache](https://github.com/patrickmn/go-cache), [ttlcache](https://github.com/diegobernardes/ttlcache).
Unfortunately none of them fulfiled our needs. Next subchapters reveal why and describe how we achieved the characteristics mentioned above.

### Concurrency
Our service would receive many requests concurrently, so we needed to provide concurrent access to the cache.
The easy way to achieve that would be to put `sync.RWMutex` in front of the cache access function to ensure that only one goroutine could modify it at a time.
However other [goroutines](https://gobyexample.com/goroutines) which would also like to make modifications to, it would be blocked, making it a bottleneck.
To eliminate this problem, shards could be applied. The idea behind shards is straight forward. Array of N shards is created,
each shard contains it’s own instance of the cache with a lock. When an item with unique key needs to be cached a
shard for it is chosen in of first by the function `hash(key) % N`. After that cache lock is acquired and a write to the cache takes place.
Item reads are analogue. When number of shards is relatively high and the hash function returns
properly distributed numbers for unique keys then the locks’ contention can be minimized almost to zero.
This is the reason why we have decided to shards in cache.

### Eviction
The simplest way to evict elements from the cache is to use it together with [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) queue.
When an entry to the cache is added then two additional operations take place:

1. Entry with its key and creation timestamp are added to the end of queue.
2. The oldest element is read from queue. Its creation timestamp is compared with current time.
   When it is later than eviction time, the element from the queue is removed together with its corresponding entry in the cache.

Eviction is performed during writes to the cache since the lock is already acquired.

### Omitting Garbage Collection
In Go when a map with millions of objects is created then garbage collection (GC) will touch all those objects during mark and scan phase.
This can cause a huge impact on responsiveness of the application. We run a few tests on our service
in which we fed the cache with millions of entries and after that we started to send requests to the REST endpoint
which was performing only some static JSON serialization (it didn’t touch the cache).
Before the we started sending requests, this endpoint responsiveness was max 10ms for 10k rps. After the fed it was ***more than a second*** for 99 percentile.
Metrics indicated that there were over 40 mln objects in the heap anf GC mark and scan phase took over four seconds as well.
The test showed us that we needed to skip GC for cache entries if we wanted to meet our requirements related with response times.
How could we do this? There were two options. GC is limited to heap so the first one is to go off-heap.
There is one project which can help with that, called [offheap](https://godoc.org/github.com/glycerine/offheap).
It provides custom functions `Malloc()` and `Free()` to manage memory outside the heap.
However a cache which relied on those functions would need to be implemented.
But there was another way to omit GC for cache entries and it was related with optimization presented in Go version 1.5
([issue-9477](https://github.com/golang/go/issues/9477)). This optimization states that if you use a map
without pointers in keys and values then GC will omit it. It is a way to stay on heap and to omit GC for entries in the map.
Although it is not the end of the solution because basically everything in Go is built on pointers:
structs, slices, even fixed arrays. Only primitives like int, bool don’t touch pointers. So what could we do with `map[int]int`?
Since we already generated hashed key in order to pick up proper shard from the cache (described in [Concurrency](#concurrency))
we would reuse them as keys in our `map[int]int`. But what about values of type int? What information could we keep as int?
We could keep addresses to proper entries. Another question is where those entries could be kept in order to omit GC again?
A huge array of bytes could be allocated and entries could be serialized to bytes and kept in it. In this respect,
a value from `map[int]int` could point to an where entry started in the proposed array. And since FIFO queue was used
to keep entries and control their eviction of them (described in [Eviction](#eviction)), it could be rebuilt and based on a huge bytes array
to which also values from that map would point.

In both scenarios entries (de)serialization will be needed.
Finally we decided to use the second solution, to stay on heap as somehow we found it is easier to achieve because
we already had most elements -- hashed key (already calculated in shard selection phase) and the entries queue.

### BigCache
To meet requirements presented at the beginning of this chapter we implemented our own cache and named it BigCache.
The BigCache provides shards, eviction and it omits GC for cache entries. As a result it is very cache even for large number of entries.
None of already available in-memory cache in Go provides this kind of functionality so we decided to share it:
[bigcache](https://github.com/allegro/bigcache)

## HTTP server
Memory profiler shows us that some objects are allocated during requests handling. We knew that HTTP handler would be
a hot spot of our system. Our API is really simple. We only accept POST and GET to upload and download elements from cache.
We effectively support only one URL template, so a full featured router was not needed. We extracted the ID from URL by cutting
the first 7 letters and it works fine for us.

When we started development, Go 1.6 was in RC. Our first effort to reduce request handling time was to update to latest RC version.
In our case performance was nearly the same. We started searching for something more efficient and we found
[fasthttp](https://github.com/valyala/fasthttp). It’s a library providing zero alloc HTTP server. According to documentation, it
tends to be 10 times faster than standard HTTP handler in synthetic tests. During our tests it turned out it’s only 1.5 times faster,
but still it’s better!

fasthttp achieves it’s performance by reducing work that is done by HTTP Go package. For example:

* it limits request lifetime to time when it’s actually handled
* headers are lazily parsed (we really don’t need headers)

Unfortunately, fasthttp is not a real replacement for standard http. It’s good for small projects with simple API.
we would stick to default HTTP for normal (non hyper performance) projects.

![fasthttp vs nethttp](/img/articles/2016-02-26-fast-cache-service-in-go-lang/fasthttp-vs-nethttp.png "fasthttp vs nethttp")
Because it doesn’t support routing or HTTP/2 and claim that could not support all HTTP edge cases,

## JSON deserialization

While profiling our application, we found that the program spent a huge amount of time on JSON deserialization.
Memory profiler also reported that a huge amount of data was processed by `json.Marshal`. It didn’t surprise for us.
With 10k rps, 350 bytes per request could be a significant payload for any application. Nevertheless our goal was speed,
so we investigated it.

We heard that Go JSON serializer wasn’t as fast as in other languages. Most benchmarks were done in 2013 so before 1.3 version.
When we saw [issue-5683](https://github.com/golang/go/issues/5683) claiming Go was 3 times slower than Python and
[mailing list]( https://groups.google.com/forum/#!topic/golang-nuts/zCBUEB_MfVs) saying it was 5 times slower, we started searching for a better solution.

Definitely JSON over HTTP is not the best choice if you need speed. Unfortunately, all our services talk with each other in JSON,
so incorporating a new protocol was out of scope for this task (but we are considering using [avro](https://avro.apache.org/),
as we did for [Kafka]( http://allegro.tech/2015/08/spark-kafka-integration.html)). We decided to stick with JSON.
A quick search provided us with a solution called [ffjson](https://github.com/pquerna/ffjson).

ffjson documentation claims it’s 2-3 times faster than standard `json.Unmarshal`, and also uses less memory to do it.

--------|-------------|-----------|--------------|
json    | 16154 ns/op | 1875 B/op | 37 allocs/op |
ffjson  | 8417 ns/op  | 1555 B/op | 31 allocs/op |

Our tests confirmed ffjson was nearly 2 times faster and performed less allocation than built-in unmarshaler. How was it possible to achieve this?

Firstly, to full use features of ffjson we needed to generate unmarshaller for our struct. Generated code is in fact a parser that scans bytes,
and fills objects with data. If you take a look at [JSON grammar](http://www.json.org/) you will discover it’s really simple.
ffjson take advantage of knowing exactly what a struct looks like, parses only fields specified in the struct and fail fast whenever error occurs.
Standard marshaler uses expensive reflection calls to obtain struct definition at runtime.
Another optimization is reduction of unnecessary error checks. `json.Unmarshal` will fail faster performing fewer allocs, and skipping reflection calls.

-------|------------|-----------|--------------|
json   | 1027 ns/op | 384 B/op  |  9 allocs/op |
ffjson | 2598 ns/op | 528 B/op  | 13 allocs/op |

More information about how ffjson works can be found here
[ffjson-faster-json-in-go](https://journal.paul.querna.org/articles/2014/03/31/ffjson-faster-json-in-go/).
Benchmarks are available [here](https://gist.github.com/janisz/8b20eaa1197728e09d6a)

## Final results

Finally we sped up our application from more than 2.5 seconds to less than 250 milliseconds for longest request.
These times occur just in our use case. We are confident that fora lerger number of writes or longer eviction period,
access to standard cache can take much more time but with BigCache it can stay on milliseconds level, because root of
long GC pauses was eliminated.

The chart below presents a comparision of response times from before optimizations and after optimizations of our service.
During the test we were sending 10k rps, from which 5k were writes and another 5k were reads.
Eviction time was set to 10 minutes. The test was 35 minutes long.

![response times before and after optimizations](/img/articles/2016-02-26-fast-cache-service-in-go-lang/results-before-and-after-optimizations.png "results before and after optimizations")

Final results in isolation, setup the same as described above.

![final results](/img/articles/2016-02-26-fast-cache-service-in-go-lang/results-after-optimizations.png "final results")

## Summary

If you don’t need high performance stick to standard libs. They are guaranteed to be maintained, and have backward compatibility,
thereby upgrading Go version will be smooth.

Our cache service written in Go finally met our requirements. However we needed to write our own version of in-memory cache which is concurrent,
supports eviction and omits GC because millions of objects under its control can have a huge impact on application responsiveness.
We are convinced that our task could be realized much faster in other languages but now it can be realized this quickly in Go thanks to BigCache :)
