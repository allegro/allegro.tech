---
layout: post
title: We visited Devoxx 2014
author: adam.dubiel
tags: [devoxx, conference]
---

[Devoxx](http://devoxx.be) (formerly JavaPolis) is an annual Java-centric conference organized by [BeJUG](http://www.bejug.org/) that
takes place in Antwerp, Belgium. Such a big Java event can‘t go unnoticed by Allegro. This year five representatives
of our company had a chance to experience five full days of Devoxx.

## Devoxx University

We started with two days of Devoxx Univeristy sessions. Schedule looked scary at first, since it contained two 3-hour long
sessions in the morning followed by multiple 30-minute talks after lunch. To our surprise morning block, which we expected would serve as a way to make up for lost sleep after tasting delightful Belgian beers, turned out to be one of the
highlights of the whole Devoxx experience.

During these sessions I had a chance to gain in-depth knowledge of Java 8 lambdas during **Lambda, from the Dark Age to
the Infinity and Beyond** conducted by one of lambda implementers, Remi Forax. He went from lambda syntax, through
internal implementation and JIT optimizations to bytecode analysis. Time well spent for every power user of Java. On the
other hand there was a more high-level talk about writing reactive software by Venkat Subramaniam, which served the purpose of
organizing knowledge and giving more structure to things we already know, but which we never defined in a formal way.
Another great university talk by Venkat Subramaniam was **Using Traits, Mixins and Monads in JVM Languages**. Very well given
talk about Traits and Mixins in Scala and Groovy, and how they help us create better code. Venkat also showed how they work
under the hood, giving background which is necessary to understand how they can be composed and how they tackle the diamond problem.

University days were also about getting to know new tools and their practical usage. This is how we learned about
[mjprof](https://github.com/AdoptOpenJDK/mjprof) and [Algebird](https://github.com/twitter/algebird)
([slides](http://www.slideshare.net/samkiller/algebird-abstract-algebra-for-big-data-analytics-devoxx-2014)), not to mention
some crazy tips on how to drop mouse altogether and move to bash console supported by ncurses tools like
[tig](https://github.com/jonas/tig) and of course evergreen [vim](http://www.vim.org/) on steroids.

## Devoxx conference

### Keynote

University was a nice warm-up before the main event — the conference itself. It all started with a big bang — at least for us, Poles. Next year Poland will join Devoxx family: Devoxx Poland will be hosted in June in Kraków. Stephan Janssen announced also the start of voxxed.com, a platform aggregating content for developers. Other than that, no really big news nor inspiring thoughts have been shared.

### Lectures

Even after splitting our crew, we managed to visit just a few out of an overwhelming number of interesting lectures. Nevertheless we
felt like being hit by a truck carrying several tons of condensed knowledge. Lectures that definitely deserve to be
mentioned are:

* Spotify: audio delivery at scale — 10 000 feet view on Spotfiy architecture, testing, efficiency measurements and work culture
* Project Jigsaw ([slides](http://cr.openjdk.java.net/~psandoz/dv14-jigsaw.pdf)) — in-depth talk about bright future that awaits us after the release of Java 9: what it is and what it
is not
* Dagger 2 ([slides](https://speakerdeck.com/jakewharton/dependency-injection-with-dagger-2-devoxx-2014)) — lecture with probably the best slides during whole conference, very well structured and prepared
* What have the Monads ever done for us — Dick Wall gave a brief overview how concepts like a monoid, functor or monad translate to the code we work with every day
* Using Clojure for Sentiment analysis of the Twittersphere ([slides](http://www.slideshare.net/garycrawford/using-clojure-for-sentiment-analysis-of-the-twittersphere-euroclojur)) — do you know what Datensparsamkeit is? Gary Crawford show how he implemented a solution which analyzed twitter posts and predicted how people feel in various parts of the world

Of course not everything was so great. Hazelcast talk reminded us how bad their API is and that probably only people
who have never seen current Map/Reduce implementations can feel excited by what they have to offer in this area. Mesos
presentation seemed chaotic, Live Demo Gods made sure that whatever was supposed to work on live Mesos cluster,
failed. All in all it was no match to perfectly conducted Kubernetes presentation, which gathered so much audience it
took us 10 minutes to get out of lecture hall after it ended.

## Organisation and venue

Devoxx is a really big event, and so it needs a really big venue. That is probably why it is held in a huge cinema complex.
Still, it proved to be not big enough. While it was already quite crowded during University days,
conference days showed us what *crowded* really means. Tremendous queues before each lecture combined with poorly
organised evacuation of lecture halls made us reluctant to change once we had taken seats and forced us to look for long
streaks of promising lectures that took place in one hall.

Another mishap was catering. Although we did not come there to eat some fancy stuff, a couple sandwiches during the day would
be more than welcome. Instead, meals were served only during mid-day lunch break and one needed to spend a notable amount
of time in unnecessary queues in order not to die from starvation. It was the same with evening snacks and beer.

Last major issue which affected Devoxx as a whole was a very poor voting system. In theory, it prevented people from voting
more then once, as it required an NFC chip located on wristband to be swiped by special voting sensors. However in practice
voting devices where very inaccurate and it took several tries before the vote would be registered. This meant that people
just gave up on voting in order not to create jams while leaving the lecture halls.

On the bright side, WiFi worked like a charm during whole event. Not even once were we forcibly disconnected or had problems
with finding range or connection. I don‘t know how they achieved this, but chapeau bas, gentlemen.

## Trends

After 5 intense days we sat down with glasses of Belgium‘s finest beers in our hands and discussed overall impressions
and trends each one of us observed. The most noticable one is: Java 8 sells. There were 6 talks concentrated purely
on the mix of Java 8 features like streams, collectors and lambdas and all of them were attended by a great number of people.

Secondly we‘ve seen a great number of lectures covering Java EE which tried to prove how EE stack can be used in
microservice architecture. My impression is: they are fighting a lost cause. Mainly due to the number of twittable
catch-phrases that flooded #devoxx tag after each JavaEE talk. One of them being an apples vs. oranges type of comparison:
amount of memory an application server consumes as opposed to memory allocated by a modern web browser (!).

Other hot topics where Google Material Design, RaspberryPi and application deployment in general (Docker, Mesos).
Surprisingly only a couple of lectures where devoted to Spring — one of them being a rather uninteresting recap of new
features presented in Spring 4.1 and Spring Boot.

## All in all..

...visiting Devoxx 2014 was definitely worth it. Apart from some organisational issues, it proved to be a very mature
conference with very strong lineup. If you are looking for a place to meet Java Champions, get to know newest trends and
the future of major tools and libraries (including JDK itself) Devoxx is the place to be.
