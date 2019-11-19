---
layout: post
title: Team tourism at Allegro — part 3 — more case studies
author: [bartosz.balukiewicz, adrian.rydzynski]
tags: [tech]
---

In this last instalment of our series about [team tourism](/2019/09/team-tourism-at-allegro.html) at [Allegro](/about-us/),
our two engineers describe their eventful visits in two rather technical teams, one dealing with our message broker -
[Hermes](https://hermes.allegro.tech/), the other with web performance.

## Case study 1
####  Hermes - Bartosz Balukiewicz
On a daily basis, I am a software engineer in the team developing a product which predicts delivery times of orders.
We are diving deep into bid data and machine learning world, but we rely on event-based micro-service architecture.
That is why we use Hermes ([version 1.0 was released](/2019/05/hermes-1-0-released.html)) extensively -
a message broker based on Kafka, which supports about 400 micro-services at Allegro. Hermes offers many functionalities,
and it is easy to use, but often there is not enough time to understand exactly how it works under the hood. In case of any problems,
such knowledge allows a faster and more effective response to failures and not being only a passive customer of the service.
For these reasons, I decided to have my team tourism at the team which develops and maintains Hermes at Allegro.
My team’s stakeholders are mostly business people, so it was not only a great opportunity to change surroundings
but also a chance to work for other engineers as well.

<img alt="hermes" src="/img/articles/2019-11-19-team-tourism-case-studies-2/hermes-logo.png" />

We decided not to set any single purpose for my tourism - I wanted to enter the team’s everyday work, learn about its work
culture, and really feel as a part of the team.  During the intense month, I managed to touch the core components of Hermes,
fix a few bugs, create a diagnostic tool, and improve the management of its metrics. The result of this work was a pair of pull
requests in the [open-source project](https://github.com/allegro/hermes) on Github. Also, I touched other areas in which
the team works, such as custom-made [Captcha](https://en.wikipedia.org/wiki/CAPTCHA) service and a global,
scalable [cookie](https://en.wikipedia.org/wiki/HTTP_cookie) management solution.

Of course, I expected that entering a rather large codebase of the multi-threaded code of Hermes would be challenging
but in the end, thanks to numerous tests, it proved to be not that difficult. The challenge was also to learn the entire
Hermes testing and deployment process, which is a responsible task, due to its criticality and complexity of architecture.

During the tourism, the thing I paid attention to was the work culture of the team. At Allegro, every team is on duty
over its services, but in my "new" team, it was extended to the extreme. The use of such a critical service as Hermes requires
from the team a lot of concentration and in-depth knowledge, predicting possible problems, and expressing their response to
them. Nevertheless, the team works in a great, friendly atmosphere. Every month, a kind of two-day hackathon is
organised, during which everyone uses new technology or algorithms and later shares the results of their work. This is a
great way to develop your knowledge, but also to integrate with the team.

In conclusion, after this monthly tourism, I know a lot better where to look and how to solve problems when using Hermes
and I know what questions to ask, which allows faster response in case of problems. I also built a solid foundation for
further work on developing Hermes as part of an open-source contribution. The significant advantage of tourism is also the
ability to build relationships with new people and to get to know their way of working.

## Case study 2
### Web performance - Adrian Rydzyński
Currently, I’m working with a team which takes care of developing the list of offers on Allegro. We call it “listings”.
This is a place with heavy traffic, so we’re trying to have availability and efficiency as a high priority.
To broaden my knowledge, I decided to have my tourism at the web performance team, who are taking care of performance and
are trying to educate as many people as possible, that performance matters. I was hoping to learn what we can improve
on listings to make them faster and more robust for our users. Besides, they were building a new
[single page application](https://en.wikipedia.org/wiki/Single-page_application) which contains a homepage, listings,
and a view of a single offer. Their goal was to gain knowledge about listings, and I had to pass it knowledge on to my team.
Both sides had their goals, but it was clear that we were going in the same direction. We didn’t specify precisely
how many story points I had to make or how many new features I had to transfer to my team. We wanted to do as much as possible.

<img alt="webperf" src="/img/articles/2019-11-19-team-tourism-case-studies-2/webperf.jpg" />

My friends from the web performance team introduced me to their core project: a single page application called
"mobile-web SPA". It is worth mentioning that in my daily job, we have a component structure. That means listings are
built with many components: lists, filters, categories, articles, pagination, and so forth.
Another approach was chosen in the mobile-web SPA. We have everything in one significant monolith component. Of course,
there are pros and cons of this solution. For example, the advantages of monolith applications are no communication issues
between components or reusing your styles or data in many places. On the other hand, it is hard to work on the same codebase.
You are stuck with the technology, and you should get used to resolving conflicts because there will be a lot of them when
you work with more than several people. So it was kind of obvious that there must be changes in my approach - both in the
programming process and in the process of testing or releasing a new version of the mobile-web SPA.

My first assignment was to change the pagination - everything was done before the end of the day. However, we had plenty
of discussions during the code review - about tests, architecture, variable names, and functionalities. They explained to me why
they use specific solutions, and I told them how our team does it. They didn’t know about some features that the
listings API already had and that they don’t have to do the same job on their side, and I understood why this kind of
architecture could be useful. During these two weeks of team tourism, I was able to implement three more tasks: a generic component
for badges, replacing old badges in the generic component, and adding SMART! logo to listings. Like the previous time, there
were many discussions, and I noted some of their arguments to talk with my team, because there were a few things
that we could do better.

I have to admit, I was surprised at how many meetings the web performance team was involved in as consultants - both with
development teams, as well as more business ones, dealing, for example, with the content of the home page. They also provided
research on the comparison of Allegro’s performance with other websites. Of course, as a temporary team member, I was
involved in all aspects. So many meetings went hand in hand with the disadvantages: my work was often interrupted, so I
was able to do fewer tasks than I initially thought.

As I mentioned, my team tourism lasted two weeks. Almost all tasks were deployed for production during this time
and only one was deployed a few days later. When I returned to my team, I added three new tasks to our backlog,
and I arranged a meeting with my team, where I was able to tell everything that I learned from this exchange.

Summarising, I have a few thoughts after the team tourism. First of all, I think two weeks is too short. It should be four weeks
because I could take part in only one sprint, and it was a little too short. When it comes to advantages, I can undoubtedly
say that this was a great experience. I was able to look at the performance side of our product. From now on,
I have a goal: at least one team tourism annually.

My final thought is: not all users are browsing Allegro from their homes, with a super-fast internet connection and an
expensive computer. We should always remember the “mobile-first” policy and take care of the performance of our
product.

## Summary
To sum up, team tourism has become a standard tool of sharing knowledge and exchanging experiences between teams at Allegro.
Despite its organisational costs, the benefits are undisputed. We hope that our guide and case studies will convince
you that it is worth to implement it at your companies.

Previous posts in the series:
* [Team tourism at Allegro](/2019/09/team-tourism-at-allegro.html)
* [Team tourism at Allegro — part 2 — case studies](/2019/10/team-tourism-case-studies-1.html)
<style type="text/css">.post img{margin: 0 auto;display: block;}</style>
