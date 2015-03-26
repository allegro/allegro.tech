---
layout: post
title: Testing prod... wait, what?
author: karol.grabowski
tags: [ruby, testing, cucumber, production]
---

As a modern, agile and often fluent in multiple languages developer you must understand the importance of testing.
Your application may be tested by several test types like unit, integration or acceptance. Number of tools,
frameworks and even languages is enormous, just to mention a few:
[Junit](http://junit.org/),
[Geb](http://www.gebish.org/),
[jBehave](http://jbehave.org/),
[Cucumber](https://cukes.info/),
[Spock](http://spockframework.org/),
[Selenium](http://www.seleniumhq.org/).
 Many others tools can help to verify if your code is working properly. I believe all of you are familiar with TDD and
BDD methodologies which are more than standard now. But all of these tools have common limitation. They checks only
your test environment. Let me show you how do we test production in one of [Allegro](http://allegro.pl) team responsible for [Offer Listing](http://allegro.pl/dodatki-do-plyt-cd-dvd-etui-albumy-4735).

###Does it work?
Listing based on microservices is that place in Allegro where we present offers' list. As we all know microservices have pros and cons. Obvious disadvantage
is decentralized data storage. It's common problem to keep in all services the same data, often updated from different
sources. For our applications it's event bus but not everyone uses this solution. For that reason offers on Listing and on the
offer's page are inconsistent in some cases. That's why testing data correctness and finding misstatements between
Listing and other places are especially important for us. We simply don't want to mislead our users. Every microservice
has integration and unit tests. Whole listing is also verified by behavioral tests. After every commit
our code is checked by first two kind of tests and before release on production behavioral test must pass. Obviously each
change is also verified by Software Quality Assurance stage. As you may know Allegro is available from your
smartphone and tablet so we have to check if everything is working well on mobile devices. However when our Product
Owner, after short failure of Listing, asked us if application is working properly again we had problem with answer.

###Difficult answer
Of course, thanks to monitoring we can answer a question about current memory or CPU usage. [Graphite](https://github.com/graphite-project/graphite-web) metrics give us
knowledge about how many events do we receive from other services and [NewRelic](http://newrelic.com/) collects essentials and most
important data in one place. [PagerDuty](http://www.pagerduty.com/) notifies us about every Listing's unavailability or any uncommon
behavior of the application. But do we list correct offers to our users? Does 273 page in child clothes category
contain the right number of offers and correct data? If I type allegro.pl in a browser's address bar and see main page, can I tell that
service is working? Is that sufficient? Our metrics, monitoring and every tool we use tell us that application is
running well, but how can we be sure about offers' data?

###Assurance
We experienced our data storage failure. We experienced receiving incorrect events from event bus or processing them in not exactly
proper way. We also found bug on the production once. Ok, twice. That's never something a developer can be proud of.
I hope you don't know what I am talking about. But probably you do because there is no perfect software. Of course we
always, after founding a bug, write new tests which protect us from the same fail in future. But can we protect our
application from a breaking change in external service which listing depends on?
Most of them we can find by well written integration tests but that's only majority not everything.

###Production bugs
Our Listing is tested few million times per day. Naturally I am talking about our users who search, sort and
filter offers every day. And they find bugs. They sometimes notify us about some malfunction but these reports
are often incomplete. We rarely know which browser they used or what exactly they did to find bug. Reproducing error is
pretty hard and sometimes even impossible with lack of information. That's why we decided to test the production on our own terms.
Of course even with that kind of tests we can't be completely sure there's zero bugs on the production. We treat this as just
another step to provide as perfect data as we can. But how do we do that?

###Red cucumber
So, we are on the production. Without possibility to mock. With limited knowledge what do we find on next listing pages.
What can we use? We have already tested listings on preprod environment with behavior tests based on jBehave and Selenium.
We could use the same configuration but why don't use something more exotic? Ruby and Cucumber sounds good enough in
our every day job. Cucumber like jBehave is framework which allows to write business-readable stories.
It's written in Ruby and these two together works best but Cucumber is also available in Java, .NET and many others. We wanted something
that doesn't require a lot of configuration with complicated environment and Ruby seems to fulfill those requirements.
On the other hand we've got everything we need to test production listings. Selenium satisfied all of our needs and we
decided not to change it.

###Set up
Ok, so what do we need? First of all we have to download and install [Ruby](https://www.ruby-lang.org/en/), current stable version is 2.2.1
which we recommended but previous versions should work just fine. After that you need to install two gems: [selenium-webdriver](https://rubygems.org/gems/selenium-webdriver)
and [cucumber](https://rubygems.org/gems/cucumber). Last thing is browser and it doesn't matter if it's [Firefox](https://www.mozilla.org/en-US/firefox/new/) or any of
headless ones like [PhantomJS](http://phantomjs.org/) or [HtmlUnit](http://htmlunit.sourceforge.net/). That's all. With simple `cucumber` command you can run your tests now.


###Examples
Alright, let's take a look on one of many examples of the production Listing tests.

```groovy
  Scenario: All items should have price within a given price range
    Given I am on a new Listing
    When I set minimal price to random value and max price to anything higher
    Then All items should have price within given range
```

Simple as that. Nothing extraordinary, common given-when-then construction and basic English. In our example
we visit a random Listing page then we filter offers by price from-to and in the end we check if every item has price
within given range. Behind every step is something called glue code which is also known as step definition.
In our case it's already mentioned Ruby. But how does look glue code for that particular case? Let's see:

```ruby
When(/^I set minimal price to random value and max price to anything higher$/) do
  minPrice = rand(100)
  maxPrice = minPrice + 1
  driver.find_element(:xpath, property['priceFrom']).send_keys(minPrice)
  driver.find_element(:xpath, property['priceTo']).send_keys(maxPrice)
end
```

As you can see we set minPrice and maxPrice very tight to find even smallest difference. Then we put these two
values to input fields responsible for filter offers by price which we find by xpath. In the end we compare our random
prices with values of every offer on page:

```ruby
Then(/^All items should have price within given range$/) do
  minPrice = driver.find_element(:xpath, property['priceFrom']).attribute('value')
  maxPrice = driver.find_element(:xpath, property['priceTo']).attribute('value')
  driver.find_elements(:xpath, property['price']).each { |price|
    unless value.between?(minPrice, maxPrice)
      fail "price [#{value}] is outside range [#{minPrice}-#{maxPrice}]"
    end
  }
end
```

Line by line we check minPrice and maxPrice from proper fields, then we iterate trough all offers and if any offers'
price is outside given price range test will fail. That obviously doesn't guarantee that offers have correct price.
But it helps verifies most of incorrect data. Maybe not after one run, but after a dozen or so. Another example? Let's
take a look on test where we validate if items sorting works as designed:

```groovy
  Scenario: Selected sorting type should really sort items by given parameter
    Given I am on new listing
    Then I am sorting offers by price with delivery descending
    Then Every subsequent item should have lower price with delivery
```

In step definition we simply iterate trough all offers and compare offers' prices. Of course we are testing cases like this one
in few stages before release. But can you be sure your application is working 100% perfectly in the middle of the night?
Or if someone released new version of service your application is working with? Are you sure?

###Tests result
Working with production tests isn't very hard. Amount of code we wrote to cover several test cases is
pretty low. Whole project consists of one steps definition file, one yaml file containing xpath descriptions and
few .feature files with scenarios. We regularly run Cucumber features from CI environment. But what if one of tests
fail? CI build generates log with detailed description of failure and screenshot of entire page which we can use to
investigate cause. Now we can simply enter on given url and compare result with saved screenshot. Take a look on
failed scenario:

```groovy
  Scenario: Simple check if page contains valid number of items # features/items.feature:3
    Given I am on new listing                                   # features/step_definitions/steps.rb:30
      http://www.allegro.pl/filmy?p=72
    Then There should be between 1 and 60 items                 # features/step_definitions/steps.rb:44
      found unexpected number of items which is: 61 (RuntimeError)
```

We know dependencies between listing and services around so we can easily decide if incorrect data comes from us or
other service. Is that one redundant item from example above because fail of service which determine what offers display
on listing page? Or listing itself? We can examine this later, information that problem exist is sufficient for now.

###So guys, does it work?

Last thing we want to implement is running all scenarios even hundreds times per single build. And run builds all the
time, not only after deploy. Verify huge number of pages, with all filters, search phrases and every kind of sorting
should give us enough assurance. After test we want know scale of problem. We don't care about single cases
and one, particular item. We just need answer for Product Owner: „yes, our data is totally correct”, or „no, 187 of
519000 items have wrong data”. Right now we just get info that single items are broken and that may mean something
bigger is broken. But it's piece of useful information, isn't it?
