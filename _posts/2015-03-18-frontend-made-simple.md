---
layout: post
title: Frontend made simple
author: bartosz.galek
tags: [tech,frontend, bootstrap]
---

Hello stranger. It’s your first day as a fronted developer. Here is your brand new desk, computer and stuff.
Enjoy your work! Oh, I’ve almost forgotten! You’ll need to read this 500-page Design Manual to know what are we aiming for.
Don’t worry, it’s really simple — there are a lot of examples there. It’s written in two languages, every line is commented
and we will occasionally ask you about some random padding — just to be sure — that you have learnt everything well… — **is there any company still working like this out there?**

…Please make a lot of notes inside it — everybody does. You’ll have to meet up with other developers to check which
designs are outdated and which ideas have changed. On the last page you will find instructions what to do if you need to
change something to fit your needs — it’s very easy. You’ll need to make an appointment with Design Manager who will decide whether your idea is agreeable.
Then you’ll need to make changes in the Design Book that have to be approved by the Design Book Team and the CEO secretary.
Once the changes are approved, you’ll need to ensure that every other developer has updated his views. Your work will be like hell, but don’t worry.
Every big company has their issues.

## Say what?
Of course — this is fiction, more or less. But I’m sure that everybody working in a bigger company would believe in such scenario.
At Allegro Group we were going a similar direction as mentioned above, but inside we felt that it was a very complex and not agile thing to do.
Inspired by [Twitter](http://twitter.com/ "Connect with your friends — and other fascinating people.") and their [Twitter Bootstrap](http://getbootstrap.com/ "Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.") package, we created an idea of our own unified style framework.
Because we like to concept–proof our ideas fast, during one of the company’s hackathons frontend developers
rewrote some parts of our platform styles into a “bootstrap–like“ library.
It was kind of a little success — frontend community decided to continue to develop our own Allegro Bootstrap.
During the process we had a lot of discussions and opportunities to meet more often and to work with web developers we usually
don’t see everyday because people work within different projects. [Twitter](http://twitter.com/ "Connect with your friends — and other fascinating people.") was an inspiration for us, so we wanted to follow the well–known bootstrap markup.

We had the following steps planned:

1.  **Fork bootstrap repository** and adjust it to our needs

    To start fast, we needed a good and well–known base. We discussed other frontend frameworks and decided to make Twitter Bootstrap our **master branch**.

1.  **Start developing our Allegro Theme**

    We used all available [Twitter Bootstrap](http://getbootstrap.com/ "Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.") theming options to create the first theme to meet our expectations. We begun with small things trying to unify our styles.

1.  **Drop original bootstrap dependency**

    We wanted our bootstrap to be even better then the original source. We continued to cut out unnecessary original code, replacing core elements with our own ideas and those that we didn’t need. After all, we want to be independent and self–reliant.

1.  **Have a light and flexible, [Twitter Bootstrap](http://getbootstrap.com/ "Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.") like library**

    Now we are close to the perfectly tailored frontend framework that suits our needs.

![Allegro Frontend Bootstrap tabs example](/img/articles/2015-02-19-frontend-made-simple/tabs.png "Allegro Frontend Bootstrap tabs example")

Today we are happy to say, that we have a very advanced yet simple to use frontend library that we are proud of.
We also had rewritten the documentation; a lot of "out–of–the–box" code snippets and usage examples help us in everyday work.

### We experienced some additional advantages:

*   **Minimal knowledge is needed to start a simple project**
    It’s simple for our UX experts to copy &amp; paste short code snippets and start to work with designs. They don’t need to have a great knowledge of HTML/[LESS](http://en.wikipedia.org/wiki/Less_%28stylesheet_language%29) to simply prepare [A/B tests]("http://en.wikipedia.org/wiki/A/B_testing") or check some simple theory. So web developers can focus on their job.

*   **Code repetition and quality**
    We avoided code repetition between development teams. If you are presenting a new style or any improvement, all web developers will learn about it through the pull request to bootstrap project.

*   **Easy updates**
    We now have one source of truth about actual designs standards. If it’s in bootstrap it surely is in production now. You don’t have to follow all new trends to stay up–to–date.

*   **[Bower](http://bower.io/ "A package manager for the web")/[NPM](https://www.npmjs.com/ "npm is the package manager for node") ready**
    We made our frontend bootstrap available in npm via git repository and configured it as a bower package. It’s easy to get it working fast!

![Allegro Frontend Bootstrap buttons example](/img/articles/2015-02-19-frontend-made-simple/buttons.png "Allegro Frontend Bootstrap buttons example")

### Where we are today

Thanks to the changes we introduced if you give Allegro Frontend Bootstrap to the new web developer he won’t need to spend as much time learning it.
If you know [Twitter Bootstrap](http://getbootstrap.com/ "Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.") it will make you feel very natural to use it. We made the process a lot simpler and more consistent.
Thanks to our changes we can develop and provide best quality product faster then ever.
Many developers contribute and try to make our frontend better and better.
We are proud of the fact that that one employee’s initiative was forged by our company to a full-blown project that we are working on.

### Why aren’t you doing the same?

I hope you all work using some kind of [LESS](http://en.wikipedia.org/wiki/Less_%28stylesheet_language%29)/CSS framework that fits your needs just like we do at Allegro Group. If not — we simply invite you to try making one for yourselves.
We did it and we are happy with the results. Are you a backend developer and you don’t have any idea where to start? Grab [Twitter Bootstrap](http://getbootstrap.com/ "Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.") as boilerplate now.
