---
redirect_from:
   - /writing-fast-cache-service-in-go-lang.html
layout: post
title: Writing very fast cache service with millions of entries in Go
author: [lukasz.druminski,tomasz.janiszewski]
tags: [tech, cache, service, golang, go, bigcache]
excerpt: Recently our team obtained a task to write a very fast cache service. The task is pretty clear but it can be solved
         in many ways and in many programming languages. Ultimately we have decided to implement the service in Go.
         Check out how we did it and what values come from that.
---

## Table of contents:
1. [Introduction](#introduction)
2. [Requirements](#requirements)
4. [Why Go](#why-go-lang)
3. [The Cache](#the-cache)
    1. [Concurrency](#concurrency)
    2. [Eviction](#eviction)
    3. [Omitting GC](#omitting-gc)
    4. [BigCache](#bigcache)
4. [Http server](#http-server)
5. [Json deserialization](#json-deserialization)
6. [Final results](#final-results)
7. [Summary](#summary)

## Introduction
Recently our team has been tasked to write a very fast cache service. The task was pretty clear but it can be solved
in many ways and in many programming languages. Finally we have decided to implement the service in [Go](https://golang.org/).
We described how we did it and what values come from that.

## Requirements
Write a cache service which:

* uses HTTP protocol to handle requests
* handles 10k rps (5k for writes, 5k for reads)
* caches entries from requests for at least 10 minutes
* serves responses in time (measured without time spent on network) below than
    * 5ms -  mean
    * 10ms for 99.9th percentile
    * 400ms for 99.999th percentile
* entries are instantly cached after POST requests (on single node, no replication)
* requests are in JSON format, each message contains:
    * entry id
    * JSON object
* size of the message is up to 500 bytes

## Why Go

In simple words we are creating dictionary with
rest interface. It could be done in any language. Most of services in our company
are written in Java or other JVM based language, some in Python and
core of our service is in PHP. We knew that technologies and wanted to test
something new.

Go is the thing. It's been around for a while, backed by [a big company](https://www.google.pl/) and growing
community of users. It's advertised as a compiled, concurrent, imperative, structured
programming language. It also has managed memory, so looks safer and easier to use
than C/C++. We have quite good experience with tools written in Go and decided to
use it here. We have one [open source project in Go](https://github.com/allegro/marathon-consul/#marathon-consul-)
but we wanted to know how it handle big traffic.
We believed whole project would take less than 100 SLOC and be fast
enough to meet our requirements just because of Go.

## The Cache
To meet the requirements, the cache in itself need to:

* be very fast even with millions of entries
* provide concurrent access
* evict entries after proper amount of time

Considering the first point we have decided to give up external caches like redis, memcached or couchbase mainly because
of additional time needed on network. Therefore we have focused on in-memory caches.
In Go there are already implemented type of these caches, i.e. [LRU groups cache](https://github.com/golang/groupcache/tree/master/lru),
[go-cache](https://github.com/patrickmn/go-cache), [ttlcache](https://github.com/diegobernardes/ttlcache).
Unfortunately none of them fulfil our needs. Next subchapters reveal why and describe how we achieved mentioned characteristics.

### Concurrency
Our service will receive many requests concurrently, consequently we need to provide concurrent access to the cache.
The easy way to achieve that is to put `sync.RWMutex` in front of the cache to ensure that only one goroutine will modify it at a time.
However other goroutines which also would like to make modification on it will be blocked, therefore it’s a bottleneck.
To eliminate it shards can be applied. The idea behind shards is straight, array of N shards is created,
each shard contains it’s own instance of cache with lock. When item with unique key needs to be cached then
shard for it is chosen in a first place by function `hash(key) % N`. After that cache lock is acquired and write to cache has a place.
Item reads are analogues. When number of shards is respectively high and hash function returns
properly distributed numbers for unique keys then waits on locks can be minimized basically to value close to 0.
This is the reason why we have decided to shards our cache.

### Eviction
The simplest way to evict elements from cache is to use it together with fifo queue.
When entry to the cache is added then two additional operations take place:

1. Entry with its key and creation timestamp is added at the end of queue.
2. The oldest element from queue is read. Its creation timestamp is compared with current.
   When it is bigger than eviction time, the element from queue is removed also with corresponding entry in cache.

Eviction is done with writes to cache since lock is already acquired.

### Omitting GC
In Go when a map with millions of objects is created then GC during mark and scan phase will touch all those objects.
It can cause a huge impact on responsiveness of application itself. We run few tests on our service
in which we fed the cache with millions of entries and after that we started to send requests on rest endpoint
which was doing only some static JSON serialization (it didn’t touch the cache).
Before the fed this endpoint responsiveness was max 10ms for 10k rps. After the fed it was ***more than a second*** for 99 percentile.
Metrics indicated that there were over 40 mlns objects in the heap as well as GC mark and scan phase took over four seconds.
The test showed us that we need to omit GC for cache entries if we want to meet our requirements related with response times.
How can we do this? There are two options. GC is limited to heap so the first one is to go off-heap.
There is one project which can help with that, it’s name is [offheap](https://godoc.org/github.com/glycerine/offheap).
It provides custom functions `Malloc()` and `Free()` to manage memory outside the heap.
However cache which relies on those functions needs to be implemented.
But there is another way to omit GC for cache entries and it is related with optimization presented in 1.5 version of Go
([issue-9477](https://github.com/golang/go/issues/9477)). This optimization states that if you use map
without pointers in keys and values then GC will omit them. It is a way to stay on heap and omit GC for entries in map.
Although it is not the end of the solution because basically everything in Go is built on pointers:
structs, slices, even fixed arrays. Only primitives like int, bool don’t touch pointers. So what can we do with `map[int]int`?
Well since we already generate hashed key to pick up proper shard with cache (described in [Concurrency](#concurrency))
we can reuse it as key in our `map[int]int`. But what about values type of int, what information can we keep as int?
We can keep address to proper entry. Further question is where those entries can be kept to omit GC again?
Huge array of bytes can be allocated and entries can be serialized to bytes and kept in it. In this respect,
value from `map[int]int` can point where entry starts in proposed array. And since fifo queue is used
to keep entries and control eviction of them (described in [Eviction](#eviction)) it can be rebuilt and based on huge bytes array
to which also values from map will point too.

Two solutions to omit GC for a cache were presented. The first one is off-heap custom cache implementation,
the second one is on-heap with a map[int]int pointing to bytes array. In both scenarios entries (de)serialization will be needed.
Finally we decided to use the second solution, to stay on heap as somehow we found it is easier to achieve because
we had most of elements -- hashed key already calculated in choosing shard phase and queue for entries
could be reused after based it on bytes array.

### BigCache
To meet requirements presented at the beginning of this chapter we have implemented our own version of cache and named it BigCache.
The BigCache provides shards, eviction, omits GC for cache entries. As a result it is very fast cache even for big number of entries.
None of already available in-memory cache in Go provides that kind of functionality so we decided to share with it:
[bigcache](https://github.com/allegro/bigcache)

## Http server
Memory profiler shows us, that some objects are allocated during handling requests. We knew that HTTP handler will be
a hot spot of our system. Our API is really simple. We only accept POST and GET to upload and download elements from cache.
We effectively support only one URL, so full featured router was not needed. We extracted id from URL with cutting
first 7 letters and it works fine for us.

When we started development G 1.6 was in RC. Our first try to reduce request handling time was to update to latest RC version.
In our case performance was nearly the same. We started searching for something more efficient and we found
[fasthttp](https://github.com/valyala/fasthttp). It’s library providing zero alloc HTTP server. And according to documentation
tends to be 10 times faster than standard http handler in synthetic tests. During our tests it turned out it’s only 1.5 times faster,
but still it’s better!

fasthttp achieves it’s performance by reducing work that is done by http Go package. For example:

* it limits request lifetime to time when it’s actually handled
* headers are lazy parsed (we really don’t need headers)

Unfortunately fasthttp is not a real replacement for standard http. It’s good for small projects with simple API.
Because it doesn’t support routing, HTTP/2 and claim that could not support all HTTP edge cases,
we would stick to default HTTP for normal (non hyper performance) projects.

![fasthttp vs nethttp](/img/articles/2016-02-26-fast-cache-service-in-go-lang/fasthttp-vs-nethttp.png "fasthttp vs nethttp")

## JSON deserialization

During profiling our application we found that program spends huge amount of time on JSON deserialisation.
Also memory profiler reports that huge amount of data is processed by `json.Marshal`. It wasn’t surprise for us.
With 10k rps, 350 bytes per request could be significant payload for any application. Nevertheless our goal was speed,
so we investigated it.

We heard that Go JSON serializer isn’t as fast as in other languages. Most benchmarks were done in 2013 so before 1.3 version.
When we saw [issue-5683](https://github.com/golang/go/issues/5683) claiming Go is 3 times slower than Python and
[mailing list]( https://groups.google.com/forum/#!topic/golang-nuts/zCBUEB_MfVs) that it’s 5. We start searching for better solution.

Definitely JSON over http is not the best choice if you need speed. Unfortunately all our services talk with each other in JSON,
so incorporating new protocol will be out of scope for this task (but we are considering using [avro](https://avro.apache.org/),
as we did for [Kafka]( http://allegro.tech/2015/08/spark-kafka-integration.html). We decided to stick with JSON.
Quick search provide us solution [ffjson](https://github.com/pquerna/ffjson).

ffjson documentation claims it’s 2-3 times faster than standard `json.Unmarshal`, and also uses less memory to do it.

-----------------------------|---------|-------------|-----------|--------------|
BenchmarkJsonUnmarshal-4     | 1000000 | 16154 ns/op | 1875 B/op | 37 allocs/op |
BenchmarkFastJsonUnmarshal-4 | 2000000 | 8417 ns/op  | 1555 B/op | 31 allocs/op |

Our tests confirmed ffjson is nearly 2 times faster and does less allocation than built in unmarshal. How was it possible to achieve this?

Firstly to use full features of ffjson we need to generate unmarshaller for our struct. Generated code is in fact parser that scan bytes,
and fill objects with data. If you take a look at [JSON grammar](http://www.json.org/) you will discover it’s really simple.
ffjson take advantage of knowing exactly what struct looks like, and pares only fields specified in struct and fail fast whenever error occurs.
Standard marshaler uses expensive reflection calls to obtain struct definition at runtime.
Another optimisation is reduction of unnecessary error checks. `json.Unmarshal` will fail faster performing less allocs, but still it’s slower:

--------------------------------|---------|------------|-----------|--------------|
BenchmarkJsonErrUnmarshal-4    	| 2000000 | 8203 ns/op | 1663 B/op | 17 allocs/op |
BenchmarkFastJsonErrUnmarshal-4	| 3000000 | 5956 ns/op | 1554 B/op | 31 allocs/op |

More information about how ffjson works can be found here
[ffjson-faster-json-in-go](https://journal.paul.querna.org/articles/2014/03/31/ffjson-faster-json-in-go/).

## Final results

Finally we speed up our application from more than 2.5 seconds to less than 250 milliseconds for longest request.
Those times occur just in our use case, we are confident that for bigger number of writes or longer eviction period,
access to standard cache can take much more time but with BigCache it can stay on milliseconds level.

Below chart presents response times results comparison from before optimizations and after optimizations of our service.
During the test we were sending 10k rps, from which 5k were writes and another 5k were reads.
Eviction time was set to 10 minutes. The test was 35 minutes long.

![response times before and after optimizations](/img/articles/2016-02-26-fast-cache-service-in-go-lang/results-befor-and-after-optimizations.png "results before and after optimizations")

Final results in isolation, setup the same as described above.

![final results](/img/articles/2016-02-26-fast-cache-service-in-go-lang/results-after-optimizations.png "final results")

## Summary

If you don’t need high performance stick to standard libs. They are guaranteed to be maintained, and have backward compatibility,
thereby upgrading Go version will be smooth.

Cache service written in Go finally met our requirements. However we needed to write our own version of in-memory cache which is concurrent,
supports eviction and omits GC because millions of objects under its control can have a huge impact on applications responsiveness.
We are convinced that our task could be realized much faster in other languages but now it can be realized this quickly in Go thanks to BigCache :)
