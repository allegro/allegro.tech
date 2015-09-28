--- redirect_from:
   - /search-ux-without-interface.html

layout: post 
title: How to UX without interface 
author: [alicja.antkowiak, edyta.kopczynska, krystian.szczucki, piotr.plys] 
tags: [ux] 
---

[Allegro.pl](http://allegro.pl) is a leading Central European e-commerce platform, offering a vast diversity of new 
and pre-owned products. Search engine is the main entry point to Allegro.pl product stock. 
Designing a bunch of UX metrics for a [SaaS](http://pl.wikipedia.org/wiki/Software_as_a_Service) solution or
a social networking site is a must. Typically no one would dare
discuss whether it is worth our time to measure the effect of changes through an
[A/B](http://en.wikipedia.org/wiki/A/B_testing) test or a focus group and monitor
the impact on metrics. When it came to search engine — a back office product with almost no interface — we had our
doubts. We are the search team behind the Allegro search engine. This is the complete interface of our product:

![allegro search](/img/articles/2015-04-13-allegro-search.png)
 
And this is it. Not much visible for users but there are huge challenges hidden behind it.

In this article we hid a mistake, for those who find it we have a surprise — details at the end.

##Ghost in the machine

In the past we have been focused on stability and response time metrics related to our infrastructure. This was the
right approach and the fundamental starting point. There is no point in measuring [Net Promoter Score](http://en.wikipedia.org/wiki/Net_Promoter)
or user delight if the search has stability issues, right? This would be especially true 
with a vast infrastructure, both in terms of hardware and software. We currently support:

* 85 physical servers, 11 000 RPS on our caching/load balancing layer with 6 000 RPS hiting [Solr](http://lucene.apache.org/solr/)
index which holds data about more than 50 million offers from our stock,
* all this to assure 99.95% availability with maximum 2 seconds response times.
Logic behind sorting scenarios for Best Match — relevance sorting order of search results and category listings, is powered by several
feeders and workers that provide and calculate data for our Lambda architecture solutions based on [Badoop](https://hadoop.apache.org/),
[Spark](https://spark.apache.org/), [Kafka](http://kafka.apache.org).

Based on this technical infrastructure we started to measure and monitor several metrics like turnover and number of
transactions (a constant A/B test with 4 treatment groups and 1 control group), response times ([Zabbix](http://www.zabbix.com/), etc.), 
measurements with URLs and cookies, and finally created a dedicated dashboard in Business Intelligence solution. 
But in time, these metrics proved to be insufficient.

##Reaching beyond RPS

We have concluded that our current set of metrics shows us only a part of the picture but not the whole one. The number
of transactions and turnover are too general and too chaotic over time to reflect users’ satisfaction. They do not
allow us to evaluate the effect of our smaller changes and they are too coarse to show us the subtleties of users’
reactions. We also could not see how many users received no search results at all nor analyze the reasons for it. Darn!
We had to think of a new approach and instead of monitoring Solr and our single search field, we decided to spy on real
humans.

##Start, fail and proceed

The first attempt to implement user-oriented metrics took a lot of time and ended in a failure as we had insufficient
know-how to do this with only developers and a product owner. We drew conclusions and asked for help in our UX Division.
Fortunately they also felt that search is an unjustly UX-neglected area and were happy to assist. We received support
of dedicated usability and user survey specialists. Piotr and Alicja from User eXperience team joined us and became 
part-time members of our technical team, supplying us with the user perspective and an array of testing tools. Yeah!

##Stepping out of the comfort zone

Selecting the most relevant metrics was probably the most difficult part, second only to comprehending how badly we needed
them. We desired tools which would show us a perspective completely detached from transactional data and instead focused on users point
of view. We believe that customer satisfaction is far more important than an immediate increase in 
turnover — it has been proven that this measure provides a leading indicator of
consumer purchase intentions and loyalty. And a loyal customer is far more likely to make further purchases in the
future.

##How we fell in love with HEART

Lately in our organization we became more focused on measuring user experience not only qualitatively, but also
quantitatively. It gives us the possibility to collect data automatically and often, as well as to interpret UX data
unambiguously – everyone who accesses the report can easily say if the quality of using our product increased or
decreased during last weeks. Using Google framework called [HEART](http://www.gv.com/lib/how-to-choose-the-right-ux-metrics-for-your-product)
seemed a great way to start. To make the most of HEART you have to work in 
teams of people with different skills who 
debate together what is the signal of users’ product related happiness, engagement, adoption, retention and 
task success and what are the metrics to measure them. Afterwards data analysts do the magic and include all 
of the information in easily accessible and readable reports updated daily or weekly. HEART seems like a 
reasonable methodology for almost every part of Allegro.

##Trouble in paradise

Well, almost... HEART for a search engine is a tough nut to crack — first of all, everybody knows and can identify a
search engine. Second, the vast majority of our users regard it as the only way to explore Allegro, so they use it
regardless of the possible negative emotions it causes. How can we talk about adoption, retention or engagement in this
case? Also, only search engine text input is visible to our users, every other aspect is hidden. Where does it
demonstrate its quality then? Should we measure the success by listings, offer views or by purchases? How can we
minimize the bias related to different designs of these pages and types of items sold at Allegro.pl? After a few intense
meetings we agreed to give up on HEART entirely and find a custom way to accurately measure the quality of our search engine’s UX.

After many long and lively debates we chose 10 main metrics which will allow us to approach search results differently
and from a broader perspective — such as:

* how long it takes for the user to find an interesting offer from the moment when user enters the phrase to offer 
* satisfaction from the search results (measured by surveys) 
* percentage of queries returning no results 
* number of users who have seen empty search result at least once today 
* etc...

At the moment we are setting up a dashboard in our room to display the new metrics in an appealing and colorful 
manner, all in one place. This will be a clear and easily accessible way of monitoring our users’ satisfaction. 
Everyone in our room can see how happy (or not) our users are today. They can monitor the impact of deployed 
changes and optimise according to users’ responses.

##Future of measuring user satisfaction

It is too early to fully analyze the results of our new metrics yet. Our HEART-inspired approach towards measuring
users’ experience has just been released and as of today we have fractional data, with no historical trends. For
example — for our initial metrics we have chosen empty search responses and weekly aggregated users’ satisfaction. We
strive to collect feedback from users along with these metrics as well to analyze queries that ended up with an empty
listing. Thanks to this we have already managed to find a couple of causes for the latter and will continue our work
towards combating the empty search results’ screen. In future we plan to develop more metrics — this is a constant work
in progress.

## Bonus: found our “mistake”?

In this article we misspelled the name of one of the tools we use. If you know the
correct name, send it to us [through this form](http://goo.gl/forms/12OQLeKJwR); first three people will have the chance to name one of our servers and
become its godfather / godmother! Send your suggested name with your answer. The form will be active throughout April 2015.

