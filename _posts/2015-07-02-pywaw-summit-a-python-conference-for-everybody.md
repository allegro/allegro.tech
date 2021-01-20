---
layout: post
title: PyWaw Summit - a Python conference for everybody
author: szymon.jasinski
tags: [python, PyWaw, PyWaw Summit, conference]
---

Recently I had a chance to take part in the first edition of a new Python event in Poland, [PyWaw
Summit](http://summit.pywaw.org/) conference. Python has a very active community in Poland, Europe and around the globe.
What sets the community apart is its accessibility and friendliness. After all, as mentioned by Marc-André Lemburg in
his [PyWaw Summit day one keynote](https://downloads.egenix.com/python/PyWaw-Summit-2015-Python-Community-Keynote.pdf),
the language is a tribute to Monty Python, and is designed to be fun. The fun factor and friendliness were evident at
PyWaw Summit, a conference organized by [Warsaw Python User Group](http://pywaw.org/). Being a sysadmin in my first ever
conference devoted to programming only, I felt very welcome and got a lot of very useful first hand information on the
newest features, trends and techniques from Python professionals.

The conference took place in Polonia theater, in the busy and bustling centre of the Polish capital, just a few steps
from the many Warsaw’s hotels and restaurants. There were many speakers from Brazil, Czech Republic, Germany, Great
Britain, Poland and USA, and just as many great talks.

## From programming robots to snakes and elephants

A novice, a seasoned programmer or even a robot constructor could find something for themselves at PyWaw Summit. Have
you ever considered assembling or buying your own robot and programming it? If you have, then you may be very happy to
hear that, as proved by Katherine Scott in her live [ROS
demonstration](https://github.com/kscottz/PyCon2015Talk/blob/master/RobotsRobotsRARARA.ipynb) on stage, there is no need
to reinvent the wheel - there are tools readily available. Just download [ROS](http://www.ros.org/), the Robot Operating
System (guess what language it is largery written in). The best part of it all is that ROS, a professional piece of
software, can be used by an amateur robot programmer, free of charge.

What about something more down to earth like writing concise, beautiful code, making it easyly changeable and more
portable at the same time? There are a lot of good practices and rules to follow. Among them the [single responsibility
principle](http://ignacysokolowski.github.io/single-responsibility-principle-talk/), a rule stating that each function
or class should have one responsibility only. After Ignacy Sokołowski’s talk about single responsibility principle, a
very interesting discussion followed on the benefits and drawbacks of this approach. The conclusion was that while not
everybody likes single responsibility principle, there are benefits from using it, including the decrease of time
required to change your code in case of a dependency change, and easily reusable code.

A talk about [falling into the rabbit hole](https://speakerdeck.com/asendecka/into-the-rabbit-hole) by Ola Sendecka was
a great insight into what sometimes goes on in a programmer’s head. What to do if you get so fixed on a problem that the
solutions you come up with are making the code messy and your programmer’s conscience dirty? This could be a signal that
you are getting deeper and deeper into the rabbit hole. Get out of it while you still can! An interesting discussion
 ensued about being on a roll versus being in a rabbit hole. Everybody has to decide for themselves whether being on a roll is
a good thing or bad, but some tips like encouragement to program in pairs or to plan breaks (and stick to it!) were
something worth remembering.

If you consider using Python 3 in real life, you are not alone. Facebook already does, as pointed out by Łukasz Langa in
his [talk](http://fb.me/call-me-later). What is the biggest gain?  Concurrency and
[asyncio](https://docs.python.org/3/library/asyncio.html).

It is now possible to make elephants cooperate with snakes, or in other words to execute Python code from within
[PostgreSQL](http://www.postgresql.org/). You can write a library in Python and then call it from a trigger in
PostgreSQL. Great stuff and yet another reason why Python is cool (and PostgreSQL too!). Refer to Jan Urbański’s
presentation on [snakes and elephants](https://wulczer.org/pywaw-summit.pdf) for more details.

One may think that a laptop is just a laptop, editing text files should be the same on any of them. But, as Brandon
Rhodes demonstrated in his PyWaw summit day two keynote, there are some very good reasons to [tune a programmer’s
laptop](http://rhodesmill.org/brandon/slides/2015-05-pywaw/keynote/). It does not have to be anything major. How about
keeping configuration in your home directory under version control, for instance? If you do, setting up a new laptop
after a crash of the old one is just a matter of minutes. Many simple improvements can accumulate to turn your laptop
from a dull device into a sharp tool which allows you to focus on your core work and not to be distracted.
Brandon suggests that it is worthwhile to invest an hour weekly or so in improving your toolset.

A simple yet powerful tool talked about at the conference by Szymon Pyżalski (representing Allegro Group) is
[RQ](http://python-rq.org/) - a Python and [Redis](http://redis.io/) library for queueing jobs. It is very easy to set
up and does the job it is designed for very well. And it is not difficult to learn. It may have some drawbacks when
compared to bigger projects, as it turned out in the discussion that followed the presentation, but its simplicity makes
it a good choice in many circumstances. Refer to Szymon’s [presentation on RQ](https://github.com/zefciu/rq-pywaw) for
more details.

These and many more topics were talked about at PyWaw Summit.

## The audience had a voice

In the lightning talks the audience had a chance to share their Python experiences and achievements. Things like a testing
library that allows running only these unit tests that were affected by code change, automating your home with Python and
Raspberry Pi or even just sharing with the audience that you love to code.

## Conclusion

The organizers of the event did a great job and received a very positive feedback in social media. The word got spread
and chances are that the next edition of the event is going to be even better. I look forward to attending the second
edition of PyWaw Summit next year.
