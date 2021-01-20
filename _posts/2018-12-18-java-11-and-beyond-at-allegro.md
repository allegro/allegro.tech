---
layout: post
title: Java 11 and beyond at Allegro
author: adam.dubiel
tags: [java]
---

Since the beginning of my career as a Java developer, keeping up to date with Java was fairly straightforward.
Big releases came every few years, causing a bit of mayhem in tooling, IDEs and job interview questions.
However with each release there was a lot of time to adjust and migrate to newer versions.
With Java 9 things have changed. The so called [new release cadence](https://blogs.oracle.com/java-platform-group/update-and-faq-on-the-java-se-release-cadence)
was announced by Oracle.
Instead of releasing a new major version each few years, we will get one every half year.
This poses a lot of challenges to companies using Java in production, developers and the community as a whole.

At Allegro we are running a lot of technologies in production with the “right tool for the right job” mindset.
Still, roughly 90% of our 800+ business microservices are running on the Java Virtual Machine, be it pure Java or Kotlin (or Scala or even Clojure).
Thus, we had to come up with a strategy on how to embrace the new release cadence and not end up with a fragmented
environment with multiple versions of Java.

Below you can find our general approach and upgrade process.
Mind that centralized Java versions management is possible because of how we run our infrastructure.
All microservices run on our in-house Platform-as-a-Service based on Mesos and Marathon.
Resources like CPU and memory and recently also Java version, are specified declaratively in a deployment descriptor.
This, in short, enables our ops teams to [treat microservices like cattle, not like pets](http://cloudscaling.com/blog/cloud-computing/the-history-of-pets-vs-cattle/).

## Background

### In the old days

Java 8 was released in 2014 and will be supported till January 2019.
Under the hood there were so called feature and patch releases, however no new major language features were added.
This contributed to the psychological effect of having single Java version for 5 years.

### New approach

Starting from Java 9 new major versions of Java are released every six months.
Each new release is to be followed by up to two patch releases.
Contrary to previous beliefs, there are no official LTS (Long Term Support)
releases, e.g. with the release of Java 10, Java 9 is no longer supported by Oracle.

Additional reading:
* [Stephen Colebourne — Java release chains — Splitting features from security](https://blog.joda.org/2018/09/java-release-chains-features-and-security.html)

### Is Java still free?

New releases of Java have very short lifespan.
However Oracle offers paid support, including additional patches for certain versions of Java.
Java 11 is one of those versions. This created a lot of confusion and a new question rose: is Java still free?
Up to this date most people when saying Java meant Oracle JDK builds.
Recently a lot of effort was put to show and communicate,
that there are other builds of JDK which will be patched and built by the community.

### Java sources vs Java packages

Up to Java 11 Oracle had its own fork of OpenJDK repository with additional “secret sauce” (e.g. FlightRecorder).
So an imaginary process to create a JDK 8 distribution package from sources could look like:

* clone OpenJDK
* apply “secret sauce”
* compile and pass compatibility tests ([Technology Compatibility Kit](https://en.wikipedia.org/wiki/Technology_Compatibility_Kit) — TCK or JCK)
* build & publish package

Starting from Java 11 Oracle public builds will solely rely on OpenJDK sources:

* clone OpenJDK
* compile and pass TCK
* build & publish package

Oracle will only release (at most?) two packages: Java 11.0.1 and Java 11.0.2.
And afterwards Java 12 will replace Java 11.

However there is hope. Other companies like
[RedHat](https://developers.redhat.com/blog/2018/09/24/the-future-of-java-and-openjdk-updates-without-oracle-support/)
and [Azul](https://www.azul.com/eliminating-java-update-confusion/) committed to pushing security
patches to selected releases of Java.

So there will not be an official, publicly and freely available LTS release backed by Oracle.
But there will be de-facto LTS releases backed by the community.
RedHat, Azul and AdoptOpenJDK, among many others, will provide packaged builds.

Additional reading:
* [Stephen Colebourne - Time to look beyond Oracle’s JDK](https://blog.joda.org/2018/09/time-to-look-beyond-oracles-jdk.html)
* [Java Champions - Java is Still Free](https://docs.google.com/document/d/1nFGazvrCvHMZJgFstlbzoHjpAVwv5DEdnaBr_5pKuHo/preview)

## Solutions

We decided to put the following process in place as a solution to short-lived releases problem.

### Java 11 LTS package

We decided to use Java 11 packages from AdoptOpenJDK. It should have LTS support from the community.
If need be, we might try packages from RedHat, Ubuntu or Azul.

### Should we use non-LTS Java? (10, 12, 13...)

We can and will adopt non-LTS releases.
However anyone who does so should be prepared to update to newest major release as soon as it is released and
deployed in our infrastructure.

## Java lifecycle at Allegro

At Allegro we have three major work environments with a process that forces each artifact to be deployed on
all of them in given order:

* **dev** — development environment, which includes so called **Phoenix** environments - isolated development spaces
    for teams - this is the place to see how a newly created feature works with other microservices
* **test** — test or pre-prod environment - only tested and released artifacts can be deployed here, we run
    additional high-level tests to ensure stability of critical paths
* **prod** — what you see at [allegro.pl](https://allegro.pl) :)

### New major version

Major versions will be installed alongside other major versions.
So there will be Java 11 existing alongside Java 8.

* in a week after the new version release it will be installed on dev
* a week later it will be installed on test
* a week later it will be installed on prod

### New patch version

Patch version will replace existing major version. So Java 11.0.2 will replace Java 11.0.1.

* in a week after the new version release it will be installed on dev
* week later it will be installed on test
* week later it will be installed on prod

### Deprecating non-LTS versions

Non-LTS versions will be deprecated and removed from the hosts a quarter after new major version of Java is released.

* quarter after new major version is released non-LTS is removed from dev
* week later it will be removed from test
* week later it will be removed from prod

All Technical Owners of services which use deprecated versions will be notified:

* as soon as new major version is rolled out
* a month before deprecation
* our deployment gateway (Observatory) starts marking new versions of apps using deprecated Java
    as invalid a month before deprecation
* week before deprecation high priority JIRA issues will be created

If no action is taken by Technical Owner, the service will simply stop working after first restart.

This of course creates a question — how to find time to update apps to newer Java versions every 6 months?
I think by being transparent with the process and timeline, we provide all developers with all the information they need
to make a decision: should I adopt non-LTS releases or stay on LTS? In short:
**If you don’t have time to maintain non-LTS version updates, stay on LTS.**

#### Example: deprecating Java 12 in favor of 13

* Java 13 is installed on all envs
* notification is sent to Technical Owners of services using Java 12
* month before planned deprecation another notification is sent to Technical Owners of services using Java 12
* deployment gateway (Observatory) starts marking new versions as invalid
* week before planned deprecation high priority JIRA issue is created
* on day of planned deprecation Java 12 is removed from dev
* week later Java 12 is removed from test
* week later Java 12 is removed from prod

## Why not simply use Docker and isolate?

As much as isolating dependencies is a great idea, it does not solve the problem of version fragmentation.
We don’t want to end up with 10 different versions of Java in a few years.
The processes described above should be in place even if everything is dockerized.

## Automagical Java version updates

To ease the maintenance burden, in the future we would like to provide process and tools for automatic
migration between LTS versions of Java. This might look similar to:

* application is built on CI using newer JDK
* command line options are checked for deprecations
* if everything is ok — application will run using newer version of Java
* if build fails — Technical Owner has to react and fix the problems

This could apply not only to Java, but also to things like different libraries versions as well.
