---
layout: post
title: "Allegro OpenSource: Elasticsearch reindex tool"
author: andrzej.wislowski
tags: [release, open source, elasticsearch]
---

At Allegro we use many open-source tools that support our work. Sometimes we are not able to find what we want and
this is a perfect moment to fill the gap and to [share with the community](https://github.com/allegro/). We are proud to announce an
 initial release of [Elasticsearch reindex tool](https://github.com/allegro/elasticsearch-reindex-tool) — a tool that
 provides an easy way to rebuild indexes in [elasticsearch](https://www.elastic.co/).

### Background and motivation

I work as a software engineer in a team which delivers search engines in the company. We were faced with a problem
of reindexing elasticsearch indices many times. We needed to shorten its time. After investigating opensource tools
for this job, we decided to build our own tool.

Our idea was to speed up index rebuilding. To decrease the time of reindexing, our tool reads data from the old index
 and writes it to the new one in parallel using multiple threads. To make it possible, each thread reads a piece of data
from the index based on a selected field and its values. Currently the tool supports double type and string type fields.
For double type field, queries are spread into segments with a given list of thresholds, for string type fields — with
given prefixes list. Time that can be saved can vary depending on the topology of the elasticsearch cluster and the
index. In our most frequently changed index we decreased reindexing time from 45 minutes to 17 minutes.

### Usage

The only external requirement is JDK 1.8.

Clone our repo from github and then create a package:

`./gradlew jar`

##### Reindexing without segmentation:

`./run.sh -s http://host:9300/index/type -t http://host1:9300/index1/type1  -sc cluster_name -tc
cluster_name1`

##### Reindexing with segmentation by double field:

`./run.sh -s http://host:9300/index/type -t http://host1:9300/index1/type1  -sc cluster_name -tc
cluster_name1`

`./run.sh -s http://host:9300/index/type -t http://host1:9300/index1/type1  -sc cluster_name -tc
 cluster_name1 -segmentationField rate.newCoolness -segmentationThresholds 0.0,0.5,0.59,0.6,0.7,0.9,1.0`

 Index querying will split data into segments based on rate.newCoolness field: (0.0-0.5] (0.5-0.59] (0.59-0.6] (0.6-0
 .7] (0.7-0.9],(0.9-1.0]

##### Reindexing with segmentation by prefix on string field:

`./run.sh -s http://host:9300/index/type -t http://host1:9300/index1/type1  -sc cluster_name -tc
 cluster_name1 -segmentationField userId -segmentationPrefixes 1,2,3,4,5,6,7`

 In this example, index querying will spilt data into segments based on the first character of the userId field: 1,
 2,3,4,5,6,7

Options:

    -s, source
       Source e.g. http://localhost:9300/source_index/type
    -sc, source-cluster
       Source cluster name
    -t, target
       Target e.g. http://localhost:9300/target_index/type
    -tc, target-cluster
       Target cluster name
    -segmentationField <FIELD>
       Segmentation field
    -segmentationPrefixes <PREFIXES>
       Segmentation prefixes (comma-separated)
    -segmentationThresholds <THRESHOLDS>
       Segmentation thresholds (only double type)

`segmentationField`, `segmentationThreshold` and `segmentationPrefixes` are optional parameters, allowing you to
split querying for field with double values or prefix for string field.

During the reindexing process, progress message is displayed after each scroll query.

### Current status, plans and source code

In the future, we plan to provide more segmentation strategies. Code is available via [GitHub repository](https://github.com/allegro/elasticsearch-reindex-tool). We have attached usage samples.

Feel free to use this library and especially to participate.
