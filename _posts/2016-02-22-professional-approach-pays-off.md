---
layout: post
title: Professional approach pays off
author: rafal.bryk
tags: [tech, proffesional, programmer, software craftsmanship, agile]
---

_It is a story about carrying out an IT project by one of Allegro scrum teams and a fine example of a professional approach supported by 
a set of case studies. Read it to learn how to deal with issues when carrying out an IT project._

The start of the project saw the team very motivated and the pace of work was incredible. It almost felt like working in a start-up 
environment. And you couldn’t wish for more pleasant development with limited number of dependencies, greenfield, etc. Quite soon we 
reached the stage that made us certain that the project could be accomplished. Moreover, we knew how to measure whether the whole thing 
was profitable at all. The project’s plan involved a year or even two years of work. With this in mind, you want to treat the code 
carefully. You know you will spend a lot of time working with it, so you want to make sure that each aspect of that code is done well. 
Developers know there are myriads of things to take care of in software development. So the question is:

> How to make the work easier?

The approach adopted by the team required taking care of all the aspects of good software. It means being able to introduce changes to 
each bit of the product as in the case of the Extreme Programming methodology. It means being unable to separate different project stages, 
e.g. “in January we will work on solution architecture and when it’s done, we will move on to metrics in February”. Such solutions merely 
pay off in such dynamic envioronment. That is why, I’ll indicate what we paid attention to in order to keep any problems at bay. So, let’s analyze 
what we did to make the work easier.

## From idea to development

