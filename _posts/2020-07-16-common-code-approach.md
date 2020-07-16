---
layout: post
title: "Common code approach: from rich libraries to rich environment"
author: piotr.betkier
tags: [java, architecture, commons, cloud, tool]
---

We run over 800 microservices in our on-premise and public clouds. They are developed by hundreds of engineers
in various technologies: from the most popular Java and Kotlin, through Scala, Clojure, Python, NodeJS, Golang, to 
less mainstream like Elixir or Swift. All these applications need to handle common 
technical concerns: logging, monitoring, service discovery, tracing, internationalization, security and more. 
How to provide common solutions to these requirements in such a heterogeneous setup? 
In this post I’m going to explain how we originally solved this problem with common libraries 
and how we are currently changing our runtime environment to make things even easier.

## Common libraries: solid, not perfect

Most of our services are JVM-based, so our common libraries for JVM are supported the most. 
We also have solutions for other technologies though. This approach has worked for us since 
around 2014, but has inherent problems that I describe in the next section, *The problem with common libraries*.

### JVM applications: a family of libraries

We have a family of libraries and each handles a specific technical concern, e.g. a library for metrics, 
a library for service discovery etc. These libraries are written in Java and can be integrated into 
any JVM-based application. We make sure that they:

* have a single responsibility,
* are technology agnostic (can be used regardless of the language and framework choice),
* have minimal dependencies,
* have clear APIs that rarely break compatibility.

Allegro engineers can integrate them into any JVM-based application in order to fulfill 
technical requirements. Still, it would be tedious to declare dependencies to all these 
libraries and configure them whenever you start a project. That’s why we also provide our 
internal Spring Boot starter which glues these libraries together, provides the default configuration 
and enables our engineers to have a quick start in the most common technology stack. Most of the applications 
are based on this Spring Boot starter, but it’s completely optional.

The libraries and the starter are maintained by a single team, so that there is a clear vision 
for their design & evolution. We want to make sure they fulfill our engineers’ needs, so the team 
gathers feedback and accepts a large number of contributions in the form of *internal open source*.

