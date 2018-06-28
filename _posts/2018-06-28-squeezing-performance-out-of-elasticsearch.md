---
layout: post
title: Squeezing performance out of Elasticsearch
author: dorian.sarnowski
tags: [tech, elasticsearch]
---

Lately Michał described how he was tracking a 
[Java memory leak](https://allegro.tech/2018/05/a-comedy-of-errors-debugging-java-memory-leaks.html). Although that 
problem was completely solved, the new complications suddenly appeared on the horizon. As it usually happens, everything 
started with an alert from our monitoring system which woke me up in the middle of the night. 

## Introduction
Before I start a story I need to give you a little explanation about what is Adventory and how it was designed. 
Adventory is a microservice which is a part of our []PPC Advertising Platform](https://ads.allegro.pl) and it’s job is 
to take data from MongoDB and put them into Elasticsearch. We do this because our index changes so quickly and from 
performance point of view we decided that it will be better to continuously build a fresh Elasticsearch index rather 
than to edit an existing one. For this purpose we have two Elasticsearch clusters, one of them serves queries while the 
other one indexes, and after each indexing they switch their roles.

### Investigation
Our monitoring system told me that our indexing time increased and started hitting 20 minutes. It’s too much. Couple of 
months ago we started with 2 minutes and number of documents increased no more than 3—4 times since there. It should be 
much lower that 20 minutes. We didn’t change code related to indexing recently so it seems to be a bug related to 
increasing load or amount of data in our system. Unfortunately we didn’t realised that things are getting worse until 
we crossed the critical line. Our metrics are one week old only so we don’t know when exactly indexing times got worse, 
we don’t know if they increased suddenly or kept increasing slowly and consistently. Now, regardless of the answer, we 
need to fix this quickly because we can’t accept these times.

The problem here is that since we were streaming data all the way with 
[backpressure](https://github.com/ReactiveX/RxJava/wiki/Backpressure), we couldn’t see which part of process is slowing 
everything down. With this architecture it’s hard to see one metric with single value for each step because all steps 
execute in parallel. For this reason we had only metrics per single operation of each step and looking at them gave me 
no certainty which step of the whole process is a bottleneck. 

### First attempt
First I took a look at the times of each step of the indexing part. It turned out that a 
[forcemerge](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-forcemerge.html) lasts ~7 minutes 
in each indexing. I turned this step off and started looking at metrics. It turned out that this part has crucial impact 
on search latency and without this step search times starts to grow drastically. I gave this idea another try and 
switched ``max_num_segments`` parameter from 1 (which compacts all the data in the index) back to it’s default (checking 
if a merge needs to execute, and if so, executes it)  but it didn’t work neither. So this was a dead end.

### Second attempt
Undeterred by previous failure I tried an another idea. Let’s change the way we transform data. When we was written this 
service there was no support for streaming data in Spring Data MongoDB. We needed to sort data with a given limit and 
implement own our equivalent of stream. It was clearly not efficient. I rewrote this to use streams. By the way, we hit 
the hidden feature of mongoldb: default 
[idle timeout](https://docs.mongodb.com/manual/reference/method/cursor.addOption/#DBQuery.Option.noTimeout). After 
fixing this, there was no good news again. This change had no significant effect on performance.

### Third attempt
Due to lack of progress my colleague took over the helm and tried some different configuration options. Some were 
unsuitable:

* set 
[refresh_interval](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-update-settings.html#bulk) 
to ``—1`` — since we do forcemerge in the end we don’t need to refresh during indexing,
* turning off 
[_field_names](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-field-names-field.html) field — 
this is the Elasticsearch’s feature wich comes with a price and since we didn’t take advantage of it we could easily 
disable it,
* playing with [translog](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-translog.html) 
options.

Some helped a little:

* turn off [doc_values](https://www.elastic.co/guide/en/elasticsearch/reference/current/doc-values.html) for fields we 
don’t sort or group,
* turn off [_all](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-all-field.html) field,
* set only fields used in results in 
[_source](https://www.elastic.co/guide/en/elasticsearch/reference/6.2/mapping-source-field.html), although this one 
might be tricky because these fields will be harder to debug in the future,
* increasing number of threads on which we process all data, we needed to be careful with this, since too much threads 
may cause memory problems.

After this step times dropped from ~20 minutes to ~12 minutes. It’s significantly but not enough. 

### The final attempt
Reviewing last added features I found one which draw my attention. We added ability to filter results by filters. The 
structure in the index was following:

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

I turned these fields off for couple indexings and times dropped to ~4.5 minutes. The problem was that we had many 
different keys and because the way an index is created internally it may be a 
[performance issue](https://www.elastic.co/guide/en/elasticsearch/reference/current/general-recommendations.html#_normalize_document_structures). 
Unfortunately, since we only use filters for search we can refactor it a little bit to following structure:

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

### Conclusion

Why we didn’t realise that indexing times have increased on the way? Because they increased just slightly and not 
enought to hit our critical level on the monitoring system. And this level was hit couple days after deployment of 
filtering (as discribed before) on our’s weekly peek. Unfortunately there is no obvious solution for these kinds of 
problems. The best what we can do is to observe metrics after each deployment and maybe even put them permanently on the 
screen in the developer’s room. It may be worth considering setting up a tool to 
[anomaly detection](https://www.bigpanda.io/blog/a-practical-guide-to-anomaly-detection/) as well.    
