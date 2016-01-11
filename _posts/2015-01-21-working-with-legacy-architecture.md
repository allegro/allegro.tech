---
redirect_from:
   - /working-with-legacy-architecture.html
layout: post
title: Working with legacy architecture
author: kamil.piska
tags: [tech,architecture, legacy code, clean code, acl]
---

Any programmer can admit that working with code that has been developed for years by many people is a difficult task.
Keeping your own application architecture clean is troublesome, and it gets even more challenging in case of an application
that was written by other programmers several years ago. One can enjoy writing new applications and tools that do
not carry any burden, but each product evolves together with its business assumptions. Moreover, new features are added
and the application needs to be constantly improved.

However, there comes a moment when implementing any new option becomes almost impossible,
the code itself is more error-prone and requires thorough modification. In fact, it requires a complete re-design.
In case of small applications, one iteration is enough to rewrite them to features and to replace the old code with something brand new.
Unfortunately, it is impossible within a reasonable amount of time to rewrite complex applications with complicated business logic.

Modern applications are usually microservices, whereas legacy applications are in most cases monolithic systems.
Every, even the tiniest, change of business logic may cause errors in other, seemingly unrelated, areas.

Therefore, instead of a Big Rewrite, the more sensible solution is to create microservices that take single functionalities out of the monolith, one by one.
It is not that easy, as quite often this newly separated microservice needs to be used by the old system
or to be supplied with its data.

### Anti-Corruption Layer

Usually, when you create a new microservice, you notice that some business or technical assumptions or flow should be remodeled.
Sometimes there is a need to remove unnecessary code from the old application domain.
How to move current model to the new one when you develop the first (or one of the first) microservices?
Programmers are often tempted to move problematic issues “temporarily” to the new system,
“until all elements understand the new model”, etc. The idea is alluring, as it provides a quick solution.
Consequently, invalid business assumptions appear in the new system and despite
coding separate microservice in a new language and having a new database, nothing changes.
As a result, problems that used to keep programmers awake at night will occur again in 6 or 12 months.
The solution is the application of Anti-Corruption Layer pattern.

![Anti-Corruption Layer inside an old system](/img/articles/2015-01-21-working-with-legacy-architecture/acl_inside.png "Anti-Corruption Layer inside an old system")

The ACL pattern comes from the [Domain-Driven Design](http://en.wikipedia.org/wiki/Domain-driven_design) approach. DDD focuses on defining domain models,
system components and their behavior to reflect the reality as much as possible.
The main idea behind DDD is that you should first create such a model in order to consider issues related to its technical implementation later.
If you would like to learn more, read [“Domain-Driven Design: Tackling Complexity in the Heart of Software”](http://dddcommunity.org/book/evans_2003/) written by Eric Evans, the creator of DDD.
Although the ACL pattern was created for DDD, it seems to work fine anytime you deal with legacy code.
According to ACL, complete translation of the old model must be performed outside of the new service.
In other words, the new microservice has its API, data formats, etc., whereas ACL adapts input provided by the monolith to the new model.
Therefore, the new microservice is not corrupted by the old model.
As a result, the development and future maintenance of the microservice is much easier.
ACL can be inserted into the old application or be a separate entity collecting all the requests submitted to the new microservice.

![Anti-Corruption Layer outside an old system](/img/articles/2015-01-21-working-with-legacy-architecture/acl_outside.png "Anti-Corruption Layer outside an old system")

ACL does not have to process only the “old application → new microservice” communication.
It can also support the communication in the opposite direction. Let’s assume that after processing its tasks,
your microservice must return the results somewhere. The old application would e.g. save them in a database
(the global database that keeps all the data necessary for the monolithic application), where they would be required by another functionality.
Currently, there is no other microservice that would need this data and the only available method is to save the data within the old structure.
And here comes ACL again. You become its client and it will process data saved in a new format submitted using a brand new protocol
(e.g. HTTP and REST architectural pattern). Therefore, ACL can act as a wrapper (proxy) that changes the data transmission method
(e.g. it will receive data via REST to save it directly to a database).
However, it can also act as an adapter that translates data in the new format to the old format, recognized by the old application.

### Enterprise Service Bus

Using the ACL pattern to carve single functionalities out of the monolith and to create separate services can help you a lot,
but it will not solve all the legacy architecture problems. Usually, your application is integrated with tools
and external applications that you cannot modify. Sometimes you face legacy integration, e.g. your application must send an e-mail somewhere, save something to an FTP server or communicate with some other external entity,
which you cannot change, as the other communication party does not belong to you.
Anyway, you must deal with it somehow, but again, you are tempted to solve this issue in the service itself.
This would mean adding extra code lines, which we want to avoid. Moreover, it also makes you cut corners when modeling the domain.
That is why I recommend taking the model translation outside to make sure your service is not corrupted.

In such case, using only ACL that just translates data may not be enough.
Here you need [Enterprise Service Bus](http://en.wikipedia.org/wiki/Enterprise_service_bus) ESB (e.g. popular solutions such as open-source Apache ServiceMix or commercial Tibco bus)
that will process some of the external communication logic, whereas the microservice can send (in a way the architects and programmers want it)
and retrieve data (e.g. via REST). If any of the communication parties modifies its needs related to communication layer,
your microservice will not be affected and you will not be tempted to introduce any potentially chaotic changes into the business logic in order to meet the communication needs.

### Summary

Patterns I have mentioned are only the tip of the iceberg, as there are plenty of solutions you can use
when moving your legacy architecture into the new world.
Anyway, the most important thing is that they allow you to focus on modeling problems in a brand new way, using all your programming skills.
An Anti-Corruption Layer can save you from many bad surprises and isolate your new code from legacy applications.
