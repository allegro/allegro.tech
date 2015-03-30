---
layout: post
title: "Allegro OpenSource: tradukisto"
author: dorian.sarnowski
tags: [release, open source, java]
---

At Allegro we use many open-source tools that support our work. Sometimes we are not able to find what we want and this is a perfect moment to fill a gap and
to [share with a community](http://allegrotech.io/open-source/). We are proud to announce an initial release of [Tradukisto](https://github.com/allegro/tradukisto) — a small Java library created to
convert numbers to their word representations.

###Backgound and motivation

I work as a software developer in a team which delivers solutions for the financial department. Currently we are
[extracting the invoicing system](http://allegrotech.io/working-with-legacy-architecture.html) from PHP monolith platorm to the architecture of Java
microservices. One of the business requirements we had was to display amount as a text in given languages on invoices and other financial documents.

This is a quite common challenge. On the web there are many examples of code that does the job. The problem is that
[most of that code](http://stackoverflow.com/questions/3911966/how-to-convert-number-to-words-in-java) is not production ready.

We needed something that suits our needs. This tool should:

+ support every language we use (Polish, Czech, Ukrainian, Russian, ...),
+ be available from maven repository, we definitely didn’t want to copy-paste some classes into our codebase,
+ be still maintained and able to accept pull requests,
+ be well tested.

We coudn’t find any tool that met all these requirements, so we decided to created Tradukisto.

###Name

The origin of the name Tradukisto is [quite straightforward](https://translate.google.com/#eo/en/tradukisto). Esperanto was the first language we found
in which a word “translator” sounds just right :).

###Actual status and plans

The only language currently supported is Polish. We are planning to add support for Czech, Ukrainian and Russian in a matter of two months.

###Source code

Code is available via [GitHub repository](https://github.com/allegro/tradukisto). We have attached code samples and an installation instruction as well. Feel free to use this library and especially
to participate.
