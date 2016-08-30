---
layout: post
title: CQK TOP 10 – Thread pools
author: piotr.betkier
tags: [tech, cqk-top-10]
---

This article is a part of [CQK Top 10]() series. //TODO add link
Modern applications process their work in multiple thread pools. Knowing where they are and
how to set them up correctly is crucial for making sure applications operate successfully. We observe that 
stability and peformance issues are often a result of mistakes in this area.

## Do you know which thread pools handle your requests?

A typical server-side application processes work in multiple thread pools. Depending on your technology choices, things may start
in an IO pool (for reading from and writing to sockets) and worker pool (for request handling) managed by your web server. You may also
introduce additional thread pools either directly by yourself or through popular tools like [Hystrix](https://github.com/Netflix/Hystrix) or 
[RxJava](https://github.com/ReactiveX/RxJava).

It’s important to be aware of all the thread pools on the request handling path, as well as which parts of the code are executed on which one of them.
Misconfigured thread pools can easily become performance bottlenecks or affect application stability.

## Do you bound our task queues?

Thread pools are most commonly implemented with a task queue in front of them, so when all the threads are busy at the time the task is submitted, it
can wait for execution. If tasks arrive faster than they can be executed, this queue will keep increasing in size.

Many commonly used thread pools, e.g. `Executors.newFixedThreadPool()` or Spring’s `ThreadPoolTaskExecutor`, use a `LinkedBlockingQueue` as their
task queue implementation. Such queue is not limited in size. If tasks are consumed slowly, it can grow in size until it fills all the available 
memory and causes the application instance to crash with an `OutOfMemoryError`. This in turn would increase the load on the remaining 
application instances and make them crash even faster.

Queues should be limited in size. If a certain number of tasks already wait to be executed, any new arriving tasks should be quickly rejected, e.g. with
an error response served to the caller. This way an overloaded service can correctly process some part of the requests, as opposed to crashing and not
processing any at all. Watch out for retries performed by the caller though! Clients shouldn’t retry on errors returned this way, as it would multiply the load to the already strugling service.

You can bound your queues e.g. by using an `ArrayBlockingQueue` instead of the default `LinkedBlockingQueue`. Here’s an example using raw JDK API:

```
ThreadPoolExecutor executorService = new ThreadPoolExecutor(..., ..., ..., ..., new ArrayBlockingQueue(100));
```

Attempt to submit a task on a full queue will cause a `RejectedExecutionException` to be thrown by default. You can override this behaviour by
providing a custom `RejectedExecutionHandler` implementation when constructing a `ThreadPoolExecutor`.

## Do you isolate your critical thread pools?

Applications commonly provide multiple functionalities, some of which are more critical than others. Problems with one of the functionalities
shouldn’t cause unavailability of others. It may happen though, if functionalities execute on shared thread pools.

Issues with one of the functionalities, e.g. increased processing time due to an increased latency of one of the dependencies, may cause the pools
on which this functionality is operating to saturate. If some healthy functionalities need to execute on the same pools, then they are denied 
access to resources and become unavailable as well. This way an issue with some less important functionality may cause an outage of a crucial one.

The solution is to keep resource pools separate, especially for the crucial functionalities. In practice, this means each asychronous processing 
should be done in its dedicated thread pool. If you use a technology which abstracts asynchronous processing for you, make sure you are aware 
where the thread pools are exactly and if they are shared. 

Take Spring’s `@Async` annotation for example, which delegates the execution of a method to a task executor. If you annotate a method 
without specifying the task executor on which it should be executed, then the default one will be used – the same for all the methods annotated this way.
Specifying a dedicated task executor for each method would mitigate this problem.

## Do you name your threads?

Default thread names in pools from the JDK make it hard to tell which pool do they belong to. When you are in the middle of investigating an outage, 
e.g. viewing a thread dump to discover the state of an application, that’s an information you much need.

Guava makes naming threads very easy by providing a `ThreadFactoryBuilder`:

```
ThreadFactory namedThreadsFactory = new ThreadFactoryBuilder().setNameFormat("my-pool-%d").build;
Executors.newFixedThreadPool(..., namedThreadsFactory);
```

With threads configured this way it’s going to be easy to discover e.g. that all the threads from my-pool are blocked by some IO operation.

## Do your measure your thread pools?

It’s hard to reason about performance bottlenecks or locating the causes of stability issues without proper metrics. You should measure at least
the number of active threads in the pool and the task queue size. Here’s how you could do it:

```
MetricRegistry registry = ...;  // e.g. when using dropwizard-metrics
BlockingQueue<Runnable> q = new ArrayBlockingQueue<>(...);
ThreadPoolExecutor executorService = ...;

// we can measure queue utilization for bounded queues
registry.register("my-thread-pool.queue-utilization",
        (Gauge<Double>) () -> {q.size() / (double) (q.size() + q.remainingCapacity())}
);

// we can measure queue size only for unbounded queues 
registry.register("my-thread-pool.queue-size", (Gauge<Integer>) q::size});

// active threads count
registry.register("my-thread-pool.activeThreads",
        (Gauge) () -> executorService.getActiveCount()
);
```

## Are your threadpools’ parameters tuned according to your needs?

There are many parameters configurable for thread pools, most importantly the thread pool and task queue sizes. Finding the right
values for your requirements needs proper measurements during load tests and on production.

Setting thread pool size too low will cause your tasks to queue up even though enough CPU power may be available. Setting it too high 
results in wasted resources and may actually slow processing down due to thread context switches. For queue size, setting it too low 
will result in tasks being rejected when even a small burst of requests arrives. Setting it too high on the other hand will require 
large amounts of memory when tasks arrive too quickly for the thread pool
to keep up, as well as increasing the time it takes for a task to get processed in such scenario, perhaps way above your SLA.

## Conclusion

Setting up thread pools correctly is not a trivial task and understanding the setup is essential for investigating production problems. 
Hopefully, with these tips, you’ll be able to successfully run and manage your application on production.

