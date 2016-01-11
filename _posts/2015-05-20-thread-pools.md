---
redirect_from:
   - /thread-pools.html
layout: post
title: An introduction to thread pools in Java
author: piotr.glazar
tags: [tech, java, concurrency, pools, threads, executors]
---

According to [Moore’s law](http://en.wikipedia.org/wiki/Moore%27s_law) the number of transistors
in an integrated circuit doubles approximately every two years. However, the exponential
processor transistor growth does not always translate into exponentially greater practical CPU
performance. Processor manufacturers for years delivered processors with higher clock rates and
instruction parallelism. As a result, single-threaded code executed faster on newer generations of
processors. Of course, it is impossible to speed up clock rates infinitely and processors like
[AMD FX-9590](http://cpuboss.com/cpu/AMD-FX-9590) with turbo clock speed at 5 GHz are rather unique.
Today, processor manufacturers favour [multi-core processors](http://en.wikipedia.org/wiki/Multi-core_processor).
It is common to have a quad-core CPU in smartphones, not to mention laptops or even desktop PCs.
Consequently, software has to be written in a multi-threaded manner to take full advantage of the
hardware. [Thread pools](http://en.wikipedia.org/wiki/Thread_pool_pattern) can help programmers
harness multi-core CPUs.

### Thread pools

Good software design techniques suggest that [threads](http://docs.oracle.com/javase/8/docs/api/java/lang/Thread.html)
should not be created and
destroyed manually. Thread creation and destruction are expensive processes which consume both CPU
and memory, as they require JVM and OS activity. [Default Java thread stack size
is 1 MB](http://www.oracle.com/technetwork/java/hotspotfaq-138619.html) for 64-bit JVMs.
That is why creating a new thread for each request when requests are frequent and
lightweight is a waste of resources. Thread pools can handle thread lifecycle automatically according to the
strategy selected on thread pool creation. An important feature of a thread pool is that
it allows applications to degrade gracefully. A server application can queue incoming
requests and handle them when it has enough resources, like memory or CPU, to do so.
Otherwise, without thread pools, the server application may crash.
There are many reasons why there are no more resources. For example, multiple
connections to the server caused by a [denial-of-service attack](http://en.wikipedia.org/wiki/Denial-of-service_attack)
may result in many threads running in parallel which in turn
leads to [thread starvation](http://en.wikipedia.org/wiki/Resource_starvation).
Moreover, programmers who run threads manually must remember to handle exceptional
situations when a thread dies due to an exception.

Even though you may not explicitly use thread pools in your application, they
are heavily used in web servers like [Tomcat](http://tomcat.apache.org/)
or [Undertow](http://undertow.io/). It is good to know how thread pools work
and how you can tune them in order to optimize performance.

Thread pools can be easily created using [`Executors`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html)
factory. All implementations of the [`ExecutorService`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html)
interface provided in JDK:

* [`ForkJoinPool`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html)
* [`ThreadPoolExecutor`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html)
* [`ScheduledThreadPoolExecutor`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ScheduledThreadPoolExecutor.html)

are Java implementations of the thread pool abstraction.
The following code snippet presents the lifecycle of an ExecutorService:

```java
public List<Future<T>> executeTasks(Collection<Callable<T>> tasks) {
    // create an ExecutorService
    final ExecutorService executorService = Executors.newSingleThreadExecutor();

    // execute all tasks
    final List<Future<T>> executedTasks = executorService.invokeAll(tasks);

    // shutdown the ExecutorService after all tasks have completed
    executorService.shutdown();

    return executedTasks;
}
```

We begin with creating the simplest ExecutorService — a single-threaded executor. It uses one
thread to handle all incoming tasks. Of course, you can customize your ExecutorService in a wide
variety of ways or use one of the factory methods from the `Executors` class:

* [`newCachedThreadPool()`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newCachedThreadPool) — creates an ExecutorService that creates new threads as needed and reuses existing threads to handle incoming tasks.
* [`newFixedThreadPool(int numberOfThreads)`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newFixedThreadPool-int-) — creates an ExecutorService that reuses a fixed number
of threads.
* [`newScheduledThreadPool(int corePoolSize)`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newScheduledThreadPool-int-) — creates an ExecutorService that schedules commands
to run after a given delay (or to execute periodically).
* [`newSingleThreadExecutor()`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newSingleThreadExecutor--) — creates an ExecutorService that uses a single worker thread.
* [`newSingleThreadScheduledExecutor()`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newSingleThreadScheduledExecutor--) — creates a single-threaded ExecutorService that schedules
commands to run after a given delay (or to execute periodically).
* [`newWorkStealingPool()`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newWorkStealingPool--) — creates an ExecutorService that uses multiple task queues to reduce
contention.

In the example presented above we invoke all tasks at once, but you can use other methods to execute a task:

* [`void execute(Runnable)`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executor.html#execute-java.lang.Runnable-)
* [`Future<T> submit(Callable<T>)`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html#submit-java.util.concurrent.Callable-)
* [`Future<?> submit(Runnable)`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html#submit-java.lang.Runnable-)

Finally, we gently ask the executorService to shutdown.
[`Shutdown()`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html#shutdown--) is a non-blocking
method. Calling it makes an ExecutorService enter a “shutdown mode” in which all previously submitted tasks
are executed, but no new tasks are accepted. If you want to wait for submitted tasks to finish, you
should use the [`awaitTermination()`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html#awaitTermination-long-java.util.concurrent.TimeUnit-) method.

ExecutorService is a very useful tool that allows us to execute all tasks in a convenient way.
What are the benefits? We don't have to create any worker thread manually.
A worker thread is a thread which is used internally by the ExecutorService.
It is worth remembering that the Executor service manages the thread lifecycle for us.
It can increase the number of worker threads when the load increases. On the other
hand it can tear down threads which are inactive for a given period of time.
We shouldn't think about any thread at all when we work with a thread pool.
We should instead think about tasks that are processed asynchronously.
Moreover, we don't have
to recreate a thread when an unexpected exception occurs and we don't have to worry about
reusing a thread when it finishes a task it was assigned.
Finally, after submitting a task we are provided with a useful future result
abstraction — a [`Future`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Future.html).
Of course, since Java 8 we can use even better [`CompletableFuture`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html),
but converting a `Future` into a `CompletableFuture` is out of the scope of this post.
Please remember that working with `Futures` makes sense only when we submit a `Callable`,
because `Callables` produce results while `Runnables` don't.

### Internals

Every thread pool consists of several building blocks:

* a task queue,
* a collection of worker threads,
* a thread factory,
* metadata for managing thread pool state.

There are many implementations of the ExecutorService interface, but let us focus on
the commonly used [`ThreadPoolExecutor`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html).
In fact, `newCachedThreadPool()`, `newFixedThreadPool()` and `newSingleThreadExecutor()` methods
return instances of the `ThreadPoolExecutor` class.
In order to create a `ThreadPoolExecutor` manually you have to provide at least 5 arguments:

* `int corePoolSize` — the number of threads to keep in the pool.
* `int maximumPoolSize` — the maximum number of threads in the pool.
* `long keepAlive` and `TimeUnit unit` — the number of threads above `corePoolSize` will be torn down
after being idle for the given amount of time.
* `BlockingQueue<Runnable> workQueue` — submitted tasks wait in this queue to be executed.

![threadpool](/img/articles/2015-04-22-thread-pools/thread-pool.png "Thread pool")

(An image from [Wikipedia](http://en.wikipedia.org/wiki/Thread_pool_pattern))

### BlockingQueue

[`LinkedBlockingQueue`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/LinkedBlockingQueue.html)
is used by default when you create a `ThreadPoolExecutor` by calling one of the methods from the `Executors` class.
[`PriorityBlockingQueue`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/PriorityBlockingQueue.html)
is in fact an instance of a [`BlockingQueue`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/BlockingQueue.html),
but processing tasks with respect to their priority is a tricky business. To begin with, submitted
`Runnable` or `Callable` tasks are wrapped in a [`RunnableFuture`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/RunnableFuture.html)
which is then added to the queue. As a result, the `ProrityBlockingQueue` compares wrong objects in
order to determine their priority (RunnableFuture wrappers instead of their payloads).
Moreover, when the `corePoolSize` property is greater than 1 and
the worker threads are not busy, `ThreadPoolExecutor` may serve requests in their insertion order,
before the `PriorityBlockingQueue` can shuffle them with respect to their priority.

By default, the `workQueue` used by `ThreadPoolExecutor` is unbounded. It is OK in most
cases but, of course, you can change this behaviour. However, remember that
unbounded work queue may cause your application to fail due to [out of memory error](http://docs.oracle.com/javase/8/docs/api/java/lang/OutOfMemoryError.html).
When you limit the size of the task queue remember to set
[`RejectionExecutionHandler`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/RejectedExecutionHandler.html).
You can provide your custom implementation or choose from 4 handler flavours (AbortPolicy is used
by default):

* CallerRunsPolicy
* AbortPolicy
* DiscardPolicy
* DiscardOldestPolicy

### Thread factory

Thread [Factories](http://en.wikipedia.org/wiki/Factory_(object-oriented_programming)) are often used to customize
the creation of worker threads. You can, for example, add a custom
[`Thread.UncaughtExceptionHandler`](http://docs.oracle.com/javase/7/docs/api/java/lang/Thread.UncaughtExceptionHandler.html)
or set thread name. In the following example we log uncaught exceptions together with thread name and
thread sequential number:

```java
public class LoggingThreadFactory implements ThreadFactory {

    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    private static final String THREAD_NAME_PREFIX = "worker-thread-";

    private final AtomicInteger threadCreationCounter = new AtomicInteger();

    @Override
    public Thread newThread(Runnable task) {
        int threadNumber = threadCreationCounter.incrementAndGet();
        Thread workerThread = new Thread(task, THREAD_NAME_PREFIX + threadNumber);

        workerThread.setUncaughtExceptionHandler(thread, throwable -> logger.error("Thread {} {}", thread.getName(), throwable));

        return workerThread;
    }
}
```

### Producer-consumer example

The [producer-consumer](http://en.wikipedia.org/wiki/Producer%E2%80%93consumer_problem) problem is a common
multi-process synchronization problem. In this example we solve this problem using an ExecutorService.
However, this is not a textbook example of how this problem should be solved. My goal is to show that
a thread pool can handle all of the synchronization issues and, as a result, programmers can instead focus on
implementing the business logic.

Producer periodically fetches new data from the database to create business task objects and submits
these tasks to the ExecutorService.
Consumer, represented by a worker thread from a thread pool managed by the ExecutorService,
processes business tasks (i.e. calculates prices and sends them back to customers).

To begin with, we start with a Spring configuration:

```java
@Configuration
public class ProducerConsumerConfiguration {

    @Bean
    public ExecutorService executorService() {
        // single consumer
        return Executors.newSingleThreadExecutor();
    }

    // other beans such as a data source, a scheduler, etc.
}
```

Then, there is the `Consumer` class together with the `ConsumerFactory` component.
The factory is used by the producer in order to create a piece of work that will
be picked up by the worker thread at some point in the future.

```java
public class Consumer implements Runnable {

    private final BusinessTask businessTask;
    private final BusinessLogic businessLogic;

    public Consumer(BusinessTask businessTask, BusinessLogic businessLogic) {
        this.businessTask = businessTask;
        this.businessLogic = businessLogic;
    }

    @Override
    public void run() {
        businessLogic.processTask(businessTask);
    }
}
```

```java
@Component
public class ConsumerFactory {
    private final BusinessLogic businessLogic;

    public ConsumerFactory(BusinessLogic businessLogic) {
        this.businessLogic = businessLogic;
    }

    public Consumer newConsumer(BusinessTask businessTask) {
        return new Consumer(businessTask, businessLogic);
    }
}
```

Finally, there is the `Producer` class that fetches new data from the database
and creates business tasks. In this example we assume that the `fetchData()`
method is periodically called by a scheduler.

```java
@Component
public class Producer {

    private final DataRepository dataRepository;
    private final ExecutorService executorService;
    private final ConsumerFactory consumerFactory;

    @Autowired
    public Producer(DataRepository dataRepository, ExecutorService executorService,
					ConsumerFactory consumerFactory) {
        this.dataRepository = dataRepository;
        this.executorService = executorService;
        this.consumerFactory = consumerFactory;
    }

    public void fetchAndSubmitForProcessing() {
        List<Data> data = dataRepository.fetchNew();

        data.stream()
            // create a business task from data fetched from the database
            .map(BusinessTask::fromData)
            // create a consumer for each business task
            .map(consumerFactory::newConsumer)
            // submit the task for further processing in the future (submit is a non-blocking method)
            .forEach(executorService::submit);
    }
}
```

Thanks to the ExecutorService we could focus on implementing the business logic
and we don't have to worry about synchronization issues. The code presented above
uses only one producer and one consumer. However, it could be easily adapted
to multi-producer and multi-consumer environment.

### Summary

[JDK 5](http://en.wikipedia.org/wiki/Java_version_history#J2SE_5.0_.28September_30.2C_2004.29)
arrived in 2004 and provided many useful concurrent goodies, with the ExecutorService class among them.
The thread pool abstraction is commonly used in server environments under the hood
(see [Tomcat](http://docs.oracle.com/cd/E23507_01/Platform.20073/ATGInstallGuide/html/s0902tomcatconnectorthreadconfigurati01.html)
and [Undertow](http://undertow.io/undertow-docs/undertow-docs-1.2.0/index.html#listeners-2)). Of course, thread pools
are not limited to server environments only. They are useful in solving any sort of
[embarrassingly parallel](http://en.wikipedia.org/wiki/Embarrassingly_parallel) problems.
Due to the fact that today it is more common to run software on a multi-core machine
rather than on a single-core machine, thread pools are definitely worth considering.
