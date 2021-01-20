---
layout: post
title: There is more to logging than meets the eye
author: rafal.glowinski
tags: [java, logging, logback, slf4j, async appender, async logging]
---

In this article I will show you that if you want to implement good logging into your application then you should have
a strong knowledge of logging API, spend some time considering what and when to log and last but not least: remember that
logging is a cost paid in your application’s responsiveness.

## Logging? That’s easy!

Logging seems to be dead simple — you just spit out text messages that should be helpful when diagnosing application
problems. This approach is wrong for at least two reasons:

- One should think carefully what to log, when to log and what logging level to use for different messages so that logs
don’t resemble a huge useless wall of text. Any anomalies or fatal errors should be easily visible.
- Even if one has spent enough time on the complete logging approach, there are some technical bits you should know and
keep in mind.

I will start off with a list of most popular logging frameworks and explain why it is important to use logging levels,
named loggers and MDC (Mapped Diagnostic Context) properly. Later I will show frequent mistakes and misuses of the
logging API’s and how they can affect the performance of your application. In the end I will explain why you should
always consider logging as an operation with certain cost and how to minimize this cost with the usage of asynchronous
logging.

### Most popular logging frameworks

Available logging frameworks for Java can be divided into two groups: abstraction layers and the full-blown frameworks.
Abstraction layer (over logging) is a library providing a common logging API with plugins for different logging frameworks.
The [most popular ones](http://zeroturnaround.com/rebellabs/the-state-of-logging-in-java-2013/) are: [SLF4J](http://www.slf4j.org/) - 61%
and [Commons Logging](http://commons.apache.org/proper/commons-logging/) - 9%. Plenty of developers - 28% - use no
abstraction layer. All the remaining abstraction frameworks fit into the remaining 2%.

There are more logging frameworks than abstraction layers and they can be used directly. These are the most popular ones:

- [Log4j](http://logging.apache.org/log4j/1.2/): a bit old but mature and still very popular
- [Log4j2](http://logging.apache.org/log4j/2.x/): new, and much better, version of Log4j
- [Logback](http://logback.qos.ch/): written by one of the authors of Log4j ("Logback is intended as a successor to the
popular log4j project, picking up where log4j leaves off." - Ceki Gülcü)
- [java.util.logging (JULI)](http://docs.oracle.com/javase/8/docs/technotes/guides/logging/overview.html): provided by
JDK since version 1.4

Unless stated otherwise, in this article I will refer to Logback + SLF4J configuration because this setup is widely
adopted by mature projects. Just keep in mind that Log4j2 is also an excellent logging framework.

## Usability considerations

As stated before, you should think carefully when designing logging across the application. There are mechanisms that
can help you out to make the most of your logged messages when the time comes (this usually happens on Sunday evening).

### Logging levels

Logged messages should have a priority: some of them are more important than others. As such, you should always remember
to log them at the appropriate level. You don’t want to have a low level message like ’Query executed successfully’
reported on INFO level. Logging lots of unimportant messages on a high logging level (INFO, WARN or even ERROR) clutters
log files, which makes important bits almost invisible in the crowd and may decrease performance of the application.
Quality of logs is always more important than the sheer amount.

### Named loggers

When creating loggers, one usually writes code very similar to this:

```
public class SomeService {
   private static final Logger logger = LoggerFactory.getLogger(SomeService.class);

   // ....
}
```

”What is wrong with it?”, you might ask. This approach creates a separate logger for the class, using its fully qualified
name (including the package name). It is not necessarily a bad thing if your code is nicely divided into packages (for example
according to [Hexagonal Architecture](http://alistair.cockburn.us/Hexagonal+architecture)) since you can filter logs from
certain parts of the application using package structure.

Still, there are going to be cases when your code is not nicely organized or you want to explicitly group some logs and
to be able to filter them out easily (for example: method call timings from across the application) or to redirect some
part of logs to another log appender:

```
<logger name="METRICS" level="DEBUG">
    <appender-ref ref="METRICS_APPENDER"/>
</logger>
```

In such cases, you should consider named loggers. They can be used in the following way:

```
public class SomeService {
   private static final Logger metricsLogger = LoggerFactory.getLogger("METRICS");

   public void writeStuffToDatabase(...) {
           long start = System.currentTimeMillis();

           // perform the DB Save

           metricsLogger.trace("Save to DB took {} ms", (System.currentTimeMillis() - start));
   }
}

public class AnotherService {
   private static final Logger metricsLogger = LoggerFactory.getLogger("METRICS");

   public void sendDataToExternalMicroservice(...) {
           long start = System.currentTimeMillis();

           // perform the call to external REST endpoint

           metricsLogger.trace("Data sending took {} ms", (System.currentTimeMillis() - start));
   }
}
```

This code obviously has some issues (but it was meant to be very simple):

- such logging should not be mixed with regular business logic: use [AOP (Aspect Oriented Programming)](https://en.wikipedia.org/wiki/Aspect-oriented_programming)
for that — it will be discussed later
- it uses `System.currentTimeMillis()` instead of `System.nanoTime()`: this was done deliberately to simplify the code.

Otherwise it would have to use `TimeUnit.NANOSECONDS.toMillis(...)` which would clutter it a little bit. The context is
clearly visible: named loggers are a good and very easy way to group logs from different parts of the application. By grouping
them using a named logger you also give such messages a common context. In this case, you say that all of these logs are
related to our metrics gathering mechanisms and that they all belong together.

### MDC (Mapped Diagnostic Context)

MDC is a neat way to stamp all logs produced during processing of a request with the same value(s). A typical usage
scenario is to generate a unique ID for each incoming request and to populate MDC as soon as possible using `MDC.put("request-id", "unique id")`.
This way, all log messages produced during processing of such a request will be stamped with additional field: "request-id"
with value of "unique id". You can add multiple such stamps — depending on your needs.

One can think of MDC as a sort of an aspect that goes across the entire codebase and affects all logs produced by the system.
It allows you to very quickly find all log messages produced during handling of any request — provided you have its "request-id".
It is especially handy in cases when your application handles hundreds of requests per second.

To output a given "stamp" from MDC to our logfile, you just have to tell Logback to use it (unimportant details removed)
— by using `%X{request-id}` syntax:

```
<appender name="..." class="...">
  <layout>
    <Pattern>%X{request-id} - %m%n</Pattern>
  </layout>
</appender>
```

MDC exists in Log4j2 as well, but under a different name: [Thread Context](https://logging.apache.org/log4j/2.x/manual/thread-context.html).

## Know your tools

Everyone knows how to log messages, period. But do they really? All too often, when I browse Java code I see very simple
mistakes regarding proper usage of SLF4J API’s.

### Message formatting

Developers tend to use libraries without reading the docs. They also often don’t even bother to take a sneak peek at the
JavaDocs in their IDEs. In case of SLF4J + Logback combo, it can result in code like this:

```
public class UserDao {
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    public void updateUserEmail(long userId, String email) {
        logger.trace("’updateUserEmail’ called with args: userId= "+ userId +", email= "+ email);

        // normal DB related logic
    }
}
```

A simple log message one could say. Yes — it is simple, but it is also written in a very cumbersome way that does not
use SLF4J API’s at all. A correct way to log such a message is:

```
public class UserDao {
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    public void updateUserEmail(long userId, String email) {
        logger.trace("’updateUserEmail’ called with args: userId= {}, email= {}", userId, email);

        // normal DB related logic
    }
}
```

SLF4J provides a lot of methods that accept message format and arguments which have to be used in conjunction with this
format. It makes logging expressions much nicer to read and saves some CPU cycles for messages which are not logged in
current setup due to low priority.

### Exception logging

Sometimes things don’t go as planned and you are forced to log an exception. This is a place where I often see another
type of a mistake: developers think that method `org.slf4j.Logger#error(java.lang.String, java.lang.Throwable)` is the
only way to log an exception and so they write code similar to this:

```
public class UserDao {
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    public void updateUserEmail(long userId, String email) {
        try {
            // normal DB related logic
        } catch (Exception e) {
            // don’t mind that we catch raw Exception ;)
            logger.error("Exception while updating user’s (id="+ userId +") email to: "+ email, e);
        }
    }
}
```

This piece of code produces quite an informative log message which can help you diagnose the problem. The issue here is
that it is done in the wrong way. Not everyone knows that SLF4J + Logback are quite smart and that they can extract a
`Throwable` from provided format arguments (if and only if it is the last argument passed to a logger method). Knowing
this, the code can be rewritten once more:

```
public class UserDao {
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    public void updateUserEmail(long userId, String email) {
        try {
            // normal DB related logic
        } catch (Exception e) {
            // don’t mind that we catch raw Exception ;)
            logger.error("Exception while updating user’s (id={}) email to: {}", userId, email, e);
        }
    }
}
```

### org.slf4j.Logger#isTraceEnabled()

Take a look at the following (improved) snippet:

```
public class UserDao {
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    public void updateUserEmail(long userId, String email) {
        if (logger.isTraceEnabled()) {
            logger.trace("’updateUserEmail’ called with args: userId= {}, email= {}", userId, email);
        }

        // normal DB related logic
    }
}
```

In this case message formatting looks ok, but another mistake has been made. The author of this code knows that logging
can be expensive, so the decision has been made to only log this message when trace level logging is enabled. It is quite
a good idea to save some CPU cycles, but in this case completely unnecessary as SLF4J + Logback does exactly this underneath.

When you log a message using a proper call to `Logger.trace(format, argument1, argument2, ...)` no final log message gets
created (from format and provided arguments) unless TRACE level is enabled on this particular logger. It is a neat thing
and definitely worth remembering.

### MDC vs Thread Boundaries

A bit earlier I mentioned Mapped Diagnostic Context as a very nice way to "stamp" your logs. There is a catch, though.
It will be the more painful the more asynchronous processing you are using.

Logback’s implementation of MDC uses `java.lang.InheritableThreadLocal<Map<String, String>>` internally to store your
stamps. Let’s read the JavaDoc for this class:

> This class extends ThreadLocal to provide inheritance of values from parent thread to child thread: when a child thread
is created, the child receives initial values for all inheritable thread-local variables for which the parent has values.
Normally the child’s values will be identical to the parent’s; however, the child’s value can be made an arbitrary function
of the parent’s by overriding the childValue method in this class.

&nbsp;

> Inheritable thread-local variables are used in preference to ordinary thread-local variables when the per-thread-attribute
being maintained in the variable (e.g., User ID, Transaction ID) must be automatically transmitted to any child threads that
are created.

It means that when a new thread is spawned to handle your sub-call(s), it will inherit all the "stamps" you already have
in the MDC. It is a nice feature — you would think. But since in most thread pools a thread is there to stay (at least
for some time) once created, all these inherited "stamps" will also stay. If such a spawned thread is used later on to
perform a different operation, its MDC will still hold on to these previously stored values. It can mess up your logs,
so be careful.

Is there a solution to this behavior? Yes. When using `java.util.concurrent.Callable<T>` interface to submit jobs to a
thread pool, you could create a wrapper around `Callable<T>` to copy MDC right before a call to `Callable.call()` and
restore it immediately after. This wrapper could look like this:

```
public static class MdcCopyingCallableWrapper<T> implements Callable<T> {

    private final Map<String, String> context;
    private final Callable<T> delegate;

    public MdcCopyingCallableWrapper(Callable<T> delegate) {
        this.context = MDC.getCopyOfContextMap();
        this.delegate = delegate;
    }

    @Override
    public T call() throws Exception {
         // MDC.getCopyOfContextMap() can return null, so be careful!
        Map<String, String> previous = MDC.getCopyOfContextMap();
        setMdcContext(context);

        try {
            return delegate.call();
        } finally {
            setMdcContext(previous);
        }
    }

    private void setMdcContext(Map<String, String> context) {
        if (context == null) {
            MDC.clear();
        } else {
            MDC.setContextMap(context);
        }
    }
}
```

and then its usage looks like this:

```
ExecutorService executorService = ... // executor created somewhere else

// submit a Callable<String> that will return a current datetime in String format
executorService.submit(new MdcCopyingCallableWrapper<>(() -> new Date().toString()));
```

Properly used MDC is a super useful feature. Use it in your applications but pay extra attention when using it in
multithreaded applications. As is often the case with multithreading — possible bugs can (and most likely will) be
difficult to track.

## Performance

When developers look for a source of performance issues, they often start from DB queries, GC tuning, network issues etc.
In most cases it is a perfectly valid approach since these are the places where problems tend to occur most often. However,
logging itself can be another source of performance issues.

### String concatenation

String concatenation is costly. It not only consumes CPU cycles, but also influences the global allocation rate which in
turn will affect GC which in turn will affect CPU! Ok, so down to the CPU again. Excessive string concatenation in logging
usually starts with one (or both) of two mistakes.

#### Improper use of logging API’s

String concatenation instead of proper calls to API’s methods (I talked about them in "Message formatting" section) will
concatenate log messages that may not be logged anywhere because configured logging levels will not allow it. In such a
situation lots of CPU cycles will be wasted.

#### Improper use of logging levels

Logging too much and/or too detailed information on wrong levels (I talked about it in "Logging levels" section) will
consume your CPU cycles just as improper use of logging API’s could. This mistake will not only clutter your logs, but
also affect performance.

### org.slf4j.Logger#isTraceEnabled(). Again.

Earlier on, I showed an example where Logger’s method `org.slf4j.Logger#isTraceEnabled()` was used in a wrong way, but it
does not mean that the method is useless. To the contrary, when used properly it can help save some CPU cycles.

Imagine a situation where you want to log all arguments during a method call but these arguments have to be pre-processed
in some way before being logged. If such pre-processing is costly, then using `org.slf4j.Logger#isTraceEnabled()` to wrap
this logging is a perfectly valid and good approach that will reduce performance footprint of logging. Here is a piece of
extremely simple code to illustrate such a situation:

```
public class UserDao {
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    public long saveUser(User user) {
        if (logger.isTraceEnabled()) {
            //
            // perform some very costly pre-processing on User object before logging
            //
            String preProcessedUserData = preProcess(user);
            logger.trace("Method ’saveUser’ called with arguments: user = {}", preProcessedUserData);
        }

        // normal DB related logic
    }
}
```

### Asynchronous logging

When application logs a message, the cost is not only in a few additional method calls and string concatenation, but
also additional I/O operations: logs have to be written somewhere (that is the whole point of logging). Writing to a
local file seems like a very fast operation, and it is... [most of the time](http://bencane.com/2012/08/06/troubleshooting-high-io-wait-in-linux/).
However, there are certain situations where the process that logs will be blocked on OS level by I/O operations. In such
cases, logging will actually affect the performance (latency and throughput) of an application.

In the world of Microservices, log aggregation solutions like [Logstash](https://www.elastic.co/guide/en/logstash/current/index.html)
become more and more popular. This is a very good thing, because they are very good products that can really remove the
pain of grepping through files from multiple servers. Having all application logs in one place is always a good thing.
Logback already supports logging to remote systems. In case of remote log aggregators, data has to be sent over the
network — which just like local I/O queuing may be a performance hit to the application.

The above concerns are here and are very real. The more log messages an application produces, the more it is affected by
them. Most developers know about them and are not surprised. What about risks that are less obvious?

Take a look at the following fragment of the class `ch.qos.logback.core.OutputStreamAppender` which is a base class for
the most often used Logback’s appenders: ConsoleAppender and FileAppender:

```
public class OutputStreamAppender<E> extends UnsynchronizedAppenderBase<E> {


  /**
   * It is the encoder which is ultimately responsible for writing the event to
   * an {@link OutputStream}.
   */
  protected Encoder<E> encoder;

  /**
   * All synchronization in this class is done via the lock object.
   */
  protected final ReentrantLock lock = new ReentrantLock(true);

  /**
   * This is the {@link OutputStream outputStream} where output will be written.
   */
  private OutputStream outputStream;

  // ...........

  /**
   * Actual writing occurs here.
   * <p>
   * Most subclasses of <code>WriterAppender</code> will need to override this
   * method.
   *
   * @since 0.9.0
   */
  protected void subAppend(E event) {
    if (!isStarted()) {
      return;
    }
    try {
      // this step avoids LBCLASSIC-139
      if (event instanceof DeferredProcessingAware) {
        ((DeferredProcessingAware) event).prepareForDeferredProcessing();
      }
      // the synchronization prevents the OutputStream from being closed while we
      // are writing. It also prevents multiple threads from entering the same
      // converter. Converters assume that they are in a synchronized block.


      lock.lock();
      try {
        writeOut(event);
      } finally {
        lock.unlock();
      }


    } catch (IOException ioe) {
      // as soon as an exception occurs, move to non-started state
      // and add a single ErrorStatus to the SM.
      this.started = false;
      addStatus(new ErrorStatus("IO failure in appender", this, ioe));
    }
  }

  // ........................
}
```

For the sake of readability I removed (and reformatted a bit) unnecessary code. As you can see, each logging operation
involves synchronization on `ReentrantLock` object. Modern systems tend to handle hundreds of requests at the same time.
Each thread that wants to write a log message will have to wait on this lock for its turn. The amount of synchronization
increases proportionally to the number of threads that want to log a message and the number of messages that are being
logged. In the end your application’s threads may be spending a lot of time waiting for this lock to be available.

There exists however a simple solution to this "concurrent logging" problem — it is called `ch.qos.logback.classic.AsyncAppender`.
It has existed in Logback for a very long time now, but I am often surprised how few people know about it. Its usage is
very simple — just wrap any appender with AsyncAppender and you are done. Following is the simplest example how to
configure AsyncAppender in Logback:

```
<configuration>
    <appender name="LOGSTASH_BASE" class="...">
        <host>...<host>
        <port>515</port>
    </appender>

    <appender name="LOGSTASH" class="ch.qos.logback.classic.AsyncAppender">
        <queueSize>50000</queueSize>
        <discardingThreshold>0</discardingThreshold>
        <appender-ref ref="LOGSTASH_BASE" />
    </appender>

    <root level="INFO">
        <appender-ref ref="LOGSTASH"/>
    </root>
</configuration>
```

AsyncAppender uses `java.util.concurrent.BlockingQueue` to gather log messages from producing threads which means there
is also going to be some synchronization here, but with much smaller impact on the application than using `java.util.concurrent.locks.ReentrantLock`.
To add to the subject: Log4j2’s implementation of asynchronous appenders uses [Disruptor Framework](https://lmax-exchange.github.io/disruptor/)
internally which may be a big improvement over the way Logback async appenders are implemented. Give it a try!

A final note of caution when using AsyncAppender: in case of a JVM failure, logs queued for writing will be lost.

## Advanced logging with AOP

When discussing named loggers, I presented a very simple snippet that had business logic interlaced with logging of all
method arguments. Back then, I made a note that it is not a good way to go, as such logging can easily clutter your business
code and that [AOP (Aspect Oriented Programming)](https://en.wikipedia.org/wiki/Aspect-oriented_programming) should be
used instead.

Depending on the type of application AOP will have to be configured differently. In case of a typical Spring Framework
based application, you just need to add the following dependencies:
- org.springframework : spring-aop
- org.aspectj : aspectjrt
- org.aspectj : aspectjweaver

and then ensure that `org.springframework.context.annotation.EnableAspectJAutoProxy` is placed on one of Spring
`@Configuration` classes. Once that is ready, aspects can be configured. Again — configuration of aspects
(pointcut definitions etc.) are way outside of the scope of this text and I strongly encourage everyone to read the
[documentation](http://www.eclipse.org/aspectj/doc/released/progguide/index.html).

Here is a very simple example of an aspect that is called `@Before` a method call:

```
@Aspect
@Component
public class MethodArgumentsLoggingAspect {

    public static final Logger logger = LoggerFactory.getLogger("METHOD-CALLS");

    @Before("execution(* com.example.logging.UserDao.findUser(..))")
    public void logMethodArguments(JoinPoint jp) {
        String methodName = jp.getSignature().getName();
        Object[] arguments = jp.getArgs();

        logger.trace("Method: {} called with arguments: {}", methodName, ArrayUtils.toString(arguments, "<null>"));
    }
}
```

There is a Spring component (and an aspect — notice `@Aspect`) called `MethodArgumentsLoggingAspect` defined. It has one
method with `@Before` annotation that has value of: `execution(* com.example.logging.UserDao.findUser(..))` which should
be read as: call `logMethodArguments` method before any call is made to a method `findUser` on a component of type
`com.example.logging.UserDao` and pass full method invocation data — `JoinPoint jp`. Once there is `JoinPoint jp`
available it is possible to extract lots of information from it.

Getting method name and arguments’ values is very simple. Aspects can be used in much more advanced ways. You should
think twice before putting any business related logic in aspects. They are very good for infrastructure concerns that cut
through big parts of an application but usually don’t go too well together with business functionalities. Business code
belongs in business components. Most developers will not look for business code in aspects.

## Summary

Logging is a very important part of each non-trivial application. It gets the more important the less possibility you
have to debug a problem in production. Think of it as "business logic" for when things go south. Without well-implemented
logging, you will be blind and you risk spending countless hours figuring out what the problem is. But be careful —
logging does affect performance of the application. So you should always keep this in mind because it is better to avoid
trading one problem (lack of logs) for another (scalability issues).

Even if your application does not handle hundreds of requests every second or does not have to scale or you simply don’t
care then just use your logging API’s to the fullest and enjoy good logs. They will come to your aid someday, I promise.
