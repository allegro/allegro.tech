---
layout: post
title: Hadoop World 2014 New York from a developer’s point of view
author: jaroslaw.grabowski
tags: [hadoop world, big data, hadoop, spark]
---
This year’s edition of [Strata Hadoop World](http://strataconf.com/stratany2014) held in New York was humongous, 16
workshops, over 20 keynotes, over 130 talks and most importantly over 5000 attendees! This massive crowd wouldn’t fit in
Hilton hotel where the previous edition was held. That is why organizers had to move the conference to Javits Conference
Center - an enormous building in which Big Data believers occupied just one sector. The fact that the European edition of
Hadoop Summit experienced exactly the same transition (the third edition is going to be held in a bigger location in
Brussels) gives pleasant assurance that Big Data technologies are still a hot topic and that Big Data Community grows
at a stable pace.

## Keynotes

As usual the majority of keynotes were given by sponsor representants and were not particularly fascinating (from a
developer’s point of view). Nevertheless, there were a few talks that deserve to be mentioned, among them:

* ["The Hidden Brain"](http://youtu.be/7mpe6luA5Os) in which Shankar Vedantam explained how biased human brain can be.
* John Rauser keynote: ["Statistics Without the Agonizing Pain"](http://youtu.be/5Dnw46eC-0o) about a way in which
computers and in particular Big Data processing ease dealing with statistical problems.
* ["The Power of Emotions..."](http://youtu.be/X97XQ-bIBig) by Rana El Kaliouby on emotion recognition and
possibilites to embed this technology into tools that we all use on daily basis.


## Talks

Hadoop World offered over 130 talks divided into 9 essential tracks and one additional sponsored track. The full
schedule is available on
[offical Hadoop World site](http://strataconf.com/stratany2014/public/schedule/grid/public/2014-10-16). Videos will be
available for purchase within few months.

As a developer I naturally gravitated towards three technical tracks
["Hadoop & Beyond"](http://strataconf.com/stratany2014/public/schedule/topic/1172),
["Hadoop in Action"](http://strataconf.com/stratany2014/public/schedule/topic/1174) and
["Hadoop Platform"](http://strataconf.com/stratany2014/public/schedule/topic/1173), though there were few other trends
visible:

* Data discovery tools provide ways for non-technical folks to familiarize themselves with datasets stored in HDFS.
Forget about ‘hadoop fs -ls’ and ‘hadoop fs -cat’ commands and schema catalogs! Data discovery tools infer data types
for you, allow you to visualize data distribution, help you sanitize datasets and suggest possible datasets
correlations. Operations that developers do manually to understand the nature of dataset can be performed in more automated,
simplified manner by almost anyone.
* There is a significant trend to emphasise on custom, innovative ways to visualize data. A
really good example of such data visualization virtuosity is work of a team from The New York Times that does amazing
stuff with D3.js, here is
[one example](http://www.nytimes.com/interactive/2014/06/05/upshot/how-the-recession-reshaped-the-economy-in-255-charts.html).
* As one can predict, an interest in data science increases by leaps and bounds. Tracks about machine learning and
statistics (["Data Science"](http://strataconf.com/stratany2014/public/schedule/topic/1170),
["Machine Data"](http://strataconf.com/stratany2014/public/schedule/topic/1176)) in its multitude of diversity were among
the most popular to be followed.
* Apache Pig fades away as Hadoop World is yet another conference that offers no talks about that framework. On the
other hand, there are still some companies that base data processing upon Pig (according to Mithun Radhakrishnan
about 50% of jobs at Yahoo are written in Pig). It is interesting to see what the future will bring to that project.

What is more, Ben Werther in his strictly commercial keynote
["Spark Needs a Business Analyst Workflow"](http://youtu.be/V7Ad37kwsxE) summed up a trend that is clearly visible in
community and in Hadoop oriented tracks:
> Spark is the next generation layer for driving Hadoop, it is exciting to see that move from fixation on SQL-only to
much broader, much more diverse way of driving of Hadoop insights.

Spark indeed gets a lot of attention. In fact talks about Apache Spark were so popular among attendees of HW2014 that
Paco Nathan (host of "Hadoop & Beyond" track) announced that in the next Strata conference there is going to be a track
dedicated to Spark only.
If you haven’t tried Spark yet be sure to check it out as for sure it is going to be one of most favored processing
platforms in the next few years.

Another interesting talk was given by Philip Kromer, in his
["Application of the Lambda Architecture"](http://strataconf.com/stratany2014/public/schedule/detail/36421). He stated
that lambda architecture is not just about three layered data processing. It is about establishing acceptable (for end
users) level of accuracy of data insights and serving those insights with respect to that level. Lambda also provide ways
to dynamically adjust established accuracy, that flexibility comes in handy when business requirements change.

During the conference no new projects were announced. Nevertheless there ware few talks about projects that are in the early
stages of evolution but are definitely worth evaluating:

* [Druid](http://druid.io/) - a platform for building applications that provide analitical, real-time, interactive
insights
* [Tachyon](http://tachyon-project.org/) - an additional abstraction over HDFS that caches datasets in memory
* [Samza](http://samza.incubator.apache.org/contribute/code.html) - a real-time event processing system coupled to Apache Kafka
* [Kylin](http://www.kylin.io/) - designed for data analysis ANSI-SQL interface

## Summary

Data visualization and data discovery become subjects of interest for growing number of initiatives. This is especially
apparent in Hadoop World New York that is considered to be less technical and more commercial (half of attendees are
business folks) than the West Coast edition and Hadoop Summit editions.

Apache Spark hype seems to be in full swing. Cloudera intensively promotes Spark in opposition to Hive based on Tez that
 is identified with Hortonworks. Future will show whether both of these projects will find a place for themselves in Big
 Data processing universe.

It is worth noticing that sponsored talks where explicitly marked as such in the grid schedule. This makes talk selection
easier for those who are not interested in commercial products talks. Hadoop Summit organizers could follow this
improvement as well.


