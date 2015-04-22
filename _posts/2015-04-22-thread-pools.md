---
layout: post
title: An introduction to thread pools in Java
author: piotr.glazar
tags: [java, concurrency, pools, threads, executors]
---

According to [Moore’s law](http://en.wikipedia.org/wiki/Moore%27s_law) the number of transistors
in an integrated circuit doubles approximately every two years. However, the exponential
processor transistor growth does not always translate into exponentially greater practical CPU
performance. Processor manufacturers for years delivered processors with higher clock rates and
instruction parallelism. As a result, a single-threaded code executed faster on newer generations of
processors. Of course, it is impossible to speed up clock rates infinitely and processors like
[AMD FX-9590](http://cpuboss.com/cpu/AMD-FX-9590) with Turbo clock speed at 5 GHz are rather unique.
Today, processor manufacturers favour [multi-core processors](http://en.wikipedia.org/wiki/Multi-core_processor).
It is common to have a quad-core CPU in smartphones, not to mention laptops or even desktop PCs.
Consequently, software has to be written in a multi-threaded manner to take the full advantage of the
hardware. [Thread pools](http://en.wikipedia.org/wiki/Thread_pool_pattern) can help programmers
harness multi-core CPUs.

### Thread pools

Good software design techniques suggest that [threads](http://docs.oracle.com/javase/8/docs/api/java/lang/Thread.html) 
should not be created and
destroyed manually. Thread creation and destruction are expensive processes which consume both CPU
and memory, as it requires JVM and OS activity. Moreover, creating a new thread for each request in a
server application can consume significant amount of computer resources when requests are frequent and
lightweight. Thread pools can handle thread lifecycle automatically according to the
strategy selected on thread pool creation. An important feature of a thread pool is that
it allows applications to degradate gracefully. A server application can queue incoming
requests and handle them when it has enough resources, like memory or CPU, to do so.
Otherwise, without thread pools, the server application may crash because it runs out of resources.
Moreover, programmers who use threads manually must remember to handle exceptional
situations when a thread dies due to, for example, a [`NullPointerException`](http://docs.oracle.com/javase/8/docs/api/java/lang/NullPointerException.html).

All aforementioned features are easy to use via a convenient helper
class — [`Executors`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html).
The following code snippet presents the lifecycle of an [`ExecutorService`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html):

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

We begin with creating the simplest `ExecutorService` — a single threaded executor. It uses one
thread to handle incoming tasks. Of course, you can customize your `ExecutorService` in a wide
variety of ways or use one of the helper methods from the `Executors` class:
* `newCachedThreadPool()` — creates an `ExecutorService` that creates new threads as needed.
* `newFixedThreadPool(int numberOfThreads)` — creates an `ExecutorService` that reuses a fixed number
of threads.
* `newScheduledThreadPool(int corePoolSize)` — creates an `ExecutorService` that schedules commands
to run after a given delay (or to execute periodically).
* `newSingleThreadExecutor()` — creates an `ExecutorService` that uses a single worker thread.
* `newSingleThreadScheduledExecutor()` — creates a single-threaded `ExecutorService` that schedules
commands to run after a given delay (or to execute periodically).
* `newWorkStealingPool()` — creates an `ExecutorService` that uses multiple task queues to reduce
contention.

In the example presented above we invoke all tasks at once, but you can use other methods to execute a task:
* `void execute(Runnable)`
* `Future<T> submit(Callable<T>)`
* `Future<?> submit(Runnable)`

Finally, we gently ask the `executorService` to shutdown. The `shutdown()` method is a non-blocking
method. Calling it makes an `ExecutorService` enter a “shutdown mode” in which all previously submitted tasks
are executed, but no new tasks are accepted. If you want to wait for submitted tasks to finish, you
should use the `awaitTermination()` method.

An `ExecutorService` is a very useful tool that allowed us to execute all tasks in a convenient way.
What are the benefits? We do not have to create any worker thread manually. Moreover, we do not have
to recreate the thread when an unexpected exception occurs and we do not have to tear down the thread
when the computation finishes. Finally, after submitting a task we are provided with a useful future task
abstraction — a [`Future`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Future.html).
Of course, since Java 8 we can use even better [`CompletableFuture`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html),
but converting a `Future` into a `CompletableFuture` is out of the scope of this post.

### Internals

Every thread pool consists of several building blocks:
* a task queue,
* a collection of worker threads,
* a thread factory,
* metadata for managing thread pool state.

There are many implementations of the `ExecutorService` interface, but let us focus on
the commonly used [`ThreadPoolExecutor`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html).
In fact, `newCachedThreadPool()`, `newFixedThreadPool()` and `newSingleThreadExecutor()` methods
return an instance of the `ThreadPoolExecutor` class.
In order to create a `ThreadPoolExecutor` manually you have to provide at least 5 arguments:
* `int corePoolSize` — the number of threads to keep in the pool.
* `int maximumPoolSize` — the maximum number of threads in the pool.
* `long keepAlive` and `TimeUnit unit` — the number of threads above `corePoolSize` will be torn down
after being idle for the given amount of time.
* `BlockingQueue<Runnable> workQueue` — submitted tasks wait in this queue to be executed.

![](thread-pool.png "Thread pool")
(An image from [Wikipedia](http://en.wikipedia.org/wiki/Thread_pool_patternhttp://en.wikipedia.org/wiki/Thread_pool_pattern))

### BlockingQueue

[`LinkedBlockingQueue`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/LinkedBlockingQueue.html)
is used by default when you create a `ThreadPoolExecutor` by calling one of the methods from the `Executors` class.
[`PriorityBlockingQueue`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/PriorityBlockingQueue.html)
is in fact an instance of a [`BlockingQueue`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/BlockingQueue.html),
but processing tasks with respect to their priority is a tricky business. To begin with, submitted
`Runnable` or `Callable` tasks are wrapped in a [`RunnableFuture`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/RunnableFuture.html)
which is then added to the queue. As a result, the `ProrityBlockingQueue` compares wrong objects in
order to determine their priority. Moreover, when the `corePoolSize` property is greater than 1 and
the worker threads are not busy, `ThreadPoolExecutor` may serve requests in their insertion order,
before the `PriorityBlockingQueue` can shuffle them with respect to their priority.

By default, the `workQueue` used by `ThreadPoolExecutor` is unbounded. It is sufficient in most
cases but, of course, you can change this behaviour. When you limit the size of the
task queue remember to set
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

    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    private static final String THREAD_NAME_PREFIX = "worker-thread-";

    private final AtomicInteger threadCreationCounter = new AtomicInteger();

    @Override
    public Thread newThread(Runnable task) {
        int threadNumber = threadCreationCounter.incrementAndGet();
        Thread workerThread = new Thread(task, THREAD_NAME_PREFIX + threadNumber);

        workerThread.setUncaughtExceptionHandler(thread, throwable -> LOG.error("Thread {} {}", thread.getName(), throwable));

        return workerThread;
    }
}
```

### Producer-consumer example

The [producer-consumer](http://en.wikipedia.org/wiki/Producer%E2%80%93consumer_problem) problem is a common
multi-process synchronization problem. In this example we solve this problem using an `ExecutorService`.
However, this not a textbook example of how this problem should be solved. My goal is to show that
the thread pool can handle all of the synchronization issues and, as a result, programmers can instead focus on
implementing the business logic.

Producer periodically fetches new data from the database to create business task objects and submits
these tasks to the `ExecutorService`.
Consumer, represented by a worker thread from a thread pool managed by the `ExecutorService`,
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

Thanks to the `ExecutorService` we could focus on implementing the business logic
and we do not have to worry about synchronization issues. The code presented above
uses only one producer and one consumer. However, it could be easily adapted
to multi-producer and multi-consumer environment.

### Summary

[JDK 5](http://en.wikipedia.org/wiki/Java_version_history#J2SE_5.0_.28September_30.2C_2004.29)
arrived in 2004 and provided many useful concurrent goodies, with the `ExecutorService` class among them.
The thread pool abstraction is commonly used in server environments under the hood
(see [JBoss](http://www.mastertheboss.com/jboss-server/jboss-performance/jboss-performance-tuning-part-1?start=2)
and [Undertow](http://undertow.io/documentation/core/listeners.html)). Of course, thread pools
are not only limited to server environments. They are useful in solving any sort of
[embarrassingly parallel](http://en.wikipedia.org/wiki/Embarrassingly_parallel) problems.
And due to the fact that today it is more common to run software on a multi-core machine
rather than on a single-core machine, thread pools are definitely worth considering.
