---
layout: post
title: Fast Data Hackathon
author: [pawel.leszczynski,pawel.zawistowski]
tags: [hadoop, sql, hive, spark sql, presto, drill, impala]
---

## Intro

In the era of NoSQL, SQL language is becoming extremely popular in Hadoop Ecosystem.
Several query engines are being developed to make SQL queries work better and faster
in an environment that totally differs from traditional relational databases.

There are plenty of emerging SQL engines that play well within Hadoop Ecosystem.
Most of them claims to be the fastest on the market and suitable to any client’s needs.
Although there are some 3rd party benchmarks like [Amplab](https://amplab.cs.berkeley.edu/benchmark/),
it remains unclear whether its results are “portable”  and turn out to be the same in our ecosystem and with our queries.
At Allegro we love working with newest technologies and do not hesitate to try a promising
ones on the production environments. In this case we had to decide which one SQL-like query engine
to choose for our Hadoop cluster.
Benchmarks and documentation available online were not sufficient for us.
In order to make a proper choice we decided to run Fast Data Hackathon to evaluate which technology
meets best our expectations.

## Tools' overview

Our evaluation included the following technologies:

*   Hive on Tez,
*   Presto,
*   Impala,
*   Drill,
*   Spark SQL.

We also wanted to evaluate [Hive on Spark](https://cwiki.apache.org/confluence/display/Hive/Hive+on+Spark%3A+Getting+Started)
but (at the time of writing) issue [HIVE-7292](https://issues.apache.org/jira/browse/HIVE-7292)
is still unresolved. We were unfortunately unable to set up it up correctly in our ecosystem.
In the following subsections we present some basic information about
the tools we experimented with. These are based on both: the documentation/information
available on the web and the experience we gained during the hackathon.

### General Information

As our Hadoop cluster is secured, first we checked if the tools support Kerberos.
Then we examined if they can be deployed on existing Yarn installations. This allows
to build a solution on top of existing infrastructure without additional resources.
Due to data locality this also has an impact on performance, but
this will be evaluated in Benchmark section.
Another important criteria is query fault tolerance - we run plenty of long running
queries on our existing cluster and want to know what happens if something goes wrong during query execution.
All the evaluated engines handle failures on their own.
Some are able to recompute only parts that got broken, some need to recompute the whole query from scratch.


<table>
	<tr>
		<td width="20%"></td>
		<td width="16%"><a href="http://tez.apache.org/">Hive on Tez</a></td>
		<td width="16%"><a href="https://prestodb.io/">Presto</a></td>
		<td width="16%"><a href="http://www.cloudera.com/content/cloudera/en/products-and-services/cdh/impala.html">Impala</a></td>
		<td width="16%"><a href="http://drill.apache.org/">Drill</a></td>
		<td width="16%"><a href="https://spark.apache.org/sql/">Spark SQL</a></td>
	</tr>
	<tr>
		<td>Evaluated version</td>
		<td>0.5.3</td>
		<td>0.98</td>
		<td>2.1.1-cdh5</td>
		<td>0.9.0- SNAPSHOT</td>
		<td>1.4.0-SNAPSHOT</td>
	</tr>
	<tr>
		<td>Kerberos Support</td>
		<td>Yes</td>
		<td>No</td>
		<td>Yes</td>
		<td>No</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>Yarn deployment</td>
		<td>Yes</td>
		<td>No</td>
		<td>Yes</td>
		<td>No</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>Query fault tolerance</td>
		<td>Yes</td>
		<td>No</td>
		<td>No</td>
		<td>No</td>
		<td>Yes</td>
	</tr>
</table>

### Interfaces

Hundreds of our employees run SQL queries on our Hadoop cluster.
So our new technology users are really divided.
They have different roles in the organisation, different technical backgrounds and
prefer different tools. Thus, it is important for us to know how queries can be submitted
in each technology. In case of Presto and Impala, JDBC support has been only checked in the documentation.
This happened due to hackathon time box. Not everything can be verified empirically in 48 hours ;-)

<table>
	<tr>
		<td width="20%"></td>
		<td width="16%">Hive on Tez</td>
		<td width="16%">Presto</td>
		<td width="16%">Impala</td>
		<td width="16%">Drill</td>
		<td width="16%">Spark SQL</td>
	</tr>
	<tr>
		<td>User Interface</td>
		<td>Hue Tez UI</td>
		<td><a href="https://github.com/tagomoris/shib">Shib</a></td>
		<td>Hue, imapla-shell</td>
		<td>admin panel</td>
		<td>Spark UI</td>
	</tr>
	<tr>
		<td>JDBC Connector</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
	</tr>
</table>

### Query Language

Capabilities of the query language is an important aspect determining usefulness of the given tool.
We wanted to check whether it was possible not only to query the data, but also utilise views,
create tables from query results, insert data into existing tables or use custom user functions.
We treated  Hive Query Language, which is an industry standard in Hadoop Ecosystem,
as a baseline to which other technologies were compared.

To battle-test each tool we prepared a set of 11 queries. In this set there were two types of queries:
AmpLab-like queries and Allegro-analytical queries. The first group contained four queries roughly equivalent
to the ones used in [Amplab](https://amplab.cs.berkeley.edu/benchmark/) benchmark.
They differed on the tables used (as we utilised our
own data through the entire hackathon) and in the 4’th query we called json functions
instead of a custom UDF. Apart from that the query structures remained unchanged.
The second group (Allegro-analytical) contained a representative sample of queries typically
run by our DWH team on commercial data warehouses. These queries were significantly
more complex than the AmpLab ones. A brief description of the queries is given below:

*   AmpLab01 - a simple two column select with filtering,
*   AmpLab02 - data aggregation with a group by clause,
*   AmpLab03 - joining two large tables with an order by,
*   AmpLab04 - a two stage query with a transient table and json parsing,
*   Analytic01 - searching clickstream by a given category,
*   Analytic02 - custom filtering applied to transactions joined with user events,
*   Analytic03 - a summary of clickstream data,
*   Analytic04 - a summary of clickstream joined with transactions,
*   Analytic05 - attribution workflow - part 1,
*   Analytic06 - attribution workflow - part 2,
*   Analytic07 - analysing search queries prior to transactions.

Implementing our test queries in each technology turned out to be a really valuable
experience as it allowed us to get a feel for working with these tools.
Presto implements its own dialect, which we found comfortable and we were able
to solve all our problems within its syntax. In Impala we found some
difficulties in parsing JSON files as it lacks ``get_json_object`` function or anything similar.
Drill claims to be compatible with ANSI SQL, but in our test cases it lacked several functionalities.
Spark SQL syntax is really close to HiveQL. Although we found problems with ``INSERT OVERWRITE TABLE``
and ``row_number`` functionality.

The last row of the below table determines how many of Allegro-analytics use cases  we were able to
execute after modifications to fit engine syntax.

<table>
	<tr>
		<td width="20%"></td>
		<td width="16%">Hive on Tez</td>
		<td width="16%">Presto</td>
		<td width="16%">Impala</td>
		<td width="16%">Drill</td>
		<td width="16%">Spark SQL</td>
	</tr>
	<tr>
		<td>Query Language</td>
		<td>HiveQL</td>
		<td>~SQL</td>
		<td>~HiveQL</td>
		<td>ANSI SQL?</td>
		<td>~HiveQL</td>
	</tr>
	<tr>
		<td>Can modify metastore?</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>No</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>Can utilise views?</td>
		<td>Yes</td>
		<td>Views available only in Presto</td>
		<td>Yes</td>
		<td>Views available only in Drill</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>UDF Support</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>Allegro use cases</td>
		<td>11/11</td>
		<td>11/11</td>
		<td>10/11</td>
		<td>8/11</td>
		<td>9/11</td>
	</tr>
</table>

### Supported data types and formats

[Avro](http://en.wikipedia.org/wiki/Apache_Avro) and [Parquet](https://parquet.incubator.apache.org/) are currently one of the best formats for storing big data volumes thus
support for them in new tools is really important for us. Unfortunately at the moment we also have
plenty of data stored in legacy formats from which we are gradually migrating. In this situation
 we also require support for CSV and JSON files.

In Drill we had some difficulties with Parquet info retrieved from Hive Metastore.
In case of Impala, it does not support all [SerDes](https://cwiki.apache.org/confluence/display/Hive/SerDe). Json and CSV files can be only handled as text files.
Impala supports Avro and Parquet but we could not write  data in such formats.
It also lacks support for nested and composite data types (such as sets and maps)
which are important for Allegro users to query existing datasets.

<table>
	<tr>
		<td width="20%"></td>
		<td width="16%">Hive on Tez</td>
		<td width="16%">Presto</td>
		<td width="16%">Impala</td>
		<td width="16%">Drill</td>
		<td width="16%">Spark SQL</td>
	</tr>
	<tr>
		<td>CSV</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Hmm...</td>
		<td>Yes</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>JSON</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Hmm...</td>
		<td>Yes</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>AVRO</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Hmm...</td>
		<td>Yes</td>
		<td>Yes</td>
	</tr>
	<tr>
		<td>Parquet</td>
		<td>Yes</td>
		<td>Yes</td>
		<td>Hmm...</td>
		<td>Hmm...</td>
		<td>Yes</td>
	</tr>
</table>

### Open Source Community

Another important aspect was activeness of the Open Source Community
that maintains and develops the products as all evaluated projects are Open Source ones.
To gain some insight into that matter we checked [GitHub](https://github.com) stats, such as: numbers of commits,
branches, releases and contributors

<table>
	<tr>
		<td width="20%"></td>
		<td width="16%">Hive on Tez</td>
		<td width="16%">Presto</td>
		<td width="16%">Impala</td>
		<td width="16%">Drill</td>
		<td width="16%">Spark SQL</td>
	</tr>
	<tr>
		<td>commits</td>
		<td>1458</td>
		<td>4673</td>
		<td>3427</td>
		<td>1480</td>
		<td>10264</td>
	</tr>
	<tr>
		<td>branches</td>
		<td>18</td>
		<td>2</td>
		<td>27</td>
		<td>11</td>
		<td>13</td>
	</tr>
	<tr>
		<td>releases</td>
		<td>22</td>
		<td>104</td>
		<td>33</td>
		<td>5</td>
		<td>33</td>
	</tr>
	<tr>
		<td>contributors</td>
		<td>12</td>
		<td>59</td>
		<td>32</td>
		<td>42</td>
		<td>477</td>
	</tr>
</table>

## Benchmark

In order to evaluate performance we used a benchmark consisting of 11 queries mentioned in section
“Query Language”. We stored data in a columnar format (Parquet),
as we consider non-columnar formats as legacy and are not interested in evaluating their performance.
We have run the benchmark 7 times on a dataset containing over 200 GB of data
uploaded to an isolated test environment. This has been done to assure that benchmark’s jobs
do not interfere with any other job on the cluster.

The diagram below presents mean execution time of each query:

![Mean execution times plot](/img/articles/2015-05-04-fast-data-hackathon/MeanExecution.png "Mean Execution times plot")

Hive on Map-Reduce, unsurprisingly, is the slowest competitor while the fastest mean times were usually reported for Impala or Drill. When analyzing all the gathered results, presented on the diagram below, it can be noticed that the times seem to be consistent across different runs for different technologies. One possible exception is the first query, which was actually the fastest to execute - the observed execution time variance can be explained by possible minor system load fluctuations occurring throughout the Hadoop cluster.

![All execution times plot](/img/articles/2015-05-04-fast-data-hackathon/AllExecutions.png "All execution times plot")

Although we cannot reveal our Allegro queries, we measured how does query complexity influence execution time in different engines, which is depicted on the diagram below.

![Execution time vs query complexity](/img/articles/2015-05-04-fast-data-hackathon/Complexity.png "Execution time vs query complexity")

## Summary

When evaluating benchmark results Hive MapReduce presented the poorest performance which was not a surprise. The whole hackathon event had been organised to evaluate better solutions and Hive MapReduce was a baseline to find potential improvements. The more complex queries were run, the worse performance could have been observed in that engine. The only exception to that rule were Allegro-analytical queries number 5. and 6. Those performed worse using Presto. Impala turned to be the
performance leader in the most queries.
At the end we sum up our  results obtained for all the engines. Please note that these are our impressions based on our queries and functionality needs.

*   **Hive on Spark** - The only technology which we were not able to set up. Important for further evaluations in the future as it runs on Hive and does not require significant changes in the query structure.
*   **Hive on Tez** - The dude that does a great job on our Hadoop cluster. It allowed to run all queries and performance results appeared to be stable and satisfactory.
*   **Spark SQL** - Spark SQL turned out to be useful, despite it lacks a ``row_num`` function. Surprisingly it still suffers some performance issues in some queries although performing better than average in general.
*   **Presto** - Convenient to use, most of the queries run easily with small modifications and work stable. We expected better performance than achieved. This could have been influenced by data locality problems as Presto was run standalone and had to access HDFS data remotely.
*   **Impala** - The best benchmark performer which additionally runs on YARN. On the other hand it still lacks some basic functionalities and has some limitations. It does not support CTAS (Create Table as Select) nor composite or nested data types. It also behaves unstable when running out of memory and the obtained execution times seem to have the highest variance among the competitors.
*   **Drill** - If it is able to execute a query, it does so extremely fast. The benchmark results are comparable to Impala despite the fact that Drill has been set up on machines external to HDFS. Unfortunately we do not consider Drill as production ready yet as it has several gaps in the query language, especially the capabilities and stability of user defined functions  which are already used in lots of our Hive queries.

We already use Hive MapReduce, Hive Tez and SparkSQL on our cluster.
None of the evaluated technologies, absent in our Hadoop ecosystem, combined performance and functionalities good enough to drive a change in our ecosystem.
Some performed better then what we already have but the performance change is not a significant overall boost.
What could be gained is an improvement which requires deep architectural changes like data formats,
separate infrastructure or even disabling security.
After the hackathon we decided to focus on Hive on Tez and Spark SQL. We believe that with a limited amount of time, we can tune them to run really stable and more efficient than now.

The evaluated projects grow rapidly and we are sure (and even hope) that our results get out of date soon.
We will surely repeat this evaluation in the future.
