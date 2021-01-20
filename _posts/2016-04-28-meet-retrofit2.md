---
layout: post
title: Meet Retrofit2
author: rafal.glowinski
tags: [java, rxjava, rest, async rest, asynchronous rest, retrofit2, okhttp, http client]
---

In this post I will introduce to you a recently released version of a well known library for consuming RESTful services — [Retrofit2](http://square.github.io/retrofit/). 
Even though it is mainly targeted at Android platform it works very well on the “server” Java. Its lightness and low garbage generation 
overhead make it an interesting option if one does not like existing solutions (like [Jersey Client](https://jersey.java.net/documentation/latest/client.html), 
or Spring’s [RestTemplate](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html)). I will also 
show how to configure it properly and fully utilize its great [RxJava](https://github.com/ReactiveX/RxJava/wiki) compatibility. 

## Retrofit2 

I code mostly in Java and recently also in Kotlin. I began my adventure with consuming RESTful services using Jersey Client. 
It worked just fine (although there are a few things that I don’t like about Jersey) but I felt that using Jersey on Spring Framework is a 
bit silly since there already is support for consuming REST resources in Spring: RestTemplate & [AsyncRestTemplate](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/client/AsyncRestTemplate.html) and so I switched.

After a while I noticed my increased frustration with (Async)RestTemplate. Mostly it was the API that I started to dislike. First of all: 
why have two separate classes that need a completely different setup? When it comes to sync/async calls I liked Jersey’s approach much better. 
There are also these tiny bits like for example: why is there no version of `getForEntity` method that accepts headers? Last but definitely 
not least: no support for [Reactive Programming](http://reactivex.io/) - methods of AsyncRestTemplate class return instances of 
[ListenableFuture](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/util/concurrent/ListenableFuture.html) class that have to be converted to an instance of [rx.Observable](http://reactivex.io/RxJava/javadoc/rx/Observable.html). Not the most useful.

I started to look for a new way to consume RESTful services. My perfect client would have to be lightweight, easy to use and extend, support 
RxJava out of the box and have support for HTTP/2. And I think I found one just like that!

[Retrofit2](http://square.github.io/retrofit/) uses [OkHttp3](http://square.github.io/okhttp/) client - both of them are actively 
developed and maintained by Square company. While both of these libraries are targeted at Android and mobile development, they work equally 
well with server-side Java. OkHttp3 fully supports HTTP/2!

## Retrofit2 - how to start

There is a [decent manual](http://square.github.io/retrofit/) available on Square’s Github page which should be enough to start but I will 
provide you with some code snippets as well.

### Dependencies

In all of the examples I will be using following dependencies (shown here in Gradle format):

```
group: 'com.squareup.okhttp3', name: 'okhttp', version: '3.2.0'
group: 'com.squareup.okhttp3', name: 'logging-interceptor', version: '3.2.0'
group: 'com.squareup.retrofit2', name: 'retrofit', version: '2.0.2'
group: 'com.squareup.retrofit2', name: 'converter-jackson', version: '2.0.2'
group: 'com.squareup.retrofit2', name: 'adapter-rxjava', version: '2.0.2'
```

### OkHttp3

In order to use Retrofit2 you need to have an instance of OkHttp3 client. The easiest way is just to call:

```
import okhttp3.OkHttpClient;

OkHttpClient httpClient = new OkHttpClient.Builder().build();
```

This will construct a client with all the timeouts, connections pools, etc. set to default values. However, I strongly discourage you from 
using any defaults you don’t have control over, in production. You should use the builder class more extensively and define at least values for 
timeouts and connection pool properties:

```
import okhttp3.ConnectionPool;
import okhttp3.OkHttpClient;

ConnectionPool connectionPool = new ConnectionPool(5, 60, TimeUnit.SECONDS);

OkHttpClient httpClient = new OkHttpClient.Builder()
        .connectTimeout(100, TimeUnit.MILLISECONDS)
        .readTimeout(500, TimeUnit.MILLISECONDS)
        .connectionPool(connectionPool)
        .retryOnConnectionFailure(true);
```

In the example above I created a new Http Connection Pool with maximum number of idle connections set to 5 and decided that idle connections 
should be removed from the pool after 60 seconds of inactivity. I also defined socket’s connect and read timeouts and asked OkHttp to 
automatically retry whenever one of three network problems occurs (unreachable IP address, stale pooled connection, unreachable proxy server).

### Retrofit2

Since I already have an instance of OkHttpClient, I can create my first Retrofit2 client. In order to do that I have to define an interface that 
specifies all the operations I want to use. Assuming we have a simple User Details service that can return information about a user, the 
interface could look like this:

```
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Headers;
import retrofit2.http.Path;

interface UserDetailsClientApi {

    @Headers({
        "Accept: application/json"
    })
    @GET("users/{userId}")    
    Call<ResponseBody> findUserDetailsById(@Path("userId") String userId);
}
```

Now, having the API defined, I can finally create an instance of Retrofit2 client:

```
import retrofit2.Retrofit;

Retrofit retrofit = new Retrofit.Builder()
        .baseUrl("http://user-details-service:8080/")
        .client(httpClient)
        .build();

UserDetailsClientApi client = retrofit.create(UserDetailsClientApi.class);
```

So what happens above is: I create a new instance of Retrofit2 and use it to create an instance of the client. Retrofit2 then generates the entire 
body of my client using only metadata that I have provided using annotations. Pretty cool and time saving. Notice that in order for Retrofit2 to suppport JSON to POJO conversion you have to add a converter factory. Retrofit2 supports the most popular libraries like: 
[Jackson](https://github.com/FasterXML/jackson), [GSON](https://github.com/google/gson) or even [Protobuf](https://github.com/google/protobuf). 
If you don’t provide any converters then Retrofit2 will only allow you to define ResponseBody as your method’s return type.

Ok, I have the instance of my client - what next? Well, now (unlike with (Async)RestTemplate) you can just peform the call synchronously or 
asynchronously without much difference:

```
// sync call
Response<ResponseBody> body = client.execute()

// async call
client.enqueue(new Callback<ResponseBody>() {
    @Override
    public void onResponse(Call<Traits> call, Response<ResponseBody> response) {
        // empty stub - fill me!
    }

    @Override
    public void onFailure(Call<ResponseBody> call, Throwable t) {
        // empty stub - fill me!
    }
});
```

And this is basically it when it comes to simple calls to RESTful services. Now is the time to do some more interesting things.

## Logging

It is a very common need to log the HTTP content sent/received over the wire. In some libraries this feature is implemented in a developer-friendly way, 
while others make it a real struggle to achieve the same result. OkHttp3 is one of the friendliest libraries I have ever seen. All you have to do is:

- add the dependency: `com.squareup.okhttp3:logging-interceptor`,
- create an instance of `HttpLoggingInterceptor`,
- then use it during construction of `OkHttpClient`.

An important thing to mention is that by default, `HttpLoggingInterceptor` will log to stdout. So if you want to write logs to a particular logger 
then you will need a tiny additional class that will redirect logging messages to a Logger of your choosing:


```
public class OkHttpLogger implements HttpLoggingInterceptor.Logger {

    private static final Logger logger = LoggerFactory.getLogger(OkHttpLogger.class);

    @Override
    public void log(String message) {
        logger.info(message);
    }
}

HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor(new OkHttpLogger());
loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

OkHttpClient httpClient = new OkHttpClient.Builder()
        ...
        .addInterceptor(loggingInterceptor)
        ...
        .retryOnConnectionFailure(true);
```

I am sure you have already noticed the call to `setLevel(HttpLoggingInterceptor.Level.BODY)` method. OkHttp3 can produce logs at 4 different detail levels:

* NONE — no logs,
* BASIC — logs request and response lines + total request time (in milliseconds) and number of bytes sent / received,
* HEADERS — all of the above + request/response headers,
* BODY — all of the above + request/response bodies (if present).

If you need something different, just take a look at the sources of [HttpLoggingInterceptor](https://github.com/square/okhttp/tree/master/okhttp-logging-interceptor) 
class for some hints to get you started and write your own logger! 

One final word of caution: if you want to log full request headers then remember that it could possibly leak sensitive information like “Authorization” 
header. This is exactly a case where you could consider writing your own Logger that would simply omit such headers completely.

## RxJava

Support for RxJava comes bundled in Retrofit2. Before you use it, you will have to add an additional dependency: `com.squareup.retrofit2:adapter-rxjava:2.0.1`. 
Once it is present on the classpath, register a special call adapter factory when building an instance of Retrofit2:

```
Retrofit retrofit = new Retrofit.Builder()
        .baseUrl("http://user-details-service:8080/")
        .client(httpClient)
        .addCallAdapterFactory(RxJavaCallAdapterFactory.create())
        .build();
```

With `RxJavaCallAdapterFactory` adapter factory registered, my API’s method can return `rx.Single` and `rx.Observable` and so my API definition becomes:

```
import rx.Single;

interface UserDetailsClientApi {

    @Headers({
        "Accept: application/json"
    })
    @GET("users/{userId}")    
    Single<ResponseBody> findUserDetailsById(@Path("userId") String userId);
}
```

Now instead of calling `enqueue(Callback<T> callback)` method to perform an asynchronous call, I can just get the `rx.Single` and subscribe to it:

```
UserDetailsClientApi client = retrofit.create(UserDetailsClientApi.class);

Single<ResponseBody> single = client.findUserDetailsById("user-id");
single.subscribe(...)
```

In fact, it is a regular `rx.Single` so we can basically do anything that is possible with the RxJava API. Simple, yet so powerful!

### Timeouts

When using RxJava Adapter for Retrofit2 you may want to use Rx `timeout` operator instead of the `OkHttpClient` based timeouts. The adapter is pretty 
smart and will try to cancel in-flight requests when subscriber unsubscribes. This way, we can define per-operation timeouts instead of a global timeout 
for all requests. Just remember that it is still a good practice to set a maximum read timeout on the instance of `OkHttpClient` so that no ill-behaved 
user of such `OkHttpInstance` can make it unusable by executing long running requests.

## Final thoughts

I have been using Retrofit2 for a couple of months now and it works very well on production. I love the API, RxJava integration and relatively few dependencies. 
I am certain that I am going to use it in other projects as well and I do encourage you to give it a try and to share your thoughts in comments. 
