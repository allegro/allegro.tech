---
layout: post
title: Spark and Kafka integration patterns
author: marcin.kuthan
tags: [spark, spark streaming, apache kafka, scala]
---

Apache Spark is popular, open-source cluster computing framework written in Scala.
Spark was originally developed in 2009 in UC Berkeley’s AMPLab, to address limitations of 
[MapReduce](https://pl.wikipedia.org/wiki/MapReduce) based tools.
Today we would like to publish our experiences with Spark, and how to solve one of the most irritating trait of 
the framework. 

### Apache Spark - good parts

The biggest advantage of Spark is it's API: elegant, expressive, concise, and aligned to functional programming style.
Below you can find academic word count example written in Scala using Spark:

```scala
// create Spark context
val conf = new SparkConf().setAppName("wordCount")
val sc = new SparkContext(conf)

// load data
val input = sc.textFile(inputFile)

// split it up into words
val words = input.flatMap(line => line.split(" "))

// transform into pairs and count 
val counts = words.map(word => (word, 1)).reduceByKey{case (x, y) => x + y}

// save the word count back out to file, causing evaluation
counts.saveAsTextFile(outputFile)
```

Quite easy, isn't it? 
What is even more important, the code can be deployed on the cluster and will calculate word frequency histogram 
of whole Wikipedia documents.
It depends only on size of your cluster, certainly.

### Apache Spark - bad parts

But there ain't no such thing as a free lunch. 
Spark API is an abstraction over distributed computation, and sometimes this abstraction is leaking. 
Sooner or later you will observe strange ``java.io.NotSerializableException`` exception in your application stack trace.

Spark application code can be evaluated on the _spark driver_ or on _spark executor_. 
Spark splits the jobs into several _spark tasks_ and delegates execution to the cluster remote nodes.

![spark driver and executors](img/articles/2015-07-16-spark-kafka-integration/spark-driver-executors.png)

When you gain some experience with Spark, it should be easy to look at the code, and tell where the code will be 
eventually executed.
Look at the code snippet below. 

```scala
dstream.foreachRDD { rdd =>
  val where1 = "on driver"
    rdd.foreach { record => 
      val where2 = "on executor"
    }
  }
}
```

The outer loop is executed locally on _spark driver_. 
But the inner loop will be evaluated in distributed manner. 
RDD will be partitioned and executed by many _spark executors_ on the cluster nodes.

Spark uses Java (or Kryo) serialization to send code from the driver to the executors. 
At first you will add ``scala.Serializable`` or ``java.io.Serializable`` marker interface to all of your application 
classes to avoid weird exceptions.
But this blind approach has at least two disadvantages:

* It might be performance penalty when complex object graph will be serialized and sent to dozen of remote cluster 
nodes. Might be mitigated by using broadcast variables, though.

* Not everything is serializable, e.g: TCP socket cannot be serialized and sent between nodes.

### Naive attempt to integrate Spark Streaming and Kafka Producer

After this introduction we are ready to discuss problem we had to solve in our application. 
The application is a long running Spark Streaming job deployed on YARN cluster.
The job receives unstructured data from Apache Kafka, performs validation, converts into Apache Avro binary format, 
and publishes back to another Apache Kafka topic.

Our very first attempt was very similar to the code presented below. 
Can you see the problem? 

```scala
dstream.foreachRDD { rdd =>
  val producer = createKafkaProducer()
  rdd.foreach { message =>
    producer.send(message)
  }
  producer.close()
}
```

The producer is created (and disposed) on the _spark driver_ but the message is send on the _spark executor_.
The producer keeps open sockets to the Kafka brokers so it can not be serialized and sent to the _spark executors_.

The producer initialization and disposal code can be moved to the inner loop. 
But it does not scale at all.
Establishing connection to the cluster takes time. 
It is much more time consuming operation than open plain socket connection, _kafka producer_ needs to discover leaders 
for all partitions.
Kafka Producer itself is heavy object, so you can also expect high CPU utilization by JMV garbage collector.

```scala
dstream.foreachRDD { rdd =>
  rdd.foreach { message =>
    val producer = createKafkaProducer()
    producer.send(message)
    producer.close()
  }
}
```

The previous example could be improved by using ```foreachPartition``` loop. 
The partition of records is always processed by single _spark task_ on single _spark executor_ using single JVM.
You can safely share _kafka producer_ instance.
But in our scale (20k messages / second, 64 partitions, 2 seconds batch) it did not scale as well.
_kafka producer_ was created and closed 64 times on every 2 seconds and sent only 150 messages on average.

```scala
dstream.foreachRDD { rdd =>
  rdd.foreachPartition { partitionOfRecords =>
    val producer = createKafkaProducer()
    partitionOfRecords.foreach { message =>
      connection.send(record))
    }
    producer.close()
  }
}
```

If you are interested in more details about above optimizations, look at design patterns published in the official 
Spark Streaming [documentation](http://spark.apache.org/docs/latest/streaming-programming-guide.html).
The patterns how to correctly and effectively reuse heavy resources across batches.
Perhaps the patterns were prepared for regular database connection pools, where borrowed connection cannot be shared 
between clients.
But _kafka producer_ is thread safe, so can be easily shared by multiple _spark tasks_ within same JVM. 
In addition _kafka producer_ is asynchronous and buffers data heavily before sending. 
How to return _kafka producer_ to the pool, if it is still processing data?

### Problem solved 

Finally we ended up with solution based on Scala lazy evaluation (you can do in Java as well). 
The processing code is not cluttered with infrastructure code for _kafka producer_ management.
The code is very similar to our first naive attempt.

```scala
val kafkaSink = KafkaSink(conf)

dstream.foreachRDD { rdd =>
  rdd.foreach { message =>
    kafkaSink.send(message)
  }
}
```

``KafkaSink`` class is smart wrapper for _kafka producer_. 
The class is serializable but _kafka producer_ is initialized just before first use on _spark executor_.
Constructor of ``KafkaSink`` class takes the function which returns _kafka producer_. 
Once the _kafka producer_ is created, it is assigned to the variable to avoid initialization on every ``send`` call.

```scala
class KafkaSink(createProducer: () => KafkaProducer[String, String]) extends Serializable {
  @transient
  lazy val producer = createProducer()

  def send(topic: String, value: String): Unit = producer.send(new ProducerRecord(topic, value))
}

object KafkaSink {
  def apply(config: Map[String, Object]): KafkaSink = {
    val f = () => {
      new KafkaProducer[String, String](config)
    }
    new KafkaSink(f)
  }
}
```

Before production deployment, ``KafkaSink`` needs to be improved a little. 
We have to close the _kafka producer_ before _spark executor_ JVM is closed.
If not, all messages buffered internally by _kafka producer_ will be lost.

```scala
object KafkaSink {
  def apply(config: Map[String, Object]): KafkaSink = {
    val f = () => {
      val producer = new KafkaProducer[String, String](config)
      
      sys.addShutdownHook {
        producer.close()
      }
      
      producer
    }
    new KafkaSink(f)
  }
}
```

The function ``f`` is evaluated on _spark executor_ so we can register shutdown hook there to close 
the _kafka producer_.
The shutdown hook will be executed before JVM is closed, and _kafka producer_ will flush all buffered messages.

### Summary

We hope that this post will be helpful for others looking for better way to integrate Spark Streaming and Apache Kafka.
