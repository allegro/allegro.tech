---
layout: post
title: Professional approach pays off
author: rafal.bryk
tags: [professional, programmer, software craftsmanship, agile]
---

This is a story about how professional approach to coding can save you a lot of troubles. It is a story about passion for coding and how
it makes our products great. It is a story about carrying out an IT project by one of Allegro scrum teams as a fine example supported by
a set of case studies. Read it to inspire yourself how some of the issues can be dealt with.

The start of the project saw the team very motivated and the pace of work was incredible. It almost felt like working in a start-up
environment. And you couldn’t wish for more pleasant development with limited number of dependencies, greenfield, etc. Quite soon we
reached the stage that made us certain that the project would be a success. Moreover, we knew how to measure whether the whole thing
was profitable at all. The project’s plan involved a year or even two years of work. With this in mind, you wanted to treat the code
carefully. You know you will spend a lot of time working with it, so you want to make sure that each aspect of that code is done well.
Developers know there are myriads of things to take care of in software development. So the question is:

> How to make the work easier?

The approach adopted by the team required taking care of all the aspects of good software. It meant being able to introduce changes to
every bit of the product as in the case of the Extreme Programming (XP) methodology. XP approach advocates avoiding programming of features
until they are actually needed, simplicity and clarity in code, so it fits our needs. It wasn’t reasonable to separate different project
stages, e.g. “in January we will work on solution architecture and when it’s done, we will move on to metrics in February”. Such solutions
hardly pay off in such dynamic environment. I’ll indicate what we paid attention to in order to keep any problems at bay. So, let’s begin.

## From idea to development

The first steps involved all the usual things, like building the application and automatic testing. Repetitive manual actions
transforming the code into an application were arduous from the very start. As it was a Java project, we found a lot of ready-to-use tools
and solutions that we could try out. The team selected the following testing frameworks:
[JUnit + JBehave]({% post_url 2015-03-02-acceptance-testing-with-jbehave-and-gradle %}), with the Gradle + Bamboo support as it
allows you to automate all the manual work. As a result, you gain a lot almost effortlessly – you can check whether the product package
can be built in almost no time. Mark my word – you do want to have your code clean and neat when you are about
to make some serious decisions about your product.

