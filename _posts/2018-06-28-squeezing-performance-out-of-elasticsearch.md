---
layout: post
title: Squeezing performance out of Elasticsearch
author: dorian.sarnowski
tags: [tech, elasticsearch]
---

Lately [my colleague Michał](/authors/michal.kosmulski/) described how he tracked a 
[Java memory leak](/2018/05/a-comedy-of-errors-debugging-java-memory-leaks.html). Although that 
problem was completely solved, new complications suddenly appeared on the horizon. As it usually happens, everything 
started with an alert from our monitoring system which woke me up in the middle of the night. 

## Introduction
Before I start a story I need to give you a little explanation about what Adventory is and how it was designed. 
Adventory is a microservice which is a part of our [PPC Advertising Platform](https://ads.allegro.pl) and its job is to 
take data from MongoDB and put them into Elasticsearch (2.4.6 at the time of writing this article). We do this because 
our index changes so quickly and from performance point of view we decided that it would be better to continuously build 
a fresh Elasticsearch index rather than to update an existing one. For this purpose we have two Elasticsearch clusters. 
One of them serves queries while the other one indexes, and after each indexing they switch their roles.

### Investigation
Our monitoring system told me that our indexing time increased and started hitting 20 minutes. That was too much. A 
couple of months ago we started with 2 minutes and the number of documents increased no more than 3—4 times since then. 
It should be much lower than 20 minutes. We hadn’t changed code related to indexing recently so it seemed to be a bug 
related to increasing load or amount of data in our system. Unfortunately we didn’t realise that things were getting 
worse until we crossed the critical line. We store metrics only for one week so we didn’t know when exactly indexing 
times got worse, we didn’t know if they increased suddenly or kept increasing slowly and consistently. Now, regardless 
of the answer, we needed to fix this quickly because we couldn’t accept these times.

The problem here is that since we were streaming data all the way with 
[backpressure](https://github.com/ReactiveX/RxJava/wiki/Backpressure), we couldn’t see which part of the process was 
slowing everything down. With this architecture it’s hard to see one metric with a separate value for each step because 
all steps execute in parallel. For this reason looking at the metrics gave me no certainty which step of the whole 
process was a bottleneck. 

### First attempt
First I took a look at the times of each step of the indexing part. It turned out that a 
[forcemerge](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-forcemerge.html) lasted ~7 minutes 
in each indexing. I turned this step off and started looking at metrics. It turned out that this part has a crucial 
impact on search latency and without this step search times grew drastically. I gave this idea another try and 
switched ``max_num_segments`` parameter from 1 (which compacts all the data in the index) back to its default (checking 
if a merge needs to execute, and if so, executing it)  but it didn’t work either. So this was a dead end.

### Second attempt
Undeterred by previous failure I tried another idea. Let’s change the way we transform data. When we had written this 
service there was no support for streaming data in Spring Data MongoDB. We needed to sort data with a given limit and 
implement our own equivalent of streaming. It was clearly not efficient. I rewrote this to use streams. By the way, we 
hit the hidden feature of MongoDB: default 
[idle timeout](https://docs.mongodb.com/manual/reference/method/cursor.addOption/#DBQuery.Option.noTimeout). After 
fixing this, there was no good news again. This change had no significant effect on performance.

### Third attempt
Due to lack of progress my colleague took over the helm and tried some different configuration options. Some were 
unsuitable:

* set 
[refresh_interval](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-update-settings.html#bulk) 
to ``—1`` — since we do forcemerge in the end we don’t need to refresh during indexing,
* turning off 
[\_field_names](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-field-names-field.html) field — 
this is Elasticsearch’s feature which comes with a price and since we didn’t take advantage of it we could easily 
disable it,
* playing with [translog](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-translog.html) 
options.

Some helped a little:

* turn off [doc_values](https://www.elastic.co/guide/en/elasticsearch/reference/current/doc-values.html) for fields we 
don’t sort or group,
* turn off [\_all](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-all-field.html) field,
* store in [\_source](https://www.elastic.co/guide/en/elasticsearch/reference/6.2/mapping-source-field.html) only those 
fields' values which we really need, although this one might be tricky because these fields will be harder to debug in 
the future,
* increasing the number of threads on which we process all data. We needed to be careful with this since too many 
threads may cause memory problems.

After this step times dropped from ~20 minutes to ~12 minutes. It was a significant improvement but it's not enough. 

### The final attempt
Reviewing recently added features I found one which drew my attention. We added another ability to filter results, this 
time by key-value pairs. The structure in the index was following:

```json
{
  "filters": {
    "key1": [
      "value1",
      "value2",
      "value3"
    ],
    "key2": [
      "value1",
      "value2",
      "value3"
    ]
  }
}
```

I turned these fields off for a couple of indexing runs and times dropped to ~4.5 minutes. The problem was that we had 
many different keys and because of the way the index was organized internally it could be a 
[performance issue](https://www.elastic.co/guide/en/elasticsearch/reference/current/general-recommendations.html#_normalize_document_structures). 
Fortunately, since we only used filters for search we could refactor it a little bit to the following structure:

```json
{
  "filters": [
    "key1_value1",
    "key1_value2",
    "key1_value3",
    "key2_value4",
    "key2_value5",
    "key2_value6"
  ]
}
```

Due to this change we stopped forcing Elasticsearch to create heavy structures for storing many keys. Instead we make 
some kind of enum values from key-value pair and stored it in Elasticsearch in the way its optimal for both indexing and 
searching.  

### Conclusion

Why didn’t we earlier realise that indexing times have increased? Because they increased slowly over time rather than in 
a sudden peak and not enought to hit our critical level in the monitoring system. And this level was hit a couple of 
days after deployment of filtering (as described before) when we had higher traffic. Unfortunately there is no obvious 
solution for these kinds of problems. The best what we can do is to observe metrics after each deployment and maybe even 
put them permanently on the screen in the developers’ room. It may be worth considering setting up a tool for 
[anomaly detection](https://www.bigpanda.io/blog/a-practical-guide-to-anomaly-detection/) as well.    
