---
layout: post
title: Mesos Executⁱoₙₑr
author: [tomasz.janiszewski, adam.medzinski]
tags: [tech, mesos, marathon, mesosphere]
publish: true
---

[Apache Mesos](http://mesos.apache.org/) is an open-source project to manage computer clusters. In this
article we present one of its components called Executor and more specifically
the Custom Executor. We also tell you why you should consider writing your own
executor by giving examples of features that you can benefit from by taking
more control of how tasks are executed. Our executor implementation is
available at https://github.com/allegro/mesos-executor

**TL;DR**
Apache Mesos is a great tool but to achieve truly cloud native
platform for microservices you need to make your hands dirty and
write custom integrations with your ecosystem.

[*If you are familiar with Apache Mesos skip introduction*](#custom-executor)

## Apache Mesos


> [“Sixty-four cores or 128 cores on a single chip look a lot like 64 machines or 128 machines in a data center.” – Ben Hindman](https://www.wired.com/2013/03/google-borg-twitter-mesos/)


Apache Mesos is a tool to abstract your data center resources. In contrast to
many container orchestrators such as Kubernetes, Nomad or Swarm, Mesos makes
use of two-level scheduling. This means Mesos is responsible only for offering
resources to higher level applications called frameworks or schedulers. It’s
up to a framework if it accepts an offer or declines it.


Mesos development originates at Berkeley University. The idea was not totally
new. Google already had a similar system called [Borg](https://research.google.com/pubs/pub43438.html) for some time. Rapid
development of Mesos started when one of its creators – Ben Hindman gave a
talk at Twitter presenting Mesos - then development got a boost. Twitter
employed Ben and decided to use Mesos as a resource management system and to
build a dedicated framework – [Aurora](http://aurora.apache.org/). Both projects were donated to Apache
foundation and became top level projects.


Currently Mesos is used [by many companies including](http://mesos.apache.org/documentation/latest/powered-by-mesos/) Allegro, Apple, Twitter,
Alibaba and others.

## Mesos Architecture

A Mesos Cluster is built out of 3 main elements: Masters, Agents and Frameworks

![Mesos Architecture](/img/articles/2018-01-01-mesos_executor/mesos_architecture.png){: .center-image }


### Masters
A Mesos Master is the brain of the whole datacenter. It controls the state of a
whole cluster. Receives resource information from agents and presents those
resources to a framework as an offer. The Master is a communication hub between
a framework and its tasks. At once only one Master is acting as a leader, other
instances are in a standby mode. Zookeeper is used to elect this leader and
notifies all instances when the leader abdicates.

### Agents
Agents are responsible for running tasks and monitoring their state. Agents
present resources to the master. They also receive launch and kill task
requests. Agents notify the Master when a task changes its state (for example
fails).

### Frameworks
Frameworks (aka schedulers) are not a part of Mesos. It’s a custom
implementation of business logic. The most known frameworks are container
orchestrators such as Google Kubernetes, Mesosphere Marathon and Apache Aurora.
Frameworks receive resource offers from the Master and based on custom
scheduling logic decide whether to launch a task with given resources. There
could be multiple frameworks running at once. Each of them can have a different
scheduling policy and a different purpose. This gives Mesos an ability to
maximize resource usage by sharing same resources between different workloads.
For example: batch jobs (e.g. Hadoop, Spark), stateless services, continuous
integration (e.g., Jenkins), databases and caches (e.g., Arango, Cassandra,
Redis).


Beside those big elements, there are also smaller parts of the whole
architecture. One of them are executors.

### Executor

Executor is a process that is launched on agent nodes to run the framework’s
tasks. Executor is started by a Mesos Agent and subscribes to it to get tasks
to launch. A single executor can launch multiple tasks. Communication between
executors and agents is via [Mesos HTTP
API](http://mesos.apache.org/documentation/latest/executor-http-api/). Executor
notifies an Agent about task state by sending task status information. Then, in
turn, the Agent notifies the framework about the task state change. The
Executor can perform health checks and any other operations required by a
framework to run a task.


There are 4 types of executors:

* Command Executor – Speaks V0 API and is capable of running only a single
task.
* Docker Executor – Similar to command executor but launches a docker
container instead of a command.
* Default Executor – Introduced in Mesos 1.0 release. Similar to command
executor but speaks V1 API and is capable of running pods (aka task groups).
* Custom Executor – Above executors are built into Mesos. A custom executor
is written by a user to handle custom workloads. It can use V0 or V1 API and
can run single or multiple tasks depending on implementation. In this article
we are focusing on our custom implementation and what we achieved with it. This
executor is used for example by Hadoop or MPI.


<div class="i-wrapper"><div>
<iframe height="315"  width="420" src="https://www.youtube.com/embed/tzaYXgnYKyQ" frameborder="0" allowfullscreen></iframe>
</div></div>

## Why do we need a custom executor? <a name="custom-executor"></a>

At Allegro we are using Mesos and Marathon as a platform to deploy our
microservices. Currently we have nearly 600 services running on Mesos. For
service discovery we are using [Consul](https://www.consul.io/). Some services are exposed to the public
and some are hidden by load balancers
([F5](https://f5.com/glossary/load-balancer),
[HAproxy](http://www.haproxy.org/),
[Nginx](https://www.nginx.com/)) or cache
([Varnish](https://varnish-cache.org/)).

At Allegro we try to follow the
[12 Factor App Manifesto](https://12factor.net/).This document defines
how cloud native application should behave and interact with environments they
run on to be deployable in a cloud environment. Below we will present how we
achieve 3 out of 12 factors with the custom executor.

## Allegro Mesos Executor

### III. Config – Store config in the environment

> [The twelve-factor app stores config in environment variables (often shortened to env vars or env). Env vars are easy to change between deploys without changing any code; unlike config files, there is little chance of them being checked into the code repo accidentally; and unlike custom config files, or other config mechanisms such as Java System Properties, they are a language- and OS-agnostic standard.](https://12factor.net/config)

With a custom executor we are able to place na apps configuration in it’s
environment. Executor is not required in this process and could be replaced
with [Mesos Modules](http://mesos.apache.org/documentation/latest/modules/) but it’s easier for us to maintain our Executor than a
module (a C++ shared library). Configuration is kept in our Configuration
Service backed by [Vault](https://www.vaultproject.io/).
When the executor starts, it connects to configuration
service and downloads configuration for a specified application. Config Service
stores encrypted configurations. Authentication, by necessity, is performed
with a certificate generated by a dedicated mesos module that was written years
ago and convinced us we do not want to keep any logic there. The certificate is
signed by an internal authority. Below picture presents how communication looks
like in our installation. Mesos Agent obtains signed certificate from CA
([certificate authority](https://en.wikipedia.org/wiki/Certificate_authority)) and passes it to the executor in an environment
variable. Previously,  every application had a dedicated logic of reading this
certificate and downloading it’s configuration from Configuration Service.
Now this logic is replaced by our executor that by using the certificate to
authenticate, is able to download the decrypted configuration and pass it in
environment variables to the task that is launched.

![Config](/img/articles/2018-01-01-mesos_executor/config.svg){: .center-image }

### IX. Disposability – Maximize robustness with fast startup and graceful
shutdown

> [Processes shut down gracefully when they receive a SIGTERM signal from the
process manager.](https://12factor.net/disposability)

Although the Mesos Command Executor supports graceful shutdown in configuration
it does not work properly with shell commands (see
[MESOS-6933](https://issues.apache.org/jira/browse/MESOS-6933)).


![Lifecycle](/img/articles/2018-01-01-mesos_executor/lifecycle.svg){: .center-image }

Above diagram presents the life cycle of a typical task. At the beginning
it’s binaries are fetched and the executor is started (1). After start, the
executor can perform some hooks (for example to load configuration from
configuration service) then it starts the task and immediately starts health
checking it (2).  Our applications are plugged into discovery service (Consul),
load balancers (F5, Nginx, HAProxy) and caches (Varnish) when they start
answering the health check (3). When the instance is killed, it is first
unregistered from all services (4) then
[SIGTERM](https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html) is sent and finally (if the
instance is still running) it receives a
[SIGKILL](https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html) (5). This approach gives us
nearly 0 downtime at deployment and could not be achieved without a custom
executor. Below you can see a comparison of a sample application launched and
restarted with and without our executor’s graceful shutdown feature. We
deployed this application with our executor at 15:33 (first peak) and restarted
it 3 times (there are some errors but less then before). Then we rolled back to
the default command executor and restarted it a couple of times (more errors).
Errors are not equal 0 due to missing cache warmup at start, but we seen a huge
reduction of errors during deployments.


![Opbox](/img/articles/2018-01-01-mesos_executor/opbox.png){: .center-image }

What’s more, with this approach we can notify the user that an external
service errored using [Task State Reson](http://mesos.apache.org/documentation/latest/task-state-reasons/), so details are visible for end
user. Accidentally by implementing custom health checks and notifications we
avoided [MESOS-6790](https://issues.apache.org/jira/browse/MESOS-6790)

### XI. Logs – Treat logs as event streams


> [A twelve-factor app never concerns itself with routing or storage of its
output stream. It should not attempt to write to or manage logfiles. Instead,
each running process writes its event stream, unbuffered, to stdout. During
local development, the developer will view this stream in the foreground of
their terminal to observe the app’s behavior.](https://12factor.net/logs)

Command executor redirect [standard streams](https://en.wikipedia.org/wiki/Standard_streams)
to stdout/stderr files. In our case we want to push
logs into ELK stack. In Task definition we have all metadata about task (host,
name, id, e.t.c) so we can enhance log line and push it further. Logs are
generated in [key-value format](https://blog.codeship.com/logfmt-a-log-format-thats-easy-to-read-and-write)
that is easy to parse and read by both human and
machine. This allow us to easily index fields and reducing cost of
parsing JSONs by the application. Whole integration it done by executor.

## What could be improved

Mesos provides an old-fashioned way to extend its functionality - we have to
write our own
[shared library](http://tldp.org/HOWTO/Program-Library-HOWTO/shared-libraries.html)
in C++ (see Mesos Modules for more information).
This solution has its advantages, but this approach also significantly
increases the time needed for development and enforces the use of technology
that is not currently used in our company. Additionally, errors in our code
could propagate to the Mesos agent, possibly causing it to crash. We do not
want to go back to the times of segmentation fault errors causing service
failures. A more modern solution based on [Google Protobuf](https://developers.google.com/protocol-buffers/), that is already used
by Mesos, would be appreciated. Finally upgrading Mesos often required us to
recompile all modules, thus maintaining different binaries for different Mesos
versions

![.so](/img/articles/2018-01-01-mesos_executor/shared.jpg){: .center-image }




A lot of solutions for Mesos are maintaining their own executor because other
integration methods are not as flexible as it is, for example:
* Apache Aurora

  > [Aurora executor (a.k.a. Thermos executor) is responsible for carrying out the workloads described in the Aurora DSL (.aurora files). The executor is what actually executes user processes. It will also perform health checking of tasks and register tasks in ZooKeeper for the purposes of dynamic service discovery.](http://aurora.apache.org/documentation/latest/getting-started/overview/)

* Singularity

  > [The Singularity executor provides some advanced (configurable) features: Custom Fetcher, Log Rotation,
Task Sandbox Cleanup,Graceful Task Killing, Environment Setup, Runner Script](https://github.com/HubSpot/Singularity/blob/logfetch-0.29.3/Docs/about/how-it-works.md#singularity-executor)

* go-mesos-executor

  > [Container Apache Mesos executor written in Go. It actually can launch Docker containers but is designed to accept others container engines as soon as they implement the containerizer interface. The particuliarity of this executor is the fact that it can use hooks to do actions at some container life steps.](https://github.com/Devatoria/go-mesos-executor)


We also made a mistake by putting our service integration logic directly into
the executor binary. As a result, the integration code become tightly coupled
with Mesos specific code, making it significantly more difficult to use it in
other places - e.g. Kubernetes. We are in the process of separating this code
into stand-alone binaries.

![.so](/img/articles/2018-01-01-mesos_executor/glue.jpg){: .center-image }


## Comparison with other solutions (read [K8s](https://kubernetes.io/))

Kubernetes provides a more convenient way to integrate your services with it.
[Container Lifecycle Hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)
allow you to define an executable or HTTP endpoint
which will be called during life cycle events of the container. This approach
allows the use of any technology to create integration with other services and
reduces the risk of tight coupling the code with a specific platform. In
addition, we have a built-in [graceful shutdown mechanism](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) integrated with the
hooks, which ultimately eliminates the need to have the equivalent of our
custom Mesos executor on this platform.

## Conclusion

Mesos is totally customizable and able to handle all edge cases but sometimes
it’s really expensive in terms of time, maintainability and stability.
Sometimes it’s better to use solutions that work out of the box instead of reinventing the wheel.

<div class="i-wrapper"><div>
<iframe height="315"  width="420" src="https://www.youtube.com/embed/Zm5RgED_1gM" frameborder="0" allowfullscreen></iframe>
</div></div>