The first steps involved all the usual things developers do like building the application and automatic testing. Repetitive actions 
transforming the code into an application were arduous from the very start. As it was a Java project, we found a lot of ready-to-use tools 
and solutions that we could try out. The team selected the following testing frameworks: 
[JUnit + JBehave](http://allegro.tech/2015/03/acceptance-testing-with-jbehave-and-gradle.html), with the Gradle + Bamboo support as it 
allows you to automate all the manual work. As a result, you gain a lot almost effortlessly – you can check whether the product’s code 
is accurate in almost no time. Mark my word – you do want to have your code clean and neat when you are about 
to make some serious decisions about your product.

Since the very beginning, the team adopted the Continuous Integration & Delivery approach renowned for its [agile software development 
methods](http://allegro.tech/agile). However, it turned out to be quite challenging – because how can you release and rollback changes on a live 
environment without affecting users? It took a lot of work with setting, even more test releases and application of such technologies as 
Bamboo, OpenStack and Varnish. Without delving into details, these tools helped us juggling stable machines and machines undergoing changes 
such as product release. According to numerous research results, users don’t like too many changes in a product. And if the product is 
unavailable when undergoing changes, it becomes even less attractive. That is why we had to find out how to release small chunks of 
software in a secure way.

![bamboo](/img/articles/2016-02-19-professional-approach-pays-off/from-idea-to-development.jpg "Bamboo")

## Large scale A/B testing

The project goal was to develop a new solution that would replace some features of the Allegro platform. Naturally, the new solution had 
to be better thus being worth the company’s money and time. In this particular case by “better” we understood conclusions drawn after 
suitable measurements involving both the new and existing product. How can one compare it? Test two solutions at the same time on two 
different groups of users. In other words, apply A/B testing. This way we were able to create a mechanism serving new solution to a 
default group. At first, the group did not exceed 1% of users, but it was easy to adjust and increase that number. The implementation of 
this approach was crucial in terms of continuous learning and gaining user feedback.

Besides, it was something one would expect from a professional start-up – a project may fail, but the team can abandon it quickly before 
any technical debt arises. The first technical failure proved that the team’s approach was right. By being able to rollback changes made 
to the solution (in fact activating it for 0% users) the team had the time to analyze the application and release suitable fixes. At the 
same time, nothing disturbed Allegro users. All of this could happen owing to professional and responsible approach of the team.

## Technical reliability of a solution

Adjusting the number of recipients is not enough. If you want a product to be working, you need infrastructure that is adjusted to the 
traffic expected. The first technical failures made us realize that the problem was serious. A manual mechanism for adjusting the amount 
of hardware based on OpenStack, Puppet and NewRelic readings was another challenge for the team. Nonetheless, it allowed us to change the 
product’s infrastructure quickly and we were a step closer to the process automation. The important lesson here was that when you develop 
software, you can’t forget about hardware.

Overwhelmed by technical issues, we couldn’t forget that the product was constantly running and 1% of users was in fact using it. But what 
does using really mean in this particular context? How do users perceive the product? What do they click? How much time they need to 
perform a certain action? It was time to carry out some quantitative product analyses to understand how users use our product. Eventually, 
we managed to notice some significant things with the help of NewRelic, Hadoop, Kibana and some 
[internal tools](http://allegro.tech/2015/09/scaling-graphite.html). To examine the issue thoroughly, we carried out qualitative research 
using UsabillaLive to better understand the patterns we observed. Then we were able to determine what was important, what could be omitted 
and what was necessary. After all, we want our users to be happy and for this reason we want our features to be smart, so we do not have 
to remove them from the high-quality code.

## Outcome

As the product grew, the architecture was undergoing changes and new features were added. More users had the chance to use our product. 
Every day we were getting wiser and richer. It was a time to enjoy the outcome of our earlier work and decisions. No one was wondering 
whether e.g. a release pack should be tested on a test environment as it was obvious. No one was wondering whether we had selected the 
right solutions as the analysis would tell us that. Some time later, we started paying more attention to the OnDuty procedure to know how 
to react in case of emergency. We ordered Error Logging to gain valuable data on software performance. We included security testing into 
development to make sure that no security incidents would surprise us. We were reaching the point at which almost 100% traffic was 
redirected to the new solution. 

_“Let’s go to a bistro to celebrate the 100% traffic switch. We can release the change there.”_ There were no technical or process-related 
obstacles. We knew our product was good and knew we did a good job when developing it. Indeed, the “100% traffic” release was performed 
during a dinner. At the same time we followed all the procedures and best practices. And last but not least – we understood how important 
it was to act professionally. That is why we were so confident during the release. _Don’t you find working from a bistro inspiring?_

![bistro](/img/articles/2016-02-19-professional-approach-pays-off/outcome.jpg "Release from bistro")

## Lessons learned

Life is not always a bed of roses. When developing the product we often sought for support in functional / regression testing. 
Unfortunately, the attempts of finding a working solution were hindered by external and environmental dependencies, remodeled architecture 
and the very features of the product itself. We weren’t able to cover the changes with functional testing which eventually led to errors. 
One of them involved temporarily deactivation of a certain paid feature which resulted in refunds and financial loss. We changed functional 
testing frameworks, methods of including them in development and ways of dealing with dependencies. Nonetheless, we couldn’t deliver a 
working solution. As you can see, sometimes despite all the efforts, the outcome may not be that brilliant.

Let’s sum up:

 * We knew the project scale so we used solutions adjusted to the problem – minor workarounds solved the problem only temporarily and 
generated additional cost
 * Owing to complex programming knowledge we were able to polish every aspect of the code
 * To keep everything under control, we wanted to build the product piece by piece. To do so, we needed development and release process.
 * To make sure no code lines are wasted, we analyzed and measured users behavior to pick only the most promising features
 * To make sure the solution is reliable, we adjusted the infrastructure and monitoring to our product.
 * If you want to release anything while sitting in a bistro and be 100% confident, you have to take care of all the software development 
aspects. 


_Dear developer! You will face deadlines. You will seek for compromises. You will work under pressure. You will be tempted by exceptions. 
But the truth is that only you can guarantee that the product will work and be reliable. Any exception you accept is a serious threat. 
Just follow the best practices of software engineering to enjoy the results of your work. Smart decisions can change any difficult 
software development project into something definitely easier._