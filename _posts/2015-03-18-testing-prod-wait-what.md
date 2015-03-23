---
layout: post
title: Testing prod... wait, what?
author: karol.grabowski
tags: [ruby, testing, cucumber, production]
---

As a modern, agile and often fluent in multiple languages developer you must understand the importance of testing.
Your application can be tested by several test types like unit, integration and acceptance (aka E2E). Number of tools,
frameworks and even languages is enormous, just to mention a few:
[Junit](http://junit.org/),
[Mockito](http://mockito.org/),
[Geb](http://www.gebish.org/),
[jBehave](http://jbehave.org/),
[Cucumber](https://cukes.info/),
[Concordian](http://concordion.org/),
[Selenium](http://www.seleniumhq.org/),
[TestNG](http://testng.org/).
 Many others tools can help to verify if your code is working properly. I believe all of you are familiar with TDD and
BDD methodologies which are more than standard now. But all of these tools have common limitation. They checks only
your test environment.

###Does it work?
Our team works on the new Offer Listing for [Allegro](http://allegro.pl). Listing is that place in our marketplace service where we present
offers' list. Currently Allegro is divided into two listing versions. "Old listing" - part of legacy PHP monolith
application and ["new listing"](http://allegro.pl/dodatki-do-plyt-cd-dvd-etui-albumy-4735) - based on Java microservices. Because our service has dedicated data storage different
from old listing database sometimes information displayed on offers' list and offer's page are inconsistent. There are
several cases that could happen — for example when something goes wrong with event bus which is a data source about offers. That's why
testing data correctness is especially important for us. We simply don't want to mislead our users. Every microservice
has integration and of course unit tests. Whole listing is also verified by behavioral tests. After every commit
our code is checked by first two kind of tests and before release on production behavioral test must pass. Obviously each
change is also verified by Software Quality Assurance stage. As you may know Allegro is available from your
smartphone and tablet so we have to check if everything is working well on mobile devices. However when our Product
Owner, after short failure of Listing, asked us if application is working properly again we had problem with answer.

###Simple answer?
Of course, thanks to monitoring we can answer a question about current memory or CPU usage. [Graphite](https://github.com/graphite-project/graphite-web) metrics give us
knowledge about how many events do we receive from other services and [NewRelic](http://newrelic.com/) collects essentials and most
important data in one place. [PagerDuty](http://www.pagerduty.com/) notifies us about every Listing's unavailability or any uncommon
behavior of the application. But do we list correct offers to our users? Does 273 page in child clothes category
contain the right number of items? If I type allegro.pl in a browser's address bar and see main page, can I tell that
service is working? Is that sufficient? Our metrics, monitoring and every tool we use tell us that application is
running well, but how can we be sure about offer's data?

###Assurance?
We experienced our data storage failure. We experienced receiving
incorrect events or processing them in not exactly proper way.
We also found bug on the production once. Ok, twice. That's never something a developer can be proud of.
I hope you don't know what I am talking about. But probably you do because there is no perfect software. Of course we
always, after founding a bug, write new tests which protect us from the same fail in future. But can we protect our
application from every unsupported thing user do? Or from a breaking change in external service which listing depends on?
Most of them we can find by well written integration tests but that's only majority not everything.

###Prod?
Our Listing is tested few million times per day. Naturally I am talking about our users who search, sort and
filter offers every day. And they find bugs. They sometimes notify us about some malfunction but these reports
are often incomplete. We don't know which browser they use or where the bug occured, on the old or new Listing. Reproducing
error is pretty hard and sometimes even impossible. That leads us to testing prod on our own conditions. We of course
know that this won't give us completely assurance. We treat this as just another step to provide as perfect
data as we can. But how do we do that?

###Red Cucumber?
So, we are on the production. Without possibility to mock. With limited knowledge what do we find on next listing pages. What
can we use? We have already tested listings on preprod environment with behavior tests based on jBehave and Selenium.
We could use the same configuration but why don't use something more exotic? Ruby and Cucumber sounds good enough in
our every day Java world. We wanted something that doesn't require a lot of configuration with complicated environment
and Ruby seems to fulfill those requirements. On the other hand we've got everything we need to test production listings.
Selenium satisfied all of our needs and we decided not to change it.

###Examples?
Alright, let's take a look on one of many examples of the production Listing test.

```groovy
  Scenario: All items should have price within a given price range
    Given I am on a new Listing
    When I set minimal price to random value and max price to anything higher
    Then All items should have price within given range
```

Simple as that. Nothing extraordinary, common given-when-then construction and basic English. So in our example
we visit a random Listing page then we filter offers by price from-to and in the end we check if every item has
price in given range. That obviously does not guarantee that items have correct price. But it helps verifies most of
incorrect data. Maybe not after one run, but after a dozen or so. Another good example is test where we check if
listing page contains not only list of offers but also header and footer plus others external boxes, for instance
responsible for category tree navigation or filtering:

```groovy
  Scenario: Validate if listing page has all external content assembled
    Given I am on new listing
    Then I should see header
    Then I should see footer
    Then I should see category box
    Then I should see parameter box
```
Another one? Lets take a look on test where we validate if items sorting works as designed:

```groovy
  Scenario: Selected sorting type should really sort items by given parameter
    Given I am on new listing
    Then I am sorting offers by price with delivery descending
    Then Every subsequent item should have lower price with delivery
```

Not very complicated example which make us sure that sorting is working. Of course we are testing cases like this one
in few stages before release. But can you be sure your application is working 100% perfectly in the middle of the night?
Or if someone released new version of service your application is working with? Are you sure?

###Fail?
Working with production tests is a piece of cake. Amount of code we wrote to cover several test cases is
ridiculously low. Whole project consists of one steps definition file, one yaml file containing xpath descriptions and
few .feature files with scenarios. Running test requires ruby with two gem packages — selenium-webdriver
and Cucumber. Another thing you need is a browser. For us it is Firefox but feel free to use another browser, like [PhantomJS](http://phantomjs.org/) or
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

Last thing we want to implement is running all scenarios even hundreds times per single build. And run builds all the
time, not only after deploy. Verify huge number of pages, with all filters, search phrases and every kind of sorting
should give us enough assurance. After test we want know scale of problem. We don't care about single cases
and one, particular item. We just need answer for Product Owner: „yes, our data is totally correct”, or „no, 187 of
519000 items have wrong data”. Right now we just get info that single items are broken and that may mean something
bigger is broken. But it's piece of useful information, isn't it?
