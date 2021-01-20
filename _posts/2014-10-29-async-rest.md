---
layout: post
title: Asynchronous REST Services with JAX-RS and CompletableFuture
author: slawomir.bolimowski
tags: [java, async, rest]
---

One of new features introduced by [JAX-RS 2.0](https://jax-rs-spec.java.net/) is asynchronous processing in Server and Client APIs.
We use these APIs together with [`CompletableFuture`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)
and Java 8 [lambda expressions](http://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html) to show how to create scalable
and well performing REST services in a more functional way.

## Server API

By default, request processing on the server works in a synchronous mode, which means that each request is processed
in a single HTTP thread. When request processing is finished, the thread is returned to the thread pool.
This is not very significant when resource method execution takes a short time and the number of concurrent connections
is relatively not very high. In asynchronous mode the thread is returned to the thread pool before request processing is completed.
Request processing is then continued in another thread, called a Worker. The released I/O thread can be used to accept
new incoming requests. In many cases, just a few threads can handle lots of requests simultaneously, so the number of threads
needed to handle incoming requests can be reduced significantly. By using a lot fewer threads we both save memory
and improve performance (by reducing thread context switching) and we gain more resistance to [cascading failures]
(http://en.wikipedia.org/wiki/Cascading_failure) (good explanation of cascading failures influence on performance
can be found in [this](http://blog.paralleluniverse.co/2014/05/29/cascading-failures/) article).


In examples I'm using [Jersey] (https://jersey.java.net/documentation/latest/index.html), reference implementation of JAX-RS 2.0,
with embedded [Grizzly Http server](https://grizzly.java.net/httpserverframework.html). Tutorial how to setup clean project
with Jersey and Grizzly you can find on [Jersey Getting Started](https://jersey.java.net/documentation/latest/getting-started.html) page.


The following example shows a simple asynchronous resource method defined using the JAX-RS async API:

```java

    import javax.ws.rs.container.AsyncResponse;
    import javax.ws.rs.container.Suspended;
    import java.util.concurrent.Executor;

    @Path("/")
    public class Resource {

        @Inject
        private Executor executor;

        @GET
        public void asyncGet(@Suspended final AsyncResponse asyncResponse) {
                executor.execute(() -> {
                     String result = service.veryExpensiveOperation();
                     asyncResponse.resume(result);
                });
        }
    }

```

A resource method that produces a response asynchronously must inject [`AsyncResponse`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/container/AsyncResponse.html)
using `@Suspended` annotation. In the example above, response is not produced immediately, but `veryExpensiveOperation` is forked
to another thread and resource method returns immediately. When the execution of `veryExpensiveOperation` is completed,
the connection is resumed and the response is returned by calling `resume` on `AsyncResponse`. If you are using Jersey's
as JAX-RS implementation instead of manually executing task with [`Executor`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executor.html)
you can use [`@ManagedAsync`](https://jersey.java.net/apidocs/latest/jersey/org/glassfish/jersey/server/ManagedAsync.html) annotation
and `Resource.asyncGet()` method will be executed by an internal Jersey executor service.

```java

    import org.glassfish.jersey.server.ManagedAsync;

    public class Resource {

        @GET
        @ManagedAsync
        public void asyncGet(@Suspended final AsyncResponse asyncResponse) {
            String result = service.veryExpensiveOperation();
            asyncResponse.resume(result);
        }
    }

```

Response suspension time-out value can be specified with
<a href="http://docs.oracle.com/javaee/7/api/javax/ws/rs/container/AsyncResponse.html#register(java.lang.Class)">`setTimeout`</a> method.
JAX-RS specification requires throwing `ServiceUnavailableException` (mapped to 503 status) on time-out but this behaviour
can be modified by registering a custom [`TimeoutHandler`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/container/TimeoutHandler.html):

```java

    public class Resource {

        @GET
        @ManagedAsync
        public void asyncGet(@Suspended final AsyncResponse asyncResponse) {
            asyncResponse.setTimeout(1000, TimeUnit.MILLISECONDS);
            asyncResponse.setTimeoutHandler(ar -> ar.resume(
                    Response.status(Response.Status.SERVICE_UNAVAILABLE)
                            .entity("Operation timed out")
                            .build()));

            String result = service.veryExpensiveOperation();
            asyncResponse.resume(result);
        }
    }

```

It is possible to register callbacks on
<a href="http://docs.oracle.com/javaee/7/api/javax/ws/rs/container/AsyncResponse.html#register(java.lang.Class)">`AsyncResponse`</a> :

- [`CompletionCallback`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/container/CompletionCallback.html) for processing completion
- [`ConnectionCallback`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/container/ConnectionCallback.html) for connection termination

According to JSR-339 support for `ConnectionCallback` is OPTIONAL.


## Client API

The Client API supports asynchronous invocations as part of the invocation building process.
By default, invocations are synchronous but can be set to run asynchronously by calling the `async()` method.
Let see this on example call to Facebook [Graph API](https://developers.facebook.com/docs/graph-api/reference/v2.1):

```java

    import javax.ws.rs.client.ClientBuilder;
    import javax.ws.rs.client.WebTarget;
    import java.util.concurrent.Future;

    public class FacebookService {

        private final WebTarget target = ClientBuilder.newClient()
                .target("http://graph.facebook.com/");

        public Future<FacebookUser> userAsync(String user) {
            return target
                    .path("/{user}")
                    .resolveTemplate("user", user)
                    .request()
                    .async()
                    .get(FacebookUser.class);
        }
    }

```

additionally instance of [`InvocationCallback`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/client/InvocationCallback.html)
can be registered:

```java

    import javax.ws.rs.client.InvocationCallback;

    public class FacebookService {

        private final WebTarget target = ClientBuilder.newClient()
            .target("http://graph.facebook.com/");

        public Future<FacebookUser> userAsync(String user) {
            return target
                .path("/{user}")
                .resolveTemplate("user", user)
                .request()
                .async()
                .get(new InvocationCallback<FacebookUser>() {
                    @Override
                    public void completed(FacebookUser facebookUser) {
                        // on complete
                    }

                    @Override
                    public void failed(Throwable throwable) {
                        // on fail
                    }
                });
        }
    }

```

In examples above the call to `get()` after calling `async()` returns immediately without blocking the caller's thread.
Unfortunately, there is a [bug](https://java.net/jira/browse/JERSEY-2477) in Jersey (reference JAX-RS implementation)
that causes client to put each request in its own thread, which then blocks waiting for a response. Additionally,
when the response comes back yet another thread is started for each request, so there are two threads per request
plus the thread pool of the underlying http client. In comments under this bug it is mentioned that Jersey
internally relies on blocking IO API. Maybe in JAX-RS 2.1 it will be changed. Proposed [specification](https://www.jcp.org/en/jsr/detail?id=370)
contains information about possible support for non-blocking IO.

Spring Framework is an alternative, that provides similar capabilities both
for [Server](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/context/request/async/DeferredResult.html)
and [Client](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/AsyncRestTemplate.html) APIs.


## Mixing with CompletableFuture

[`CompletableFuture<T>`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)
is a new abstraction introduced in Java 8. It extends `Future<T>` and adds callbacks support to handle event-driven work.
In other languages this concept is called a *promise* or *deferred object*. First example with `CompletableFuture` looks like this:

```java

    import java.util.concurrent.CompletableFuture;

    public class Resource {

        @GET
        public void asyncGet(@Suspended final AsyncResponse asyncResponse) {
            CompletableFuture
                .runAsync(() -> service.veryExpensiveOperation())
                .thenApply((result) -> asyncResponse.resume(result));
        }
    }

```

Method [`runAsync`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html#runAsync-java.lang.Runnable-)
returns `CompletableFuture`
that is asynchronously completed by a task running in the [`ForkJoinPool.commonPool()`]
(http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html#commonPool--).
Custom `Executor` can be provided as second argument so different thread pools can be used. Multiple `CompletableFuture` instances
can be processed and combined without retrieving the result, in a non-blocking way. In example below we merge user data
from Facebook with data from GitHub:

```java

    import javax.ws.rs.container.AsyncResponse;
    import javax.ws.rs.container.Suspended;
    import java.util.concurrent.CompletableFuture;

    @Path("/")
    public class AsyncResource {

        @GET
        @Path("/userInfo/{user}")
        @Produces(MediaType.APPLICATION_JSON)
        public void userInfoAsync(@Suspended AsyncResponse asyncResponse,
                                  @PathParam("user") String user) {

            CompletableFuture<GitHubUser> gitHubFuture =
                Futures.toCompletable(gitHubService.userAsync(user), executor);

            CompletableFuture<FacebookUser> facebookFuture =
                Futures.toCompletable(facebookService.userAsync(user), executor);

            gitHubFuture
                .thenCombine(facebookFuture, (g, f) -> new UserInfo(f, g))
                .thenApply(info -> asyncResponse.resume(info))
                .exceptionally(e -> asyncResponse.resume(
                    Response.status(INTERNAL_SERVER_ERROR).entity(e).build()));

            asyncResponse.setTimeout(1000, TimeUnit.MILLISECONDS);
            asyncResponse.setTimeoutHandler(ar -> ar.resume(
                Response.status(SERVICE_UNAVAILABLE).entity("Operation timed out").build()));
        }
    }

    //----------------------------------------------------------------------

    import java.util.concurrent.CompletableFuture;
    import java.util.concurrent.Executor;

    public class Futures {

        //transforms Future<T> to CompletableFuture<T>
        public static <T> CompletableFuture<T> toCompletable(Future<T> future, Executor executor) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    return future.get();
                } catch (InterruptedException | ExecutionException e) {
                    throw new RuntimeException(e);
                }
            }, executor);
        }
    }

```

You can process and combine as many `CompletableFutures` as you want.
Each of them can be a call to different external resource, like database, REST service or file system.
Let's see another example:

```java

    import javax.ws.rs.container.AsyncResponse;
    import javax.ws.rs.container.Suspended;
    import java.util.concurrent.CompletableFuture;

    @Path("/")
    public class AsyncResource {

        @GET
        @Path("/contributors/{user}")
        @Produces(MediaType.APPLICATION_JSON)
        public void contributorsAsync(@Suspended AsyncResponse asyncResponse,
                                      @PathParam("user") String user) {
            // get all user repos
            Futures.toCompletable(gitHubService.reposAsync(user), executor)

                // for all repos find contributors
                .thenCompose(repos -> getContributors(user, repos))

                // flat Stream<List<T>> to Stream<T>
                .thenApply(contributors -> contributors.flatMap(list -> list.stream()))

                // group contributors by login and count them
                .thenApply(contributors ->
                    contributors.collect(Collectors.groupingBy(c ->
                        c.getLogin(), Collectors.counting())))

                //resume response
                .thenApply(contributors ->
                    asyncResponse.resume(contributors))

                // handle exceptions
                .exceptionally(e ->
                    asyncResponse.resume(Response.status(INTERNAL_SERVER_ERROR).entity(e).build()));
        }

        private CompletableFuture<Stream<List<GitHubContributor>>> getContributors(
            String user, List<GitHubRepo> repos) {
            return Futures.sequence(
                repos.stream().map(r ->
                    Futures.toCompletable(gitHubService.contributorsAsync(user, r.getName()), executor)));
        }

    }

    //----------------------------------------------------------------------------------

    import java.util.concurrent.CompletableFuture;

    public class Futures {

        public static <T> CompletableFuture<Stream<T>> sequence(Stream<CompletableFuture<T>> futures) {
            List<CompletableFuture<T>> futureList = futures
                .filter(f -> f != null)
                .collect(Collectors.toList());

            CompletableFuture<Void> allDoneFuture =CompletableFuture.allOf(
                futureList.toArray(new CompletableFuture[futureList.size()]));

            return allDoneFuture.thenApply(v ->
                futureList.stream().map(future -> future.join()));
        }
    }

```

In the code above we get all repos for given users, and for each repo we count contributors. In this case
`CompletableFuture`s are processed like functions, and processing is still non-blocking. Complex blocks of code are extracted
to methods and code remains readable. But debugging and error handling in this code is more difficult.

## Summary

Asynchronous processing is more complicated than synchronous processing, but with new Java 8 features (streams,
lambda expressions and `CompletableFuture`) it looks similar to a functional processing of data. You can easily chain operations
and fetch result at the end of processing. Java 8 functional API is far from perfect but still allows writing more
expressive code than before. There is also a third party library: [RxJava](https://github.com/ReactiveX/RxJava)
that implements a concept called *reactive programming*. RxJava is defined as "a library for composing asynchronous
and event-based programs using observable sequences for the Java VM". In my opinion is more powerful and provides better,
more consistent API than standard Java 8. With asynchronous processing you can make your REST application more scalable:
both latency and throughput can be improved. To take full advantage clients with non-blocking IO should be used
(like [AsyncHttpClient](https://github.com/AsyncHttpClient/async-http-client) based on [Netty](http://netty.io/)).

Full  code is available on GitHub:  [Grizzly2](https://github.com/sbolimowski/grizzly-jersey-async)
and [Spring Boot](https://github.com/sbolimowski/springboot-jersey-async) examples.
