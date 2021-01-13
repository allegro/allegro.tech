---
layout: post
title: TDD is not dead yet — GeeCon Poznan 2015
author: ewa.bugajska
tags: [tech,tdd, geecon]
---
On January 30<sup>th</sup> we made a visit to [GeeCon TDD](http://2015.tdd.geecon.org/) to find out what’s going on in the world of TDD. Allegro was one of the sponsors
of the event and our colleague [Piotr Betkier](/authors/piotr.betkier/) appeared as a speaker. The theme of the conference was the broad subject of
software testing and TDD. The question for the conference to answer was “Is TDD dead?”. The major stars who came to Poznań
were Nat Pryce and Steve Freeman, authors of the book [“Growing Object-oriented Software, Guided by Tests”](http://www.growing-object-oriented-software.com/).

### Lectures

The conference took place in two parallel tracks with 30-40 minute lectures and breaks for coffee and lunch. The conference
was opened by Steve Freeman’s lecture “Test-Driven Development: That’s not what we meant”. Steve talked about writing bad
tests and what we should do to make tests more effective. He mentioned a number of principles concerning the tests which
some of us have probably already forgotten:

* How TDD works — Red-Green-Refactor.
* Eliminate Duplication.
* Incremental progress.
* Think before you code.
* Write readable code. The names of testing methods should be clear and simple. They should include information about what the
test does and what its effect should be. We should remember the test method should have as few assertions as reasonably possible.
* From simple to general. Writing tests we should focus on the simplest paths and implement the simplest behavior. Then
move to the more complex cases as well as to boundary conditions.
* Understand the problem. This is the foundation of a well-written software and an effective, correct test.
* Hard to write a test? Refactor. If you find it difficult to write a test, there is something wrong with your code and
you should refactor it.

He mentioned consequences of inefficient tests:

* difficult to understand,
* overspecified,
* obscure,
* brittle,
* meaningless failures.

The good thing about the conference was that there were only two tracks so there was no problem selecting a lecture which
we wanted to attend. I went to the lectures presented by Sandro Mancuso, David Weiss and Kuba Nabrdalik.

Sandro Mancuso’s presentation — “Driving well-crafted code through tests” was a reminder of the principles mentioned by
Steve Freeman — “from simple to general”. Sandro developed an algorithm converting Arabic numerals to their Roman counterparts.
Starting from the simplest tests he created the algorithm set in a few lines of code. And here is some advice from Sandro:

* Grow an algorithm bit by bit — choosing the right sequence of tests is essential.
* Focus on simple constructs first — complex constructs are harder to refactor.
* Intentionally cause duplication — identify patterns and remove duplication generalising the code.
* Delay dealing with exceptions — don’t introduce extra complexity too early.

One of the most interesting lectures was “Randomized Testing: When a Monkey Can do Better than a Human” by David Weiss.
The road from concept through implementation to running software is quite long and usually ready software is far from
the original idea and the assumptions that existed in the beginning of the project. API that we have created is not always
what we expected and its performance depends on the environment in which it’s run. As an example, he brought up the use
of a `String.toLowerCase()` method with Turkish locale.

```
assertEquals("billy", "BILLY".toLowerCase(new Locale("tr","TR")));
```

It’s easy, we should get “billy”, but the effect is quite surprising. Apparently the problem is known and is a nightmare
for many developers. For the curious, more on this topic can be found here: [default locales](http://blog.thetaphi.de/2012/07/default-locales-default-charsets-and.html).
David showed a nice library which checks Java byte code against a list of “forbidden” API signatures. It can be found here: [forbidden apis](https://code.google.com/p/forbidden-apis/).
He suggested a short manifesto consisting of the following points:

* Each run covers a different execution path.
* Each run is deterministic.
* Tests are repeated many times.

The purpose of tests randomization is to check software compatibility. We can randomize the input data, iteration counts, arguments
or the environment for example Locale or TimeZone.  And what does that give us? We examine the complex boundary conditions, unexpected
behavior and interactions of components and the environment. The downsides are not deterministic results and difficulties in debugging tests.
Example ideas and assumptions can be found here: [randomized testing](http://labs.carrotsearch.com/randomizedtesting.html).

Another interesting presentation was “Test Driven Traps” by Jakub Nabrdalik. He showed us the most common mistakes we make when
writing tests and how to avoid them. This is what we should focus on:

* Testing the behavior and not only the algorithm.
* Performance is crucial for our tests.
* Verifying only one behavior per test.
* Good naming.
* Don’t mock everything.

Our colleague Piotr Betkier presented the features of [Spock](http://docs.spockframework.org), why it is so cool, and why we like it. The main advantage is
that the tests written in Groovy and Spock are clear and simple. Reading tests written in Spock is very similar to reading a
text in natural language sentence by sentence, like a book. The code presented during this talk is available at [Piotr’s github](https://github.com/pbetkier/spock-demo).

Marcin Zajaczkowski in his lecture “Java 8 brings power to testing” presented how Java 8 supports testing. [Java 8]({% post_url 2014-12-09-How-to-migrate-to-Java-8 %}) provides
fields extraction, clear and verbose error message and smart asynchronous call testing — no more `sleep()` in tests.

The culmination of the all-day event was Nat Pryce’s lecture — “Lessons Learned Breaking the (TDD) Rules”. Nat Pryce talked
about his experience in testing set-top boxes. He said that it’s not just about writing tests, but about the feedback you get from them.
You should not write tests only for the sake of writing, but in order to obtain information about the code.

### Organization

When it comes to an organization, certain elements could be better planned. The conference took place in a fairly small cinema.
With such a large number of people in the breaks between lectures in the hall it was getting quite crowded and long queues
formed to coffee and tea. Lunch was organized in not entirely comfortable conditions. It was planned in the 40 minute break,
but the queue was so long that meals had to be issued even during the next lecture, not to mention the fact that you
had to eat it on your lap or standing with a plate in your hand. The portions were not very impressive either.

### Overall Impressions

The conference organized in Poznań was quite successful. I prefer concise, subject-oriented conferences — one issue
presented in various ways. At first I was rather sceptical. I was worried that it would be another conference in the series
“been there, done that”. I was pleased to be disappointed. The fact is that the subject is known and probably everything about
tests has already been said, but it was very pleasant to listen. I have never had doubts that writing tests is a must and adds value.
However if I had any second thoughts, this conference would surely reassure me that having tests on top of priority list is a good idea.
