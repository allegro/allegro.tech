---
layout: post
title: "[April 1st] From PHP to Java and back again: a retreat from microservices"
author: piotr.betkier
tags: [tech, php, java, monolith, microservices]
---

> This post was published on April 1st, 2019, and should not be taken too seriously.

Five years ago we started a major technological transformation of the [Allegro]({% link about-us/index.html %}) platform.
Since then, we’ve been moving from a monolithic, 10 mln lines of code PHP application into a system of
800+ JVM‑based microservices. This new architecture however turned out to be a dead‑end,
that we can no longer afford to follow. Today, April 1 2019, we announce going back to
our roots, hoping to rewrite all our JVM microservices into a single PHP application
by the end of the year.

## Current situation

After 5 years of doing microservices we now have 800+ services running in production.
Most of them are written in Java or Kotlin and based on Spring Boot. We make dozens of
releases to production per day. These technical metrics don’t capture however how complex
our system has become.

<p align="center">
  <img alt="Complexity of our system over time"
    src="/img/articles/2019-04-01-from-php-to-java-and-back-again/complexity.png">
</p>

We need something radically simpler in order to stay at the top of our highly competitive
e‑commerce market. We need the simplicity and reliability of PHP.

## Rationale for change

The biggest disappointment we have with our current JVM microservices architecture
is the time it takes for a single feature to land in production and serve our users.
We blame that mostly on the static-typing of Java and Kotlin. It makes the code verbose
and encourages creating a lot of domain-specific types. Since low time to market
is essential in e‑commerce, we began to value the expressiveness of PHP.

<p align="center">
  <img alt="Time it takes to develop a feature"
    src="/img/articles/2019-04-01-from-php-to-java-and-back-again/time.png">
</p>

Also, the PHP community is less obsessed with automatic testing. As a result, engineers
waste less time writing test code and more time writing code that actually ends up
in production. In our experience technical debt works just like financial debt –
it’s not a problem as long as you are creative in not paying it off.

Canary deployments are a standard now and PHP enables this practice by design.
It’s as easy as accessing a production machine via SSH and modifying a file in the terminal.
Changes are available to the end-user right after the code is written.
This agile process allows our engineers to verify their ideas quickly, before submitting
their changes to the main repository. The same process can be used for applying quick fixes
in production. Java and Kotlin didn’t give us such powerful tools.

Dropping the microservices architecture in favor of monolith will also simplify our
infrastructure a lot. It means fewer applications to manage so less orchestration needed
around them and fewer people involved in running the system. This means more engineers doing
the actual, productive work – churning out forms for our website and crafting JSONs for our APIs.

## Migration

We decided to start small. 3 months ago we selected 7 engineering teams which are now
transforming their JVM microservices into a single PHP application. We help our engineers
adapt to the new technology by providing them with dedicated trainings, aiming to rid them
of their bad habits from the JVM world.

One of such training sessions is something we call a Testing Detox. We found that many Java
and Kotlin engineers are obsessed about having their code covered by automatic tests, finding
it hard not to engage in compulsive test writing. During Testing Detox sessions they practice
creating huge amounts of code without a single test case and see for themselves that nothing
bad happens. Behavioural psychologists leading these sessions make sure all engineers
have the support they need.

<p align="center">
  <img alt="Average anxiety levels in engineers about committing untested code"
    src="/img/articles/2019-04-01-from-php-to-java-and-back-again/anxiety.png">
</p>

We also help in transitioning from microservices to monolithic architecture by organizing group
meditations for our engineers. It allows them to incorporate the spirit of solidarity and unity
that they will so desperately need in their day-to-day work.

Overall the migration is going smoothly. We’ve migrated 35 microservices during these first
3 months and will soon ensure each engineering team adopts the new approach.

## Positive effects

We’ve seen a lot of positive effects from the several teams already working in the
new architecture. First of all, having a large number of engineers committing to one
repository helps introduce diffusion of responsibility to our culture. This leads to
having engineers that are not overly concerned about their product and keeps them
relaxed and productive.

Our engineers have also become more productive, because they can now develop their
code in lightweight editors like vim or emacs instead of using memory-consuming
tools like IntelliJ. This allows them to code while having their memory-demanding
Slack communicator open at the same time!

Our users also seem to be satisfied with the change. They used to have new features available
to them a couple times a week. Now they get stable releases once a month, which means
less cognitive load and a sense of security. We hope to release in even longer iterations in the future.

<p align="center">
  <img alt="User happiness against release frequency"
    src="/img/articles/2019-04-01-from-php-to-java-and-back-again/happiness.png">
</p>

Lastly, by adopting PHP that is so widespread in startups, we hope to prove that when
we say we have a startup culture we really mean it.

## Conclusion

We’ve started our journey back to PHP monolith and are excited about the results. We
believe that this will become a trend, as more and more companies become disillusioned
about microservices and JVM languages. With rumors of Google working on support for
PHP cloud functions, PHP monolith seems to be the technology choice of the future.
