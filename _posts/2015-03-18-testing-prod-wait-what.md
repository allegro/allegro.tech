---
layout: post
title: Testing prod... wait, what?
author: karol.grabowski
tags: [ruby, testing, cucumber, production]
---

As a modern, agile and often fluent in multiple languages developer you must know how very important tests are in
applications nowadays. Your application can be tested by several test types like unit, acceptance, behavioral,
integration and so on. Number of tools, frameworks and even languages is enormous.
[Junit](http://junit.org/),
[mockito](http://mockito.org/),
[gebish](http://www.gebish.org/),
[jbehave](http://jbehave.org/),
[Cucumber](https://cukes.info/),
[concordian](http://concordion.org/),
[selenium](http://www.seleniumhq.org/),
[testNG](http://testng.org/)
 and many others helps you verify your code is working properly.
I believe all of you are familiar with TDD and BDD methodologies which are more than standard now. But all these
solutions have one thing in common. Most of mentioned above kind of test check only your preprod environment.

###Does it work?
Our team is working on new listing in allegro. Listing is that place in our marketplace service where we present
offers' list. Testing data correctness is especially important for us because we don't want to display different info
than this you can see on the offer's page. Every microservice we own has integration and of course unit tests. Whole listing
is also verified by behavioral tests. After every commit our code is check by first two kind of tests and before
release on production behavioral test must pass. Obviously each change is also verified by Software Quality Assurance
stage. As you may know Allegro is available from your smartphone and tablet so we have to check if everything is
working well on mobile devices. However when our Product Owner, after short listing failure, asked us if application
is working properly again we had problem with answer.

###Simple answer?
Of course thanks to monitoring we can answer to question about current memory or CPU usage. Graphite metrics give us
knowledge for example about how many events do we receive from other services and [NewRelic](http://newrelic.com/) collect essentials and most
important data in one place. [PagerDuty](http://www.pagerduty.com/) notifies us about every listing's inaccessibility or any uncommon
behavior of application. But do we display correct information on offers list? Does 273 page in child clothes category
contain right number of items? If I type allegro.pl in browser's address bar and see main page, can I tell that
service is working? Is that sufficient? Our metrics, monitoring and every tool we use tell us that application is
running well, but how can we be sure about data? We experienced our data storage failure. We experienced receiving
incorrect events, which should provide information about changes in offers, or processing them in not exactly proper way.
We also found bug on a prod once. Ok, twice. That's never something a developer can be proud of.
I hope you don't know what I am talking about. But probably you do because there is no perfect software. Of course we
always, after founding a bug, write new tests which protect us from the same fail in future. But can we protect our
application from every unsupported thing user do? Or from little change in external service which listing depends on?
Most of them we can find by well written integration tests but that's only majority not everything.

###Prod?
Our listing is tested few million times per day. Naturally I am talking about our users who is searching, sorting and
filtering offers every day. And they are finding bugs. They sometimes notify us about some malfunction but those reports
are often incomplete. We don't know what browser does user use or which listing version is affected. Reproducing
error is pretty hard and sometimes even impossible. That leads us to testing prod on our own conditions. We of course
know that this won't give us completely assurance. We treat this as just another step to provide as perfect
data as we can. But how do we do that?

###Red Cucumber?
So, we are on a prod. Without possibility to mock. With zero knowledge what do we find on next listing pages. What
can we use? We already testing listings on preprod environment with behavior tests based on jbehave and selenium.
We could use the same configuration but why don't use something more exotic? Ruby and Cucumber sounds good enough in
our every day java world. We wanted something that doesn't require a lot of configuration with complicated environment
and ruby seems to fulfill those requirements. On the other hand we got everything we need to test production listings.
Selenium satisfied all our needs and we decided not to change it.

###Examples?
Alright, so how does production test look like? Let's see:

```groovy
  Scenario: Items should not have price from outside price range
    Given I am on new listing
    When I set minimal price to random value and max price to anything higher
    Then All items should have price within given range
```

Simple as that. Nothing extraordinary, common given-when-then construction and basic english. So in our example
we visit random new listing page then we filter offers by price from-to and in the end we check if every item has
price in given range. That obviously does not guarantee that item has correct price. But it helps notice most of
incorrect data. Maybe not after one run, but after a dozen or so. Another good example is test where we check if
listing page contains not only list of offers but also header and footer plus others external boxes, for instance
responsible for moving though categories or filtering:

```groovy
  Scenario: Validate if listing page has all external content assemble
    Given I am on new listing
    Then I should see header
    Then I should see footer
    Then I should see category box
    Then I should see parameter box
```

Another one? Lets take a look on test where we validate if sorting items does really sort items:

```groovy
  Scenario: Select sorting type should really sort items by given parameter
    Given I am on new listing
    Then I sorting offers by price with delivery descending
    Then Every subsequent item should have lower price with delivery
```

Not very complicated example which make us sure that sorting is working. Of course we are testing cases like this one
in few stages before release. But can you be sure your application is working 100% perfectly in the middle of the night?
Regardless someone released new version of service your application is working with? Are you sure?

###Fail?
Working with production tests is a piece of cake. Amount of code we wrote to cover several test cases is
ridiculously low. Whole project consist of one steps definition file, one yaml file containing xpath descriptions and
few .feature files with scenarios. Running test requires ruby with two gem packages — selenium-webdriver
and Cucumber. Another thing you need is browser. For us it is firefox but there is no reason you can't use phantomjs or
anything else. We regularly run Cucumber features from CI environment. But what if one of tests fail? CI build generates
log with detailed description of failure and screenshot of entire page which we can use to investigate cause.

```groovy
  Scenario: Simple check if page contains valid number of items # features/items.feature:3
    Given I am on new listing                                   # features/step_definitions/steps.rb:30
      http://www.allegro.pl/filmy?p=72
    Then There should be between 1 and 60 items                 # features/step_definitions/steps.rb:44
      found unexpected number of items which is: 61 (RuntimeError)
```

Now we can simply enter on given url and compare result with saved screenshot. We know dependencies between listing and
services around so we can easily decide if incorrect data comes from us or other service. Is that one redundant item
from example above because fail of service which determine what items display on listing page? Or listing itself?
We can examine this later, information that problem exist is sufficient for now.

###So guys, does it work?
Last thing we want to implement is running all scenarios even hundreds times per single build when we suspect that
something may be wrong with our data. After test we want know scale of problem. We don't care about single cases
and one, particular item. We just need answer for Product Owner: „yes, our data is totally correct”, or „no, 187 of
519000 items have wrong data”. Right now we just get info that single items are broken and that may mean something
bigger is broken. But it's piece of useful information, isn't it?
