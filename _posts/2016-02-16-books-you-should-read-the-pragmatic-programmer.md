---
layout: post
title: Books you should read&#58; The Pragmatic Programmer
author: michal.kosmulski
tags: [books, pragmatic programmer, software craftsmanship]
---

Some books on IT topics become outdated right after they are published while others stand the test of time.
One of the latter is [The Pragmatic Programmer. From Journeyman to Master](https://pragprog.com/book/tpp/the-pragmatic-programmer) by
Andrew Hunt and David Thomas.

<img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/The_pragmatic_programmer.jpg/240px-The_pragmatic_programmer.jpg"
alt="The Pragmatic Programmer by Andrew Hunt and David Thomas — book cover"
style="float: right;"/>

_This book will help you become a better programmer_, claim the authors, and they are true to their word. What they wrote is not about any
specific language or framework but rather about being a programmer in general. The few examples of actual code are in C++, but don’t be
put off even if you’re not familiar with this language — they are simple and just illustrate the ideas described in text.

Most of the advice you find in the book is very common-sense and may even sound obvious to more experienced developers. However, I have
interviewed dozens of people for software development jobs and it never ceases to surprise me how many of them, even those running for
senior positions, do not fit the characteristics of a pragmatic programmer. So, if you are only beginning your journey as a programmer,
this book is a must-read. If you already feel more experienced, it is still a very good read that can remind you of some things you may
already intuitively know but not be fully aware of and to highlight some aspects of your work you might be underappreciating.

In the context of this book, _pragmatic_ means being focused on a practical approach to solving real-life problems and choosing the right
tool for the job. Below are some traits of a pragmatic programmer which the authors list in the preface. People change much slower than
technology, so these properties are just as important today as they were in 1999 when the book was published.
I would argue that due to today’s technology landscape being much more complex than 15 years ago, they are even more important today
than they were back then:

* __early adopter/fast adapter__ — Technology marches on. Staying up to date allows you to fully take advantage of new tools as they become
available. On the other hand, there are so many different languages, frameworks and libraries on the market that you can’t reasonably
expect anyone to know them all. So rather than knowing all tools, it becomes crucial to be able to learn new tools quickly as you join
new teams and move on to new projects.
* __inquisitive__ — Knowing how to use a tool is one thing. Knowing how it works under the hood is another. Take [Spring](https://spring.io/)
for example. Developers sometimes stop at being able to use it in their apps but do not understand what happens behind the scenes when they
create a bean or use some magic annotation. The result is that when something breaks they are not able to analyze and fix the issue. An
inquisitive developer should always strive to understand how things work, even if it means leaving their comfort zone such as learning about
low-level details of Spring when you just write typical CRUD applications most of the time.
* __critical thinker__ — Think about the goal you want to achieve and use the right tool. Whether analyzing an algorithm, looking for a
bug or tuning performance, treat your conclusions with skepticism in order to make sure the data really shows what you think it
does. If your opinion on some issue differs from the rest of the team, discuss it and don’t just settle on “we’ve always done it
this way”. This does not mean being stubborn just for the sake of it, of course, just making sure you really know why things
are done the way they are.
* __realistic__ — Try to be realistic in your estimates and avoid overt optimism or pessimism. Also, be realistic when it comes to judging
your own skills and knowledge. Being able to tell what you are good at and what your weaknesses are will allow you to improve.
* __jack of all trades__ — Software development is much more than just coding. Today, programmers, especially seniors, are expected to know
something not only about writing code but also about application architecture, scalability, databases, deployment and monitoring. The
rise of DevOps allows teams to quickly deliver new software to their users but it also rises the expectations on developers’
knowledge which needs to be pretty broad.

Incidentally, these are also traits we look for when hiring people to work with us at Allegro.

Some tips in the book pertain to individual programmers while others are aimed at development teams. Even though published before
the [Agile Manifesto](http://agilemanifesto.org/), this book contains most of the common-sense tips for good teamwork later found in Agile
methodologies. _The Pragmatic Programmer_ was also one of the works that sparked the idea of
[Software Craftsmanship](https://en.wikipedia.org/wiki/Software_craftsmanship).
Some advice is presented as short tips, among them gems such as: _Don’t Assume It—Prove It_,
_Abstractions Live Longer than Details_, _Don’t Live with [Broken Windows](https://en.wikipedia.org/wiki/Broken_windows_theory)_ or
_Refactor Early, Refactor Often_. Full list of tips extracted from the book is
[available online](https://pragprog.com/the-pragmatic-programmer/extracts/tips).

One example of what being a pragmatic programmer means in practice came to me recently when my team was starting work on a new project.
As you may know, at Allegro we are very much into microservices and scalable architecture, which, among other things, means that we almost
exclusively use [NoSQL databases](https://en.wikipedia.org/wiki/NoSQL) such as [Cassandra](http://cassandra.apache.org/) and
[MongoDB](https://www.mongodb.org/). However, we had to perform some operations which could very easily be accomplished with transactions
which are not readily available in most NoSQL solutions. After discussing this problem, we
were able to estimate that this particular application, which was a tool for use only within the company, would not need to
store a lot of data or handle huge numbers of requests. Thus, scalability played much less role than in other systems we build and
finally we settled on using [MySQL](https://www.mysql.com/), a relational database, which we would normally not even consider an option.
This gave us easy access to transactions. An extra benefit was that MySQL is maintained for our developers as a service, so setting up a
new database is very simple and the DB is managed and backed up by a dedicated support team. If we had to set up and support the DB by
ourselves, we might have made another choice — ease of maintenance is an important factor when making pragmatic decisions.

By taking a pragmatic approach and concentrating on the actual problem at hand instead of blindly following slogans such as “at this
shop, we build highly scalable systems”, we were able to find a better solution and save a lot of effort.

I encourage you to read _The Pragmatic Programmer_ and hope you find it as insightful as I have.
