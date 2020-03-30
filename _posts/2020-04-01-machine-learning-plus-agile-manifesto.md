---
layout: post
title: "Machine Learning + Agile Manifesto = ?"
author: zbigniew.barczyk
tags: [tech, machine_learning, agile, soft_skills]
---

Another sprint, another retrospective. You use new formulas, you gather insights, you vote
and you have action points.

## “We have to communicate better”

Have you heard it in your team? Like a curse, 'action point' stating that “we have to communicate better”.
The agile manifesto states “Individuals and interactions over processes and tools”.
We try to be aware of <a href="/2018/03/psychological-needs-at-work.html">psychological needs at work</a>
but sometimes wef fail to find what we do not want to do. Let’s face it, in IT we do not like communicating.
It’s something we constantly avoid. We had invented daily standups to squash all interactions into one.
Why respond to N people when you can sacrifice two minutes to tell everything the world has to know?
At some point, this is not enough. Then we introduce quiet time. We switch off our emails, phones,
communicators, we do not take guests in the room. We are offline for one or two hours.
Sometimes we even invert this idea and use “communication hours” outside which you are forbidden to
talk to your colleagues. And If we have more than two hours of meetings during the day
we make post-it on retro.

<p align="center">
  <img width="500"
    alt="Calendar with 45 minutes before meeting stating: Don't want to get into anything because meeting is coming and: Ramping back up after being distracted by meeting"
    src="/img/articles/2020-04-01-machine-learning-plus-agile-manifesto/developer_calendar.png">
    <br/><span style="font-size: 12px; color: grey">Tweet by <a href="https://twitter.com/phil_wade/status/896010517617180672" rel="nofollow">Phil Wade</a></span>
</p>

And because our team leaders know importance of
<a href="/2019/06/allegro-culture-tech-leaders-meeting.html">constant feedback</a> we adjust.
We start choosing team delegates to meetings, we introduce a “developer on duty”
who takes care of all incoming communication. When it’s my turn I know it won’t be a good week.
But at least the rest of the month is better. And then we are surprised that even in our small team
information asymmetry starts destroying our decision-making process.
When other teams are becoming involved situation gets even worse. Although <a href="/2019/09/team-tourism-at-allegro.html">team tourism</a> helps a little.
We start seeking solution. And when we cannot find one what tech guys do? Transform problems.
So we introduce microservices to get a lot of technical problems in exchange for human resources problems.
And this works brilliantly.

## Taking it one step further

But aren’t you tired of solving the same issue all the time? We all want to be well informed:
product owners, developers, team leaders. Recruiting specialists, retrospectives,
spawning demo meetings for the whole department, ad-hoc meetings, soft skills training
and we still have communication problems.

All RACI assignment matrices are missing someone, all data is outdated although we resolve problems
one after another. And there is a single root cause. We, humans, aren’t well designed for communicating.
Because we fail miserably at multitasking. And when it starts consuming too much time
we just stop doing it properly.

<p align="center">
  <img width="500"
    alt="Story point function suddenly increasing heavily with pair of humans, one of them saying: ...and we decided that each meeting is worth one point"
    src="/img/articles/2020-04-01-machine-learning-plus-agile-manifesto/meetings_worth_points.jpg">
    <br/><span style="font-size: 12px; color: grey">Image by <a href="http://geek-and-poke.com/geekandpoke/2017/2/14/meetings-points" rel="nofollow">Geek & Poke</a></span>
</p>

## Project “Genesis”

So what if we wrote a program that just knows everything about Allegro Tech. Well you know we can’t. But it’s 21 century.
IBM Watson wins at Jeopardy, DeepMind AlphaGo beat a world master at Go game and Boston Dynamics makes Atlas robot that
<a href="https://www.youtube.com/watch?v=LikxFZZO2sk" rel="nofollow">can do parkour</a>. Today we introduce Humanoid Allegro Learner (HAL),
the best personal company manager, to the world. Let’s take a quick look at the architecture.

<p align="center">
  <img width="800"
    alt="Overcomplicated graph where everything is detailed but the most important element has title: Magic"
    src="/img/articles/2020-04-01-machine-learning-plus-agile-manifesto/graph_details.png">
</p>

There's a lot happening on this diagram so let's extract some abstractions. Basically, HAL performs man-in-the-middle
to all of our communication tools. It interprets messages, matches it to our database and if it can it
cuts the communication by serving the response. Message is transmitted to the end-user only as a fallback when no data is found.
Following diagram is equivalent and somehow easier to understand.

<p align="center">
  <img width="800"
    alt="Graph showing that all input channels like slack, e-mails, code ar treated as data, processed by machine learning and returns results on Slackbot, e-mail, virtual meetings"
    src="/img/articles/2020-04-01-machine-learning-plus-agile-manifesto/graph_simplified.png">
</p>

There are some mistakes we have made during development:
- In the first test on real users, we found they didn’t trust HAL, treating it as dumb machine,
  we had to hide this information from them not to irritate our precious AI;
- It is very important in Machine Learning to choose a good performance indicator,
  at first our accuracy on dry run seems very low about 60%. After weeks of trying to optimize the algorithm
  we found that actually HAL responses were far more relevant. We have found out that human slack messages
  on #help-me channels were misleading and inaccurate;
- We had to compress our input data. It turned out that after synonyms detection denormalization eliminated 86% of data.

## Summary

First, we introduced our model in the form of a slackbot. HAL reduced communication by nearly 97% so team development boosted.
Zoom virtual assistant is currently in beta testing. We have some problems with it since it interrupts the speaker immediately,
without giving him a chance to express full thought. Programmers can work on code, get in the flow without interruptions
cause HAL handles the rest. HAL, I hope I will see you soon in every company.

<p align="right">
* Have you noticed? This article was written by our beloved HAL
</p>

