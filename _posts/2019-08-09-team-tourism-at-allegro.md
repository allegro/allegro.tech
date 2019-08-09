---
layout: post
title: Team tourism at Allegro
author: [michal.lewandowski, piotr.orlowski, bartosz.balukiewicz, tomasz.nurkiewicz, bartosz.galek, adrian.rydzynski]
tags: [tech]
---

We often hear about the importance of exchanging knowledge and practices between totally different teams. However, less
often do we hear concrete suggestions for how to do it. In this article, we discuss one of our practices to tackle the
problem.

<img alt="Team tourism" src="/img/articles/2019-08-09-team-tourism-at-allegro/team-tourism.png" />

## What is team tourism?

The idea behind team tourism is simple. For a fixed period of time (for example one or two Scrum Sprints), one team
member joins another team to work there. In most of the cases, we aim to do something different from our daily routine
work. Naturally, in most of the cases, his or her efficiency is extremely low, but the long term benefits are
overwhelming.

Other terms used for what we call “team tourism” are “exchange” or “rotations”. Although, they may look similar, in is
highly likely that they deliver the same value.

## The incentive

There are many reasons why we would like to change teams. Not only are there benefits for participants, but also for the
company. In this section I will discuss reasons why do this.

First of all, there is a mutual exchange of knowledge. The person who is on the exchange can provide a fresh look at
existing problems, as well as, he or she can bring new practices to his or her home team. The opportunity to observe
different teams and their strategies of solving problems can force us to rethink processes in our team.

Next, many developers want to learn new technical skills. For example, if your team is focused on backend engineering,
it may be a good opportunity to practice frontend skills. For many of us, it was a big step out of our comfort zone. You
may be a senior in your area of expertise, but suddenly you are in a totally different role where you are a complete
beginner.

On the other hand, you may decide to go to the other team to explore your interest in some technology even more. During
the exchange period, you should focus on one, and only one thing which interests you the most, to achieve a specific
goal.

Boredom, burnout, monotony may happen to each of us. By working for too long on single project you may want to refresh
yourself. In that case, team tourism will probably have vast impact on your morale.

If the product is enormous, it is often hard to keep track of all its aspects. As a result, different departments are
focused on totally different business requirements. While working in different teams, you may see other points of view
which may be entirely beneficial.

What if this goes so well, that person on the exchange wants to stay? It is also possible and we do not say ‘no’. Of
course that decision should not be immediate, and more measured actions should be taken. Regardless of that, team
tourism is a good place when you want to potentially change your team permanently.

Last but not least, we decide to do that kind of exchange, because the team needs it. The person who is going to the
exchange may go there in order to help the team achieve its goal. To illustrate, we may want to do this to remove some
obsolete library from the project or reduce technical debt. Or quite the contrary, to introduce a new library or
redesign existing peace of software.


## How to organise it? Truth to be told, we don’t have strict rules or procedures how to do that. Whereas other

companies embrace explicit procedures, we mostly try to follow common sense, which can be described in a few sentences.

### Before the exchange First of all, the need for team tourism should be clarified. In most of the cases, team member
proposes the exchange, but there are cases when a leader can propose it for someone else.

When there is a desire to go on an exchange, both teams and the person who will be on the exchange have to agree on:
What is the goal of the exchange? How long it should take? When to do it? How to handle other duties, for example being
on call. Notice that deciding how long it should take is completely different question from when to do it.

When you ask yourself the question about the length, it should be long enough to fulfil the goal of the exchange, but
short enough not to cause any problems with your origin team deliverables. On the contrary, when discussing the time to
do it, you should keep in mind different scrum teams, different times of sprint start and end dates. Most common
situation is that the exchange should take two weeks. Ideal situation is that two teams starts its sprints on the same
day. In practice it is rarely the case, so it is necessary to reach a compromise.

### After the exchange When the dust settles, and the exchange is over, person on the exchange should summarise it. We
do not impose the form. It should be in the form of the note, presentation or other way of sharing knowledge. It is
often summarised what was done or what was learnt during that period of time.

## How to facilitate team tourism from day one People who work for several years in an organisation usually have
resistance to change teams, context or design. It is consistent with our habits and our human nature. We tend not to
leave our comfort zones, which in this case is the team, What helps, is building a culture of tourism from the very
beginning of our work. At Allegro this happens in some areas in technology - each new person joining the company spends
2 to 4 weeks in 2 or 3 teams in their first 3 months of work. This greatly facilitates later tourism and makes the
desire to develop your self in this way a natural habit.

