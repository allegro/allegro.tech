---
layout: post
title: Increasing Capacity and improving Resilience with asynchronous request processing, part I
author: bartosz.walacik
tags: [java, capacity, resilience, NIO, undertow]
---

There are two parts of this article. In first we define
what is *Capacity* (maximum load) and *Resilience* (fault tolerance) of a typical e-commerce site.

Then we show how classical approach to request processing
(often referred as thread-per-socket) can badly affect your site *Capacity* and *Resilience*.

In the second part we explain the new approach to request processing called
*asynchronous* or some times *non-blocking*. We show how it can help you to keep your production stable.

Example implementations for <code>Tomcat</code> and <code>Undertow</code> are shown in the second part.

## Use case - typical e-commerce site
Let's assume, you created e-commerce site, and now you are working on the new search feature.
The scenario you are to develop is simple:

* user types a query in a search box and fires an http request
* application server receives the request and queries a database server
* the database server does some hard work to calculate result set
* application server renders resulting data as JSON
* and sends an http response back to the user's browser

Having development done, you deploy the system on the test environment and start playing with performance tests.

After the first test, it turns out that the client receives a response in less then 500ms.
Most of the time, your application server is waiting for the database server.
After the data arrives, response is rendered fairly quickly.

Then you fire a load test, and it occurs, that your system performs well only when hit by less then 40 requests per second (RPS).
Beyond that limit, an average request processing time extends to 600ms and more.

Let's say that  your database server is an old good SQL which doesn't perform
very well under heavy load. It's not easy to scale up here.
You point at the database as a bottleneck,
because it starts to have troubles when asked to handle more than 20 concurrent sessions.

So far so good.
Since the database is a bottleneck it doesn't really mater how good are you in request processing and how many
application servers you spawn in your cluster.
You still can promise to your stakeholders 40 RPS on production with latency around 500ms

If this is ok for them, your job is done. Really? Let's talk about *Capacity* and *Resilience*

## Capacity and Resilience
Michael T. Nygard (author of 'Release It', a must-read),
defines *Capacity* as a maximum amount of work that system can do in the unit of time
with acceptable latency. In our case:

    Capacity = 40 RPS with 95% request processed in less than 500ms

What about the *Resilience*? It can't be easily measured, Michael T. Nygard describes Resilience as a system feature.
Resilience means fault tolerance. Resilient system is composed of loosely coupled parts.
When the failure occurs in one part it isn't propagated to another parts.
So one failure can't knock down the entire system. Of course some features will stop to work but the others should work normally.

## Resilience in classical Java Servlet approach
What about our use case? Is this system Resilient? If you have chosen classical <code>Java Servlet</code> approach
(sometimes referred as thread-per-socket), the answer is simple. No.

Let's consider one part of your system: users.
On the test environment all the network connections are fast, but on production, some people could connect via poor WiFi or just
slow mobile networks.

What happens to the system if some of your users suffers from *slow connections*?

### Slow Connections with users
Users are often the least tested part of the system and they like to cause troubles.
In this case we focus only on legitimate users,
and don't worry about those guys who wants to DDOS you.

We often think that all users use broadband internet connections but that's not that simple.
Consider what happens when they go to the airport, connect their smartfons to WiFi
(probably all to the same WLAN router) and start to use your search feature.
The other group can connect through a slow mobile networks and also start to click.

Suddenly it occurs, that network transport becomes a new bottleneck in our system.
For those mobile guys, the last step in our scenario *'sending response back'*,
will take ages.
OK, let's say 10 seconds instead of 10 milliseconds you have in the test environment.
They will receive responses but very slowly and it won't be even your fault but their networks are to blame.

In the classical Java Servlet approach, every active TCP/IP connections is bound to exactly one
<code>http thread</code>. It means, that each request from mobile guy, allocates one http thread for around 10 seconds.
So your http thread pool saturates soon. All the new http request will be queued, waiting for an idle thread.
ed.
In the meantime, some of your mobile friends becomes angry. They start to click a Search button several times.
Who wants to wait that long? It means even more request to be served.
Nice users with broadband connections could also get nervous because their requests are also queued.

Can it be worse? Yes, overloaded application server will stop responding for the http **health checks** from a load balancer,
which could decide to kick it off from the cluster.
It means even more requests for the remaining servers and inevitable disaster.

You can end up in the situation where the entire system is completely knocked down because of the slow connections with mobile guys.
The funny thing is, that all of your servers are still almost idle.
Most of the http threads do nothing (the worst thing a thread can do)
but waiting to send an another network packet via slow TCP connections.

Your CTO calls to you, asks what's going on and gives you a very boring lecture about a mission critical systems
and how much money company will loose per every second of a system unavailability.

But don't worry! There is a smart way to make your system resistant to *Slow Connections*.
It's an *Asynchronous approach to requests processing*.

## Capacity in classical Java Servlet approach
Lets talk about Capacity in our use case. 40 RPS is nothing impressive these days. What if your stakeholders require
thousands? First thing you could do easily it to eliminate an obvious bottleneck.
The old good SQL database can be replaced with something modern, fancy and scalable,
for example <code>SolrCloud</code>.

When you perform another round of the load test, you realize that next capacity bottleneck is the http thread pool.
Tomcat defaults its pool size to 200.
It could be extended, but every thread costs a lot of resources, memory for the stack and CPU time for switching.
You can always add more servers to the cluster, but still, the overall capacity is limited by the size of the http thread pools.

The most elegant way to cope with this problem (without buying more servers) could be,
once again, asynchronous requests processing backed by NIO.

Although NIO & async is a good way to increase Capacity, its not a silver bullet.
Under a very heavy load, let's say thousands of concurrently open TCP connections per host,
you may encounter another bottlenecks.

For example linux system is likely to throw <code>Too Many Open Files</code> Error
because each active TCP socket means one open file descriptor.
Default limits for open files are sometimes quite low, for example only 1000 per process.

In the second part of this article we explain how *asynchronous requests processing* works
and we show the example implementations for <code>Tomcat</code> and <code>Undertow</code> servers.




