---
layout: post
title: Mini rant&#58; V for Viable
author: michal.kosmulski
tags: [MVP, Minimum Viable Product, project management, product development, agile]
---
Building a [Minimum Viable Product (MVP)](http://en.wikipedia.org/wiki/Minimum_viable_product) is a method of developing new products
by validating hypotheses using feedback from real users as soon as possible. This is supposed to reduce risk and to ensure a good
return on investment.
It is most often used together with [Agile](http://en.wikipedia.org/wiki/Agile_software_development) development methodologies.
But there’s no such thing as a free lunch and while it reduces some types of risk, MVP also introduces some risks of its own.

The idea of a Minimum Viable Product is to build a product with the minimum set of features which allows it to be usable in practice
(viable) for at least some usage scenarios. It should be delivered to a limited group of users who become beta-testers and provide
feedback. Further development or abandonment of the project should be planned based on the feedback received from the MVP.

What people tend to forget is that “V” in MVP stands for “[Viable](http://www.merriam-webster.com/dictionary/viable)”.

I recently stayed at a hostel which apparently tried to build its showers according to MVP principles, applied poorly. Granted, it was a
cheap place in remote mountains, but there were several details which could have been very easily fixed but would have greatly improved my
[User Experience](http://en.wikipedia.org/wiki/User_experience).
For example, there was no place to put your clothes other than the floor or the heater. A single nail hammered into the wall would
have solved the problem. It would not be pretty but it would make life much easier and the extra cost would be negligible.

If the software we write is not to be like that shower, we must remember that some features may seem optional but in reality without them
the product cannot be used. So: “M” is for “minimum” but “V” is for “viable”.

Another risk the unfortunate shower highlights is when MVP is released but neither does development continue nor is the product
abandoned. Since there’s “viable” in the name, business may be tempted to avoid any additional cost and may market the MVP with all its
shortcomings as the final product. [Sunk cost fallacy](http://en.wikipedia.org/wiki/Escalation_of_commitment) may also come
into play, preventing the business from killing the product even if MVP is not successful and forcing the development team to support a
product which was never meant to run in a full-scale production environment.

This is not to discourage you from using the Minimum Viable Product approach. At Allegro we use it quite successfully (see
[this story]({% post_url 2014-10-22-story-about-delivering-products-part1 %}) as well as [this one]({% post_url 2015-01-26-story-about-delivering-products-part2 %})), but there are
a few pitfalls to look out for:

* First of all, know what you want to learn from the experiment. MVP is about validating hypotheses, so you need to know in advance what
hypothesis you want to confirm or reject, what you will consider a success and what you will consider a failure and what information
about users’ expectation you want to draw from their feedback. Otherwise, the whole experiment becomes rather pointless.
* Make sure your product is not only minimal but also viable. Sometimes minor improvements which you may consider optional can
make or break the product for your users.
* Choose the audience for your MVP wisely. If you are replacing an existing product which users are accustomed to, forcing
all of them to use a new, possibly less stable one with fewer features will only make them angry. Let users opt in for the beta
version and invite power users and early adopters to do so. If you play this well, they will actually feel privileged to be able to test a
pre-release version. When creating a completely new product, make sure to clearly indicate that what users receive is still work in
progress.
* Do not allow the MVP to become your final product. Remember that its role is only to gather information which will allow you to better
prepare the real thing. Either continue development or kill the product altogether.

Being aware of these potential problems should hopefully make planning your next MVP easier.