## Pitfalls During our practice with team tourism we encountered the following problems. If you are aware of them, you
should do everything to avoid them.

If we were working from a single office, without remote working option, there would be no problem at all. Yet, we are
working in a few different cities in Poland and we can work remotely. When being on the exchange it is important to work
closely with your new team. Make sure that there will be no problems in terms of communications and locations.

Quite a common problem that we had was the inadequate length of the exchange. As a result, we finished the project (or
our task) after the return to our original team. You have to keep in mind that when learning something new or doing
something for the first time, extra time for unexpected problems must be taken into account in the planning stage.

When you are gone for the exchange, your team should be ready to work effectively without you and do not bother you with
daily routine. Unfortunately, it is easier said than done. There will always be some old task that will disrupt you or
your colleague will stop by to ask you just one single question. The team should always be prepared to cope without one
of its members.

## Case studies In this section, we decided to write down our thoughts from different from different exchanges which had
happened. You can analyse them by yourself, and really feel what it is.

### Case study 1 ##### Machine Learning - Michał Lewandowski Data scientists are now one of the most wanted employees on
the market and machine learning is a big thing. Ten years ago, when I was a student at Warsaw University of Technology I
only had one subject called “Artificial neural networks”. Although the topic was interesting, the tooling was primitive
compared to software development and there was little to none job perspectives. A few months ago I decided to join the
“Machine Learning Research” team for a couple of days to work with them, to see how they prepare models and how they are
used in such a big microservice ecosystem as Allegro has.

The knowledge I had from the university was priceless. Although the amount of data, training methods and models have
been complicated, the core concept is still the same. With the help of team members, I was able to quickly understand
the whole process.

The thing that surprised me the most was the amount of time the team spent on collecting data to train and test the
models. If you do any course on Machine Learning online, the course will provide you data. In the real world, you have
to find and gather it by yourself, which is an error-prone process. Another thing that was quite unusual for me is the
amount of time spent on reading and analysing other people’s scientific papers. Reviewing the research conducted by
other scientists is a part and parcel of this job. Those papers are not like articles in popular science magazines and
have a high entry threshold.

After a few days, putting all the pieces of the solution was straightforward. Integrating a model with microservice is
not as hard as I imagined it. The knowledge I’ve gained enabled me to better understand the data scientists, and work
better in cross-functional teams.

The final thought I had is that this branch of engineering is extremely extensive. My observation is that you can not be
on top with both Software Engineering and Machine Learning. If you decide to do Machine Learning on your daily basis you
have to agree that you won't be able to keep up with all the stuff that is going on in Software Engineering.