Since the very beginning, the team adopted the Continuous Integration & Delivery, based on agile software development
methods. However, it turned out to be quite challenging – because how can you release and rollback changes on a live
environment without affecting users? It took a lot of work with coming up with the right settings, performing test releases, and applying
such technologies as [Bamboo](https://www.atlassian.com/software/bamboo), [OpenStack](https://www.openstack.org/) and
[Varnish](https://www.varnish-cache.org/). Without delving into details, these tools helped us with juggling stable machines and machines
undergoing release process. According to numerous research results, users don’t like too many changes in a product. And if the product is
unavailable when undergoing changes, it becomes even less attractive. That is why we had to find out how to release small chunks of
software in a secure way.

![bamboo](/img/articles/2016-03-14-professional-approach-pays-off/from-idea-to-development.png "Bamboo")

## Large scale A/B testing

The goal of the project was to develop a new solution that would replace some features of the Allegro platform. Naturally, the new solution had
to be better thus being worth the company’s money and time. In this particular case we determined what was to be understood as “better”
based on suitable measurements, compared with previously defined criteria, involving both the new and existing product. How can one compare
it? Test two solutions at the same time on two separate groups of users. In other words, apply
[A/B testing](https://en.wikipedia.org/wiki/A/B_testing). This way we were able to create a mechanism serving new solution to a
default group. At first, the group did not exceed 1% of users, but it was easy to adjust and increase that number. The implementation of
this approach was crucial in terms of continuous learning and gaining user feedback.

Besides, it was something one would expect from a professional start-up – a project may fail, and the team can abandon it quickly, without
generating additional technical debt in old solution. The first technical failure proved that the team’s approach was right. By being able
to rollback changes, the team had the time to analyze the application and release suitable fixes. At the same time, nothing disturbed Allegro
users. All of this could happen thanks to a professional and responsible approach of the team.

## Technical reliability of the solution

Adjusting the number of new solution recipients is not enough. If you want a product to be working, you need infrastructure that is adjusted to the
traffic expected. The first technical failures made us realize that the problem was serious. A manual mechanism for adjusting the amount
of hardware based on OpenStack, Puppet and NewRelic readings was another challenge for the team. Nonetheless, it allowed us to change the
product’s infrastructure quickly and we were a step closer to process automation. The important lesson here was that when you develop
software, you can’t forget about hardware.

Overwhelmed by technical issues, we couldn’t forget that the product were constantly running and 1% of users was in fact using it. But what
does using really mean in this particular context? How do users perceive the product? What do they click? How much time do they need to
perform a certain action? It was time to carry out some quantitative product analyses to understand how users used our product. Eventually,
we managed to notice some significant things with the help of [NewRelic](http://newrelic.com/), [Hadoop](http://hadoop.apache.org/),
[Kibana](https://www.elastic.co/products/kibana) and some [internal tools]({% post_url 2015-09-08-scaling-graphite %}). To examine
the issue thoroughly, we carried out qualitative research using [UsabillaLive](https://usabilla.com/products/websites) to better understand
the patterns we observed. Then we were able to determine what was important, what could be omitted
and what was necessary. After all, we wanted our users to be happy and for this reason we wanted our features to be useful for them. We
did not have to remove them from the high-quality code, as pointless and impractical.

## Outcome

As the product grew, the architecture was undergoing changes and new features were added. More users had the chance to use our product.
Every day we were getting wiser and more experienced. It was time to enjoy the outcome of our earlier work and decisions. No one was wondering
whether e.g. a release pack should be tested on a test environment as it was obvious. No one was wondering whether we had selected the
right solutions as the analysis would tell us that. Some time later, we started paying more attention to the OnDuty procedure to know how
to react in case of emergency. We added error logging to gain valuable data on software performance. We included security testing into
development to make sure that no security incidents would surprise us. We were reaching the point at which almost 100% traffic was
redirected to the new solution.

_“Let’s go to a bistro to celebrate the 100% traffic switch. We can release the change there.”_ There were no technical or process-related
obstacles. We knew our product was good and knew we did a good job when developing it. Indeed, the “100% traffic” release was performed
during a dinner. At the same time we followed all the procedures and best practices. And last but not least – we understood how important
it was to act professionally. That is why we were so confident during the release. _Don’t you find working from a bistro inspiring?_

![bistro](/img/articles/2016-03-14-professional-approach-pays-off/outcome.jpg "Release from bistro")

## Lessons learned

Software development is not always a bed of roses. When developing the product we often sought for support in functional / regression testing.
Unfortunately, the attempts of finding a working solution were hindered by external and environmental dependencies, remodeled architecture
and the very features of the product itself. We weren’t able to cover the changes with functional testing which eventually led to errors.
One of them involved temporarily deactivation of a certain paid feature which resulted in refunds and financial loss. We changed functional
testing frameworks, methods of including them in development and ways of dealing with dependencies. Nonetheless, we couldn’t deliver a
working solution. As you can see, sometimes despite all the efforts, the outcome may not be that brilliant.

Let’s sum up:

* We knew the project scale so we used solutions appropriate for the problem – minor workarounds solved the problem only temporarily and
generated additional cost.
* Thanks to complex programming knowledge we were able to polish every aspect of the code.
* To keep everything under control, we wanted to build the product piece by piece. To do so, we needed development and release process.
* To make sure no lines of code were wasted, we analyzed and measured users' behavior to pick only the most promising features.
* To make sure the solution was reliable, we adjusted the infrastructure and monitoring to our product.
* If you want to release anything while sitting in a bistro and be 100% confident, you have to take care of all the software development
aspects.

_Dear developer! You will face deadlines. You will seek compromises. You will work under pressure. But the truth is that only you can
guarantee that the product will work and be reliable. Any far-fetched compromise you accept is a serious threat.
Just follow the best practices of software engineering to enjoy the results of your work. Smart decisions can change any difficult
software development project into something definitely easier._
