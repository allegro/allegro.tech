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
Most of them claim to be the fastest on the market and fulfil any client’s needs. 
Although there are some 3rd party benchmarks like [Amplab](https://amplab.cs.berkeley.edu/benchmark/), 
it remains unclear whether 
its results are “portable”  and turn out to be the same in our ecosystem and with our queries. 
At Allegro we love working with newest technologies and deploying emerging ones 
on the production environment. In this case we had to decide which one to choose. 
Benchmarks and documentation available online were not sufficient for us to make a proper choice 
and we decided to run Fast Data Hackathon to evaluate them. 

## Tools' overview

Our evaluation included following technologies:

*   Hive on Tez,
*   Presto,
*   Impala,
*   Drill,
*   Spark SQL.

We also wanted to evaluate [Hive on Spark](https://cwiki.apache.org/confluence/display/Hive/Hive+on+Spark%3A+Getting+Started) 
but (at the time of writing) the issue [HIVE-7292](https://issues.apache.org/jira/browse/HIVE-7292)
is still unresolved and we we were unfortunately unable to set it up in our ecosystem. 
In the following subsections we present some basic information gathered about 
the tools we experimented with. These are based both on documentation/information 
gathered from the web and the experience we gained during the hackathon.

### General Information

As our Hadoop cluster is secured, first we checked if the tools support Kerberos. 
Additionally we examined if they can be deployed on Yarn as it allows 
to build a solution on the top of existing infrastructure and does not require additional resources. 
Due to data locality this also has an impact on performance but 
this will be evaluated in Benchmark section. 
Another important criteria is query fault tolerance - we run plenty of long running 
queries on our cluster and want to know what happens if something goes wrong during query execution. 
All the evaluated engines handle failures on their own. 
Some are able to recompute only a part that got broken, some need to recompute whole query from scratch.


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

Hundreds of our employees run SQL queries on our Hadoop Cluster. 
They have different roles in the organisation, different technical backgrounds and 
prefer different tools. Thus, it is important for us to know how queries can be submitted 
in each technology. In case of Presto and Impala, JDBC support has been only checked in documentation. 
This happened due to hackathon time box. One cannot do everything in 48 hours ;-)

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
create tables from query results, insert into existing tables or use custom user functions. 
We treated  Hive Query Language, which is an industry standard in Hadoop Ecosystem, 
as a baseline to which other technologies were compared. 

To battle-test each tool we prepared a set of 11 queries grouped in two sets: 
AmpLab like and Analytical. The first group contained four queries roughly equivalent 
to the ones used in [Amplab](https://amplab.cs.berkeley.edu/benchmark/) benchmark. 
They differed on the tables used (as we utilised our 
own data through the entire hackathon) and in the 4’th query we called json functions 
instead of a custom UDF, apart from that the query structures remained unchanged.
The second group (Analytical) contained a representative sample of queries typically 
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
Presto implements its own dialect which we found comfortable and we were able 
to solve all our problems within its syntax. In Impala we found some 
difficulties in parsing JSON files as it lacks get_json_object function or anything similar. 
Drill claims to be compatible with ANSI SQL but in our test cases it lacked several functionalities. 
Spark SQL syntax is really close to HiveQL but we found problems with “INSERT OVERWRITE TABLE” 
and row_number functionality.

The last row of the below table, Allegro use cases, determines how many of them were able to 
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
		<td>9/11</td>
		<td>9/11</td>
	</tr>
</table>

### Supported data types and formats

Avro and Parquet are currently one of best formats for storing big data volumes thus 
support for them is really important for us. Unfortunately at the moment we also have 
plenty of data stored in legacy formats which we are gradually migrating. In this situation
 we also need support for CSV and JSON files.

In Drill we had some difficulties with Parquet info retrieved from Hive Metastore. 
In case of Impala, it does not support Serdes so Json and CSV files can be only handled as text files. 
Impala supports Avro and Parquet but we could not write  data in such formats and 
it also lacks support for nested and composite data types (such as sets and maps) 
which are important at Allegro.

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

Another important criterion was activeness of the Open Source Community 
that maintains and develops the products as all evaluated projects are Open Source ones. 
To gain some insight into that matter we checked github stats such as numbers of commits, 
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

![Velocity chart with % focus factor](/img/articles/2015-05-04-fast-data-hackathon/MeanExecution.png "Velocity chart with % focus factor")

The diagram below presents execution times of each of the 7 trials.

![Velocity chart with % focus factor](/img/articles/2015-05-04-fast-data-hackathon/AllExecutions.png "Velocity chart with % focus factor")

Although we cannot reveal our Allegro queries, we measured how does query complexity influence execution time in different engines.

![Velocity chart with % focus factor](/img/articles/2015-05-04-fast-data-hackathon/Complexity.png "Velocity chart with % focus factor")

## Summary

When evaluating benchmark results Hive Mapreduce presented poorest performance which was not a surprise. The whole hackathon event has been organised to evaluate better solutions and Hive MapReduce was a baseline to find potential improvements. The more complex queries are run, the worse performance can be observed in that engine. The only exception to that rule are analytical queries 5. and 6. that performed worse in Presto. Impala turned to be the performance leader in most queries.
At the end we sum up our results about all the engines. Please note that these are our impressions based on our queries and functionality needs. 

*   **Hive on Spark** - The only technology that we were not able to set up. Important for further evaluations in the future as it runs on Hive and does not require significant changes to be able run the queries.
*   **Hive on Tez** - The dude that does a great job on our Hadoop cluster. It allowed to run all queries and performance results appeared to be stable and satisfactory.
*   **Spark SQL** - Spark SQL turned out to be useful although it lacks a “row_num” function. Surprisingly it still suffers some performance issues in some queries although performing better than average in general.
*   **Presto** - Convenient to use, most of queries run easily with small modifications and work stable. We expected better performance than achieved. This could have been influenced by data locality problem as Presto runs standalone and needs to access HDFS data remotely. 
*   **Impala** - Best benchmark performer which additionally runs on YARN. On the other side still lacks some basic functionalities and has some limitations. It does not support CTAS (Create Table as Select) nor composite or nested data types. It also behaves unstable when running out of memory.
*   **Drill** - If it is able to execute a query, it does it extremely fast. The benchmark results are comparable to Impala although Drill has been set up on machines external to HDFS. We do not consider drill as production ready as it has several gaps in the query language, especially the capabilities of user defined functions.

We already use Hive MapReduce, Hive Tez and SparkSQL on our cluster. 
None of the technologies, absent in our Hadoop ecosystem, 
combined performance and functionalities good enough to drive a change in our ecosystem. 
Some performed better but the performance change is not a significant overall boost. 
It is rather an improvement which requires deep architectural changes like data formats, 
separate infrastructure or even disabling security. 
After the hackathon we decided to focus on Hive on Tez and Spark SQL. 
We believe that with a limited amount of time, we can tune them to run stable 
and more efficiently than now. The evaluated projects grow rapidly and we are sure 
(and even hope) that our results get out of date soon. 
We will surely repeat this evaluation in the future.