We believe we designed our common libraries ecosystem well and we shared our experiences at conferences. 
You may be interested in the 
[Growing Spring-based commons, lessons learned](https://www.youtube.com/watch?v=y6uFC_T_fcc) 
talk from Spring I/O 2017 to learn more.

### Non-JVM applications: microservice contract, internal open source

JVM applications are the majority, but we also run services written in Python, Go, NodeJS 
and many more technologies. That’s why we maintain a document called the microservice contract. 
It describes how a service must behave in order to integrate with our platform. It covers concerns such as:

* how to read configuration,
* what technical HTTP endpoints to expose, e.g. for health checks, diagnostics, build information and more,
* how to call other services,
* how to report logs and metrics,
* which headers to propagate in service calls.

Any application can run on our platform as long as it complies with the contract. 
The family of libraries for the JVM stack acts as its reference implementation.

There is no dedicated team developing tools for technologies like Python or NodeJS. 
However, engineers from various teams form communities that develop such tools as *internal open source* effort.

## The problem with common libraries

Even though we have an ecosystem of well-designed libraries and community support, 
this solution has stopped scaling for our 800+ microservices.

Since the common code is distributed as libraries, it’s our dozens of application teams 
that control when it’s getting deployed to production. It means that rolling out 
new mechanisms or bug fixes to production takes a lot of time. Completing migrations 
from one mechanism to another can take many months or even years, in the case of non-crucial migrations 
that we allow to happen organically. For important bug fixes, we need to find all the affected users 
and make sure they update quickly, letting others update at their own pace. This slows down the platform teams, 
because they need to maintain old mechanisms longer. It also slows down application teams, 
because calls to update library versions disrupt their work.

Rolling out changes to common code gets harder with every non-JVM technology stack we introduce. 
Important changes cause the microservice contract to get modified and necessitate changes in 
all the related libraries. This further slows down the adoption of new platform features. 
Also, the same mechanisms are implemented in many languages, so the risk of introducing bugs increases.

## Common code moved to the environment

In order to solve the problems described above we’ve been moving our common code
to the runtime environment. It means that our platform mechanisms become implemented 
in the form of technical services or processes, called sidecars, running along with the applications. 
Platform mechanisms distributed in such a model are implemented in one place by one of the platform teams, 
so they are available faster and with fewer bugs. Also, their rollouts are controlled by a single party, 
so migrations are quicker and require less effort of the application engineers.

This shift started a couple of years ago and we keep on migrating next parts of the platform.

### Examples

Let’s take a look at a couple of examples of how we moved parts of the common code to the environment.

We keep our applications’ configurations in secure Git repositories and have a Configuration Service
that exposes them through a secured REST API. This way we get an auditable configuration as code solution 
that is independent from the runtime environment. We’ve been using it for many years and continue to do so. 
However, we used to require all applications to make an HTTP call to Configuration Service at startup 
to read the configuration. Applications had to present valid certificates so that Configuration Service 
could authorize access. Now, we make sure the deployment process reads the configuration and puts it 
in a certain file or environment variable that is available to the application. 
Applications no longer have to integrate with Configuration Service API or manage certificates.

When it comes to monitoring, we used [Graphite](https://graphiteapp.org/) and [StatsD](https://github.com/statsd/statsd) to directly report metrics. 
Applications had to be aware of the correct host and port to their metrics backend. Also, they had to make sure they 
properly encoded instance metadata – datacenter, host, port, service name – in their metric names 
according to the microservices contract. After introducing [Prometheus](https://prometheus.io/) as our metrics backend 
things became much easier. All the applications have to do now is to expose their metrics in the Prometheus format 
on a specific HTTP endpoint. Prometheus pulls these metrics from all the running instances 
and enriches them with proper instance metadata.

Lastly, let’s consider service discovery – load-balancing traffic to called services. 
We used to have libraries that provided and selected service instances, i.e. client-side load balancing. 
These libraries would cache a subset of our [Consul](https://www.consul.io/) service registry state 
and allow picking an instance according to our load-balancing algorithm. These libraries had to be implemented 
in all the technology stacks – JVM languages, Python, NodeJS and more – increasing the risk of bugs. 
Any changes to our load-balancing algorithm would rollout slowly, due to necessary dependency updates 
in our microservices. Instead, we’ve now revolutionized our service discovery by introducing 
[Service Mesh](https://www.infoq.com/articles/service-mesh-ultimate-guide/). 
Each application instance now deploys with a proxy sidecar that is responsible for load-balancing 
outbound traffic to services. Application code no longer contains Consul integration or load-balancing algorithms. 
Also, now that all the matters of traffic between services are controlled by a single team, 
we can introduce new platform features much more easily. If you’re interested in Service Mesh, learn more about our story 
from a thorough [Migrating to Service Mesh](https://allegro.tech/2020/05/migrating-to-service-mesh.html) post.

### Effects

Moving the common code to the environment allows us to introduce new technology stacks with less effort, 
because it’s easier to fulfill the microservice contract. It’s also easier to keep remaining 
common libraries and frameworks up to date in our services, because they now contain less code and fewer dependencies.

Service Mesh in particular has enabled us to provide new features related to service-to-service traffic 
which otherwise would’ve been hard to introduce. Last year we switched from HTTP/1 to HTTP/2 protocol 
in communication between services to reduce resource consumption. It took us a month to implement and deploy 
the change to production. If we still had been managing traffic in the application code, such change would've 
likely required coordination with dozens of teams and a migration effort of about a year. Also, managing traffic 
in sidecar proxies currently allows us to unify the permissions mechanism for service-to-service communication 
and remove troublesome [mTLS](https://en.wikipedia.org/wiki/Mutual_authentication) logic out of the libraries and application code.
There are multiple other areas we can enhance in the future thanks to managing traffic in a single place.

Lastly, we’re running our applications in an increasingly heterogeneous environment: 
Mesos & Marathon on-premise cloud, Kubernetes on-premise cloud, Google Kubernetes Engine public cloud, 
Azure Kubernetes Service public cloud and a bit of classic VMs managed by the application teams. 
Keeping platform code in the environment allows us to more easily maintain consistent platform mechanisms 
across these runtimes. Our runtime platforms aim to have the same APIs and behaviours even though these 
are often implemented differently under the hood. This way application code doesn’t change regardless of 
where the application is deployed. Our application engineers can then focus on the business logic instead of platform peculiarities.

## Conclusion

We’ve come a long way establishing a rich library ecosystem around 6 years ago and in recent years 
moving the platform logic into our runtime environment. Common libraries and frameworks based on 
open source projects like Spring are going to stay with us nonetheless. They are still convenient and 
provide good defaults, but now they contain less and less platform logic.

This continuing shift to a rich runtime environment allows us to introduce new platform features faster 
and with less distraction to our hundreds of application engineers. Maintaining these features is also cheaper, 
because a single team is responsible for development and rollouts in a given technical domain. 
Developing technical services and sidecar processes may seem more costly than simply writing library code 
and it is when the organization’s scale is small. At our scale though such approach gives a productivity multiplier 
that pays off in the end.

