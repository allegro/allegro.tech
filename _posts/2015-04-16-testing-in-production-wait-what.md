---
layout: post
title: Testing in production... wait, what?
author: karol.grabowski
tags: [tech, ruby, testing, cucumber, production]
---

If you are an agile developer who is fluent in multiple languages, you understand the importance of testing. You have
several types of tests (unit, integration or behavioural) at your disposal to check your application. The number of
available tools, frameworks and even languages is enormous, just to mention a few:
[Junit](http://junit.org/),
[Geb](http://www.gebish.org/),
[jBehave](http://jbehave.org/),
[Cucumber](https://cukes.info/),
[Spock](http://spockframework.org/),
[Selenium](http://www.seleniumhq.org/).
Dozens of other tools can help you verify whether your code is working properly. Besides, I assume you are familiar with
TDD and BDD methodologies which are rather standard nowadays. Nevertheless, all of these tools have common
limitations – they check your test environment only. Let me show you how one of [Allegro]({% link about-us/index.html %}) teams responsible for the
[Offer Listing](http://allegro.pl/dodatki-do-plyt-cd-dvd-etui-albumy-4735) tests the production environment.

### Does it work?
We use Listing (based on microservices) to present a list of offers available on Allegro. As you know, microservices
have their pros and cons. One of the most obvious disadvantages is decentralized data storage – keeping the same data
across all services although it is constantly updated by various sources is not that easy. Our Listing retrieves data
using an event bus but other applications may have adopted different solutions. Nevertheless, offers displayed on the
Listing and on an offer page may sometimes be inconsistent. That is why we find testing data correctness and detecting
any discrepancies between the Listing and other pages that important – we do not want to mislead our users.

Each microservice undergoes integration and unit tests. Moreover, we use behavioral testing to verify the Listing.
After every commit the code undergoes the first two types of testing. Before the release, the code must pass
behavioral testing. Naturally, each change must be also verified at the Software Quality Assurance stage. As you may
know, you can use Allegro on your smartphone and tablet, so we have to check if everything works well on mobile devices.
However, when after a short Listing failure our Product Owner asked if the application was working properly, we could
not answer the question.

### Difficult answer
Monitoring allows us to answer any question about current memory or CPU usage. [Graphite](https://github.com/graphite-project/graphite-web) metrics give us insight on how
many events we receive from other services, whereas [NewRelic](http://newrelic.com/) collects essentials and the most important data in one
place. [PagerDuty](http://www.pagerduty.com/) notifies us when our service is unavailable or about any unexpected behaviour of the application. But
do we list correct offers? Does every page in the “Children clothes” category contain the right number of offers and
correct data? If I type allegro.pl into the browser's address bar and visit the site’s main page, can I tell if the
service is working? Is that sufficient? Our metrics, monitoring and other tools we use tell us everything about
the performance, but how can we be sure about the data the service displays?

### Assurance
We have experienced a failure of our data storage. We have received incorrect events from the event bus. We have
processed them in the not exactly proper way too. We have even found a bug on the production environment once. Ok, we
have found it twice, but it is never something a developer can be proud of. I hope you have never experienced anything
like that, but on the other hand there is no such thing as perfect software. Naturally, each time we find a bug, we
write new tests to make sure it will not occur again. But can we protect our application against a failure caused by
a change in an external service the Listing depends on? In most cases, we can detect such risk owing to well-written
integration tests, but there is always something we may not notice.

### Production bugs
Our service is tested a few million times per day by users who search, sort and filter offers. And they find bugs.
Sometimes they inform us about some malfunctions, but these reports are often incomplete. We rarely know what browser
they used or what exactly they did to find the bug. Reproducing an error is pretty hard and sometimes even impossible
due to lack of information. That is why we decided to test the production environment on our own terms. However, even
with that kind of tests we cannot be completely sure that the environment is free of bugs. Nevertheless, we perceive
this testing as another step on the way to providing as perfect data as we can. But how do we do that?

### Red cucumber
So, here we have the production environment where we cannot mock anything. Besides, we are not 100% sure what we should
find on next Listing pages. What can we use? We have already conducted behaviour testing based on jBehave and Selenium
on our test environment. We could try the same tools but how about using something more exotic? [Ruby](https://www.ruby-lang.org/en/) and Cucumber sound
good enough. Cucumber, just as jBehave is a framework which allows you to write business-readable stories. It is
written in Ruby, so it works best with any Ruby-based solution, but Cucumber also supports  Java, .NET and many other
platforms. We wanted something that does not require hours of configuration despite complicated environment and Ruby
seems to fit. On the other hand, we have got everything we need to test Listings available on the production
environment. Selenium satisfies our needs so we decided to stick to it.

### Testing
Dealing with production tests is not that hard. The amount of code we wrote to cover several test cases is pretty low.
The whole project consists of a step definition file, one yaml file that contains xpath descriptions and a few
`.feature` files with scenarios. We run Cucumber features from CI environment on a regular basis.

### Set up
Ok, so what do we need? First of all, we have to download and install Ruby. We recommend current stable version,
i.e. 2.2.1 but the previous ones should work just fine. Next, install two gems: [selenium-webdriver](https://rubygems.org/gems/selenium-webdriver) and [cucumber](https://rubygems.org/gems/cucumber).
The last element is a browser and it does not matter if you use [Firefox](https://www.mozilla.org/en-US/firefox/new/) or any of the headless ones such as [PhantomJS](http://phantomjs.org/)
or [HtmlUnit](http://htmlunit.sourceforge.net/). And that is all. Just enter simple `cucumber` command to run your tests.

### Examples
Alright, let's take a look at an exemplary Listing test conducted on a production environment.

```groovy
  Scenario: All items should have a price within a given price range
    Given I am on a new Listing
    When I set minimal price to random value and max price to anything higher
    Then All items should have price within given range
```

Simple as that. Nothing extraordinary, common given-when-then construction and plain English. In this example scenario,
we visit a random Listing page and filter offers by a price. Eventually, we check if any of the displayed items
exceeds the given price range. The so-called “glue code” is behind each step, which is also known as the step definition.
In this case, it is the above-mentioned Ruby. But what does the glue code look like in this particular scenario?
Let's see:

```ruby
Given(/^I am on new listing$/) do
  randomListingUrl = "#{property['host']}/#{possible_categories.sample}?p=#{rand(100)}"
  driver.navigate.to randomListingUrl
end
```

We build the Listing URL using an Allegro host, one random category from a table with several category names and
a random page. Let's take a look at the `When` part:

```ruby
When(/^I set minimal price to random value and max price to anything higher$/) do
  minPrice = rand(100)
  maxPrice = minPrice + 1
  driver.find_element(:xpath, property['priceFrom'])
    .send_keys(minPrice)
  driver.find_element(:xpath, property['priceTo'])
    .send_keys(maxPrice)
end
```

As you can see, we set `minPrice` and `maxPrice` very tight to find even the smallest difference. Next, we enter these two
values into input fields responsible for filtering offers by price, which we locate using xpath. Eventually, we compare
our random prices with prices of offers displayed on the page:

```ruby
Then(/^All items should have price within given range$/) do
  minPrice = driver
    .find_element(:xpath, property['priceFrom'])
    .attribute('value')
  maxPrice = driver
    .find_element(:xpath, property['priceTo'])
    .attribute('value')
  driver.find_elements(:xpath, property['price']).each { |price|
    unless value.between?(minPrice, maxPrice)
      fail "price #{value} is outside range [#{minPrice}-#{maxPrice}]"
    end
  }
end
```

We start with checking `minPrice` and `maxPrice` provided in suitable fields. Next, we iterate through all offers and if any
offer price exceeds the given price range, the test will fail. Naturally, it does not guarantee that offers have the
correct price. Nevertheless, in most cases it helps us detect incorrect data. Maybe not after one run, but after a
dozen or so. Another example? Let's take a look at a test validating if the sort option works as designed:

```groovy
  Scenario: Selected sorting type should really sort items by given parameter
    Given I am on new listing
    Then I am sorting offers by price with delivery descending
    Then Every subsequent item should have lower price with delivery
```

According to the step definition, we simply iterate through all offers and compare offer prices.

### Tests result
But what if one of the tests fails? The CI build creates a log that includes a detailed failure description and a
screenshot of the entire page which we can use to investigate the cause. We just have to enter the given URL and compare
the result with the saved screenshot. Take a look at the failed scenario:

```groovy
  Scenario: Simple check if page contains valid number of items # features/items.feature:3
    Given I am on new listing                                   # features/step_definitions/steps.rb:30
      http://www.allegro.pl/filmy?p=72
    Then There should be between 1 and 60 items                 # features/step_definitions/steps.rb:44
      found unexpected number of items which is: 61 (RuntimeError)
```

We know dependencies between the Listing and linked services so we can easily find if incorrect data comes from our or
other service. Note the last line of the example presented above. Is that message about unexpected number of items
caused by the Listing failure? Or maybe it was one of the linked services that failed? We can examine it later. The most
important is that we know there is a problem.

### So guys, does it work?
The last thing we want to implement is running all test scenarios even hundred times per single build. And run builds
all the time, not only after deployment. Verification of a huge number of pages, including filters, search phrases and
every sort option should give us some dose of certainty. After the test we want to know the scale of a potential
problem. We do not care about a single case or particular item. We must be able to tell our Product Owner: „yes, our
data is totally correct”, or „no, 187 of 519,000 items present incorrect data”. Right now, we just get information that
items are broken, which may suggest that something bigger is broken. Anyway, it is still useful information, is it not?

