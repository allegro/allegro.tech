---
layout: post
title: "Allegro OpenSource: Camus Compressor"
author: mariusz.strzelecki
tags: [release, open source, hadoop, camus, bigdata]
---

At Allegro we use many open-source tools that support our work. 
Sometimes we are not able to find what we want and this is 
a perfect moment to fill the gap and to 
[share with the community](/open-source). We are proud to announce 
a [Camus Compressor](https://github.com/allegro/camus-compressor) — tool 
that merges files created by [Camus](https://github.com/linkedin/camus) 
on [HDFS](http://en.wikipedia.org/wiki/Apache_Hadoop#HDFS) and saves 
them in a compressed format.

###Background and motivation

Camus is massively used at Allegro for dumping more than 200 Kafka 
topics onto HDFS. The tool runs every 15 minutes and creates one 
file per Kafka partition which results in about 76800 small files per day. 
Most of the files do not exceed Hadoop block size. This is a clear 
Hadoop antipattern which leads to performance issues, for example 
extensive number of mappers in SQL queries executions.

Camus Compressor solves this issue by merging files within Hive 
partition and compressing them. It does not change Camus directories 
structure and supports well daily and hourly partitioning. The tool 
runs in YARN as well as in the local mode and is build on 
[Spark](https://github.com/apache/spark).

You can find tools that do similar processing, for example 
[Hadoop filecrusher](https://github.com/edwardcapriolo/filecrush) 
and [Camus sweeper](https://github.com/linkedin/camus/tree/master/camus-sweeper). 
Unfortunately both of them do not meet our criteria. 
Filecrusher is tool that compresses only one directory as single 
MapReduce job which does not fit scenario with a bunch of 
directories to process which Camus Compressor supports. Camus 
sweeper is almost ideal but changes partitioning schema 
(for examples compress hourly paritioned files to daily file) 
and mixes data locations which leads to problems on reading 
data by users’ tools. Both tools cannot replace input directories 
with compressed files which causes data schema (i.e. Hive Metastore) 
to be modified. Camus Compressor supports Camus directory structure, 
compress many directories in a single job and does not change 
data location.

We tested two compressions formats in our environment: LZO and Snappy. 
At first we compressed data using LZO which is splittable format (files 
bigger that HDFS block size can be read in parallel) and serves nice 
decompression speed. Unfortunately, we found that big data analyzing 
tools do not support LZO out of the box (it is shipped on GPL license) 
and we didn’t want to force users to change their scripts. Snappy 
compression is well supported in plain HDFS commands, Hive and Spark 
and this is format of our choice. It is not splittable, but we 
repartition data to sets of files with size about `2 * [HDFS bock size]` 
and compress every set into one `.snappy` file. As me measured output 
files in most cases do not exceed block size.

###Usage

Camus Compressor is written in Spark, requires version 1.2.0 or newer.
We provide script that automates passing parameters to `spark-submit` 
and application: `src/main/resources/compressor.sh`.

Assuming that Your Camus is configured to store data in `/data/camus` 
and partition them daily you can:

* Compress one day of topic `my_topic` by executing: 

        compressor.sh -m unit -p /data/camus/my_topic/daily/2015/06/15

* Compress whole topic `my_topic` (all days) by: 

        compressor.sh -m topic -p /data/camus/my_topic

* Compress all topics created by Camus: 

        compressor.sh -m all -p /data/camus

* Compress all topics with increased concurrency (number of executors) to 30: 

        compressor.sh -m all -p /data/camus -e 30

* Compress all topics on YARN queue `myqueue`: 

        compressor.sh -m all -p /data/camus -q myqueue

* Compress all topics with LZO: 

        compressor.sh -m all -p /data/camus -c lzo

###Current status, plans and source code

In the future, we plan to add support for creating Hive partitions 
to tables that provide access to compressed data. Code is available 
via [GitHub repository](https://github.com/allegro/camus-compressor). 
We have attached build instruction and usage samples.

Feel free to use this library and especially to participate.
