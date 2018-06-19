---
layout: post
title: Story about delivering valuable products quickly, part I
author: andrzej.winnicki
tags: [agile, mvp, walking-skeleton, lean, story-mapping]
---

Main purpose of this article is to describe **what kind of techniques may be used to
build valuable and reliable products with limited time**. It is based on the
experiences we had, during our work on new logistics platform.

I will describe how to use **Minimum Viable Product (MVP)**, **Walking Skeleton (WS)**
and **Story Mapping (SM)** in practice. Due to size of the subject, the
article is divided into two parts. The first part includes description of the situation
we have faced and short introduction to MVP and Walking Skeleton concepts.
Second part is mainly focused on practical application of Story Mapping and includes
some tips and tricks, which we have learned during the whole process of building the product.

This is a story about our journey from unknown to production-ready product.

### Let's integrate!

January 2014. We are working on improving performance of our current (*legacy*) logistic  platform.
It works, but due to technological and architectural constraints it cannot reliably serve heavy traffic.
Because of this, we slowly started moving our product to more modern solutions.
At the same time, we are informed that soon we will have to integrate it with one of the largest
ERP systems dedicated to small and medium enterprises. The integration will help increase
the volume of processed orders. Sadly, because of design mistakes the *Legacy Platform* cannot handle large volumes,
so we decided that we need to move on and create a brand new, modern and fast mechanism
for providing all the options offered by current one. We are more than excited.
Having greenfield project is a dream for every developer, but there is a catch...
Because of our partner's release cycle, we have only 6 months to do it!
Almost every part of old platform must be replaced with new solution, and according to
estimated workload - we need about 2 years to complete the task.

### Let's do an MVP!

Just as tragic heroes of a Greek drama, we had to face a dilemma: how to develop a new
platform in almost no time, move the product development further and avoid any technical debt
that we would pay off for months if not years?

Product development is a constant balance between scope, cost, deadline and quality.
Providing lower quality is against our professional ethics, not to mention that it
would be a gift for our competitors. In other words, lower quality is not
profitable in the long-term perspective. Project costs are often limited, so we can only
manipulate with scope and deadlines.

Let's dispel myths related to many so-called waterfall or "almost agile" projects.
If there is scope, which cannot be delivered within provided deadline, it is impossible to complete
such project and deliver a product that would not make us feel ashamed.

Our situation could be described with one word only – a deadlock. The deadline was set and the scope was,
theoretically, impossible to change. Or was it not? Let's exercise our minds: let us take the scope we
think that cannot be changed and examine the value it may bring to a potential customer.
Do we need all the functionalities immediately? Does each old API method provide oxygen necessary for the site to breathe?
By examining available functions, we found that the theoretically unchangeable scope can be modified.

Eric Ries published his book [Lean Startup](http://theleanstartup.com/) in 2011. He shared
his thoughts on developing successful start-ups. Allegro is definitely not a start-up,
but Ries introduces a less ordinary definition. According to him, a start-up is not a
group of unshaven students working in a garage. In fact, it is an enterprise working
in an environment of extreme uncertainty. A perfect description of our situation.

The book is definitely not a bible; it was published to make some money. Nevertheless, it is still a
source of very valuable ideas inspired by experience of Japanese companies (Toyota Way).
The most renowned concept is MVP: Minimum Viable Product, where Ries sheds some light on value-maximising.
A product does not have to include all the options. Instead, it should offer options that bring the highest value.

Important: MVP is not a minimum product or a product that diminishes the value of quality.
MVP forces us to focus on what is important - it is not a picklock, its form depends both:
on us and on our requirements. When we build a new Airbus, our MVP is not a peasant wagon drawn by an old horse.
On the other hand, we do not need ERP and CRM systems if we sell about 100 teddy bears.

MVP suited our model perfectly. We did not have much time and we needed the maximum value.
We wanted any ERP user to be able to send a parcel using our API. What else? We were about
to learn it soon.

### Walking Skeleton – how to build an MVP?


Once we decided to take the MVP path, we faced another problem. How do we define the most
valuable options? Surely a Product Owner knows such things. But wait, how is he supposed to know it?

A Product Owner is not a mythical creature that has all the answers. He or she cannot tell the
most important functions from trivia. MVP must be the result of a discussion between a PO and a team,
between a PO and the stakeholders; in general - between all the parties involved in process.

As MVP is a result of teamwork, we need to focus on elements necessary to provide it.
Should we pick the smallest features and compose them until reaching a valuable option?
Or should we focus on the most complex options and cut them until reaching viable minimum?

We decided to take the process approach, with a little help from Allistair Cockburn,
the author of [Walking Skeleton](http://alistair.cockburn.us/Walking+skeleton) concept.

![Walking Skeleton](/img/articles/2014-10-22.skeleton.gif "Waling Skeleton scheme")

(Image source: http://blog.codeclimate.com/blog/2014/03/20/kickstart-your-next-project-with-a-walking-skeleton)

Cockburn used it to describe a process of software development. However, it suits product
delivery too. Walking Skeleton is about creating a solution that provides the whole process path.
In the programming world, it means possibility of end-to-end tests, while in the product world,
it means providing a user with the most valuable flow. Therefore, we will deliver a version that includes
all the most important options for a user and nothing more.

So we changed the perspective and analysed our site as a process. A user registers and logs on.
The next step is checking available options, selecting parcel dimensions,
providing address and getting the quotation. Moreover, a user wants to confirm sending the parcel,
hand it to a courier, check the delivery date, receive an invoice and pay
for all the orders submitted that month.

The most important was to focus on the core options. What do our users want?
What do ERP users want? What are the minimum options that provide the full process?
Jeff Patton and his vision of backlog map brought the answers.

First part ends here. Second part starts with Jeff Patton's Story Mapping concept;
later on I describe how we conducted Story Mapping process,
what kind of problems we had and what we have learned from them.

If you would like to know how our story ends, please stay tuned!