### Case study 2 ##### Content Automation (Google Cloud Dataflow) - Tomek Nurkiewicz On a daily basis I work for a team
responsible for calculating commissions. Insanely important, but also rather mundane part of a marketplace business. We
work in two environments: real-time and batch. We charge and refund commissions in near real-time, typically a few
seconds after each transaction. This is done through a bunch of microservices, accessed via RESTful interfaces or
[Hermes](https://allegro.tech/2019/05/hermes-1-0-released.html). On the other hand, there is a bunch of Spark jobs
calculating daily and monthly reports, discovering inconsistencies and frauds.

I enjoy this domain but for a while I've also been interested in streaming architectures. Processing large amounts of
data, especially detecting trends and correlations over time, sounds really exciting to me, especially after reading
[“_Designing Data-Intensive
Applications_”](https://allegro.pl/listing?string=designing%20data%20intensive%20applications). Long story short, it
turned out that [Marcin Kuthan's](https://allegro.tech/authors/marcin.kuthan/) team does exactly that, a few office
rooms away. After a casual talk over coffee and finding some time in my permanent team, I moved temporarily, for a
month, to a new project.

Marcin and his team’s task was to calculate CTRs of pages and individual
[boxes](https://allegro.tech/2016/03/Managing-Frontend-in-the-microservices-architecture.html). It basically means how
many people clicked on a page or a box upon seeing it. They did proof-of-concept and took advantage of [Google Cloud
Dataflow](https://cloud.google.com/dataflow/). At an Allegro scale it amounts to ten thousand and more events per
second. The classic approach would probably involve heavy, monolithic batch job using Spark that calculates these
metrics daily. Streaming architecture, on the other hand, yields results every minute for the last ten minutes or so. We
need this data in (almost) real time in order to measure the effectiveness of presented content.

The overall architecture pushes raw events from our internal Kafka to [Google Cloud
Pub/Sub](https://cloud.google.com/pubsub/docs/) through Kafka Connect. When anonymised raw data is available in the
cloud, we declaratively build data flows using [Apache BEAM](https://beam.apache.org/) abstraction over many streaming
engines. Additionally we used [scio](https://github.com/spotify/scio) from Spotify that provides more idiomatic Scala
experience to BEAM. We even [contributed](https://github.com/spotify/scio/commits?author=piter75) some bug fixes to
scio. Dataflow graphs we implemented calculate CTRs in real time, publishing results to [Google Cloud
BigQuery](https://cloud.google.com/bigquery/). Not getting too detailed, Cloud Dataflow worked well for us. It provided
rather smooth experience and fast feedback loop. I managed to push my first changes to production (*the* cloud) the day
I started in my new team. Unfortunately, we also experienced [20-hour long
outage](https://status.cloud.google.com/incident/cloud-dataflow/19001) of Cloud Dataflow - which was an important
lesson.

Stream processing is quite complex once you are dealing with real problems like late data arrival, processing vs.
creation time, understanding various windowing policies. My biggest "Eureka" moment was realising that stream processing
is no different than batch processing. But with small, often overlapping batches. I learnt that virtually all
non-trivial operations happen within windows, especially complex aggregations like grouping by key or joining two
unrelated streams. Truly eye-opening experience.

While getting back to my permanent team my head was full of ideas. Not only did I manage to deliver my small task but
also gained experience that can definitely impact my day-to-day work.

### Case study 3 ##### SEO - Bartosz Gałek In my everyday work I’m involved in developing [Opbox
Project](https://allegro.tech/2016/03/Managing-Frontend-in-the-microservices-architecture.html). For software engineer
like myself this project comes with a lot of challenges regarding high performance and traffic. Since my team rarely
interact with the main product area (we are a platform for them) - I’ve decided to try and learn something totally
different - a Search Engine Optimization (SEO) Team! I’ve done tourism few times so far - but this was my first time
away from the development sector. At the beginning, we agreed that the main goal is to exchange our experiences. While
working with web development - SEO was always one of the main concerns - but I’ve never experienced working with this
topic like I did during my tourism. Our SEO Team also had some web development talents, but never actually coded. On the
first day I was trained and lectured. I’ve been shown a lot of data and statistics about our users and I’ve been
introduced to a lot of team online tools. We also went through our site and discussed places were improvement should be
made. In general my tourism had two “parts”: Choose one of Allegro’s nearly 40k categories, and do something to improve
it’s Search Engine Result Page position. Fix a lot small issues throughout the platform, to allow Search Engines perform
better. It was astonishing two weeks. I’ve gained a new perspective - just by seeing how SEO Team works - hopefully some
experiences will change my everyday work forever. Not only could learn something new but also I was able to bond with
marketing part of the company (they’re really cool!). The best part was - I made tangible changes improving our site
search visibility. I’ve made over 10 Pull Requests in various projects and my category got to the TOP3 of major Search
Result Pages.

### Case study 4 ##### Hermes - Bartosz Balukiewicz On a daily basis I am a software engineer in the team developing
Allegro Smart. While building solutions in an event-based micro-service architecture, we use
[Hermes](https://allegro.tech/2019/05/hermes-1-0-released.html) extensively -  message broker based on Kafka, which
supports about 400 micro-services at Allegro. Hermes offers many functionalities and it is easy to use, but often there
is not enough time to understand exactly how it works under the hood. In case of any problems, such knowledge allows
faster and more effective response to failures and not being only a passive customer of the service. For these reasons,
I decided to have my team tourism at the Skylab Eden team, which develops and maintains Hermes at Allegro. My team’s
stakeholders are mostly business people so it was not only a great opportunity to change surroundings, but also a chance
to work for other engineers as well.

We decided not to take one main purpose of my tourism - I wanted to enter the team's everyday work, learn about its work
culture and feel as a real member.  During the intense month I managed to touch the core components of Hermes, fix a few
bugs, create a diagnostic tool and improved the management of its metrics. The result of this work was a pair of pull
requests in the open source project on Github. In addition, I also touched other areas in which the team works, such as
custom-made Captcha service and a global, scalable cookie management solution.

Of course, it was challenging to enter a rather large codebase of the multi-threaded code of Hermes - but thanks to
numerous tests it was not that difficult. The challenge was also to learn the entire Hermes testing and deployment
process, which is a responsible task, due to its criticality and complexity of architecture.

During the tourism, the thing I paid attention to was the work culture of the team. At Allegro every team is on duty
over its services, but in Skylab it is extended to the extreme. The use of such a critical service as Hermes requires
from the team a lot of concentration and deep knowledge, predicting possible problems and expressing their response to
them. Nevertheless, the team works in a great, friendly atmosphere. Every month, a kind of two-day hackathon is
organised, during which everyone uses new technology or algorithms and later shares the results of their work. This is a
great way to develop your knowledge, but also to integrate with the team.

In conclusion, after this monthly tourism I know a lot better where to look and how to solve problems when using Hermes,
I know what questions to ask, which allows faster response in case of problems. I also built a solid foundation for
further work on developing Hermes as part of an open source contribution. The big advantage of tourism is also an
ability to build relationships with new people and get to know their way of working.

### Case study 5 ##### Web performance - Adrian Rydzyński Currently, I’m working with the Anteater’s team. We’re taking
care of developing the list of offers on Allegro and we call it “listings”. This is a place, through which most people
pass through, so we’re trying to have availability and efficiency as high priority. To achieve that, I went to the
Webperf team, who’s taking care of performance and is trying to educate as much people as possible, that performance
matters. I was hoping to learn what we can do on listings to make it faster and more robust for our users. In addition,
they were building a new Single Page Application, which contains a homepage, listings and a view of a single offer.
Their goal was to gain knowledge about listings and I had to pass this knowledge. Both sides had their goals, but it was
clear, that we were going in the same direction. We didn’t specify exactly how many story points I had to make or how
many new features I had to transfer to my team. We wanted to do as much as possible.

My friends from Webperf team introduced me to their core project: Single Page Application called “mweb SPA”. It is worth
mentioning that in my daily job we have a component structure. That means listings are being built with many components:
list, filters, categories, articles, pagination etc. Another approach was chosen in mweb SPA. We have everything in one
big monolith component. Of course there are pros and cons of this solution. For example, the advantages of monolith
application are no communication issues between components or reusing your styles or data in many places. On the other
hand it is hard to work on the same codebase. You are stuck with the technology and you should get used to resolving
conflicts, because there will be a lot of them, when you work with more than several people. So it was kind of obvious
that there must be changes in my approach - both in the programming process and in the process of testing or releasing a
new version of mweb SPA.

My first assignment was to change the pagination - everything was done before the end of the day, however we had plenty
of discussions in code review - about tests, architecture, variable names and functionality. They explained to me why
they use certain solutions and I told them how we do it on listings. They didn't know about some features that the
listings API already has and that they don’t have to do the same job on their side and I understood why this kind of
architecture can be useful. During this two weeks team tourism I was able to make three more tasks: a generic component
for badges, replace old badges to the generic component and add SMART! logo to listings. Like the previous time, there
were many discussions and I noted some of their arguments to talk with my team about, because there were a few things
that we could do better.

I have to admit, I was surprised at how many meetings the Webperf team was involved in as consultants - both with dev
teams, as well as more business ones, dealing, for example, with the content of the home page. They also provided
research on the comparison of Allegro's performance with other websites. Of course, as a temporary team member I was
involved in all aspects. So many meetings went hand in hand with the disadvantages: my work was often interrupted, so I
was able to do fewer tasks than I initially thought.

Like I wrote before, my team tourism lasted two weeks. Almost all tasks were deployed for production during the exchange
- only one was deployed a few days later. When I returned to the Anteater’s team I added three new tasks to our backlog
and I arranged a meeting with my team, where I was able to tell everything what I learned from this exchange.

Summarising, I have a few thoughts after the team tourism. First of all, I think two weeks is too short. It should
definitely be four weeks, because I could take part in only one sprint and it was a little too short. When it comes to
advantages I can certainly say that this was a great experience. I was able to look at our product, which is the
listings, on the performance side, and not on the side of creating and developing the product. From now on, I have a
goal - at least one team tourism yearly.

My final thought is: not all users are browsing Allegro from their homes, with a super fast internet connection and an
expensive computer. We should always remember about the “mobile first” policy and take care about the performance of our
product.

## Summary All in all, we believe that team tourism is a great thing to do. Not only does it enable us to be more agile,
but also help us improve our skills. Moreover, the costs of organising that kind of trips are little to none. We are
working on pitfalls that we had, and we will continue to do team tourism.
