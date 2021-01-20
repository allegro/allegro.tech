---
layout: post
title: Comparison of WebDriver-based solutions for test automation
author: ryszard.targonski
tags: [java, scala, groovy, geb, selenium, webrdriver, testing, automated testing]
---
Today, in an age of great popularity of test automation, we can observe a growing number of different frameworks which
allow us to write scripts and programs that simulate human actions performed on the website under test. The most popular
solution is [Selenium](http://www.seleniumhq.org/docs/) WebDriver framework, which is compatible with the majority of common languages.
Broad compatibility is a big advantage of Selenium especially in cases when we have to write some tests integrated to
our application project, because no matter in which language we write the application, Selenium probably has an API for
that language too. But there are also situations, like writing a standalone test suite, when we can decide which
technology we&rsquo;d most like to use. Taking into consideration this case, let me introduce to you a short
comparison of three JDK-based technologies:

* Java with [JUnit](http://junit.org/) and Selenium frameworks,
* Scala with [ScalaTest](http://scalatest.org/) and Selenium frameworks,
* Groovy with [GEB](http://www.gebish.org/) framework.

I think there is no need to introduce Java, one of the most popular object-oriented languages these days, as well as a popular
unit test framework for Java &mdash; JUnit. Both give us a great and easily-extended environment for writing unit tests. But we
also need something that will give us an opportunity to automatically open web browsers, to manage them, and to interact
with individual page elements the way the end user can. Here Selenium comes to the rescue.
Selenium is a WebDriver-based framework which works with many browsers (Safari, Opera, Chrome, Internet Explorer,
Firefox, different headless browsers, ...), operating systems, programming languages (C#, Groovy, Haskell, Java,
JavaScript, Objective-C, Perl, PHP, Python, Ruby, Scala, ...) and their testing frameworks (NUnit, JUnit, TestNG, Behat,
robot framework, RSpec, ...). Selenium allows opening the web browser of our choice automatically, going to chosen pages and
interacting with them, like &ldquo;reading the website&rdquo;, checking the title, clicking, writing, moving elements, checking
sources, clearing and setting cookies, etc. Java with JUnit (or TestNG) and Selenium library is the most common solution
for web testing automation today.

The second programming language I want to talk about is Scala. Scala is a JDK-based language that is much younger than
Java and allows both objective and functional programming paradigms. Two most popular testing frameworks for Scala
are [ScalaTest](http://scalatest.org/) and [Specs2](https://etorreborre.github.io/specs2/).
Depending on our needs we should choose Specs2 if we need to have our tests integrated with our service. The main
advantage of this framework is its ability to easily start the service under test before the tests themselves are
started with the help of Play framework. On the other hand if you don&rsquo;t need to integrate tests with a product
and can write a standalone test suite, then I recommend ScalaTest framework which has, in my opinion, a more intuitive
and definitely more user friendly syntax. In this article I am going to use ScalaTest and Selenium library for Scala.

The last technology I want to discuss is GEB, which is a Groovy-based solution combining the conciseness of Groovy
language with the flexibility of DOM navigation syntax of jQuery and CSS. This solution is designed only for web testing
automation purposes.

All versions of our test will be shown as standalone tests designed to use Firefox browser and all will be written with
business friendly given-when-then pattern. For better clearness of code we won&rsquo;t use any test patterns like
Page Object, but solutions shown below support this methodology.

### Required libraries

In the beginning we have to prepare our environments for writing tests. So let&rsquo;s start with required libraries.
All libraries used by the project will be managed by a proper build tool (Gradle for Java and Groovy, and SBT for Scala).
Required dependencies are:

Java project: **build.gradle** file

```groovy
apply plugin: 'java'

sourceCompatibility = 1.8

repositories {
  mavenCentral()
}

dependencies {
  testCompile(
    ['junit:junit:4.11'],
    ['org.seleniumhq.selenium:selenium-java:2.44.0'],
    ['org.assertj:assertj-core:1.7.1']
  )
}
```

GEB project: **build.gradle** file:

```groovy
apply plugin: 'java'
apply plugin: 'groovy'

repositories {
    mavenCentral()
}

dependencies {
    compile 'org.gebish:geb-core:0.10.0'
    compile 'org.seleniumhq.selenium:selenium-firefox-driver:2.43.1'
    compile 'org.seleniumhq.selenium:selenium-support:2.43.1'
    compile 'org.gebish:geb-spock:0.10.0'
    compile 'org.spockframework:spock-core:0.7-groovy-2.0'
}
```

and Scala project: **build.sbt** file

```scala
name := "Comparison_Scala"
scalaVersion := "2.11.5"
parallelExecution in Test := false

libraryDependencies ++= Seq(
  "org.scalatest" %% "scalatest" % "2.2.2" % "test",
  "org.scalacheck" % "scalacheck_2.11" % "1.11.6" % "test",
  "org.seleniumhq.selenium" % "selenium-java" % "2.43.1" % "test"
)
```

### Class structures

Before we start writing programs, let&rsquo;s take a look at class structures and initial imports. After that we will
focus only on pure features delivered by the test frameworks.

First let&rsquo;s begin with Java as the most widely used technology from all mentioned above.
The structure of Java class named **ComparisionTest.java** with included JUnit and Selenium library is:

```java
import org.junit.Test;
import org.openqa.selenium.firefox.FirefoxDriver;

public class ComparisonTest extends FirefoxDriver {

  @Test
  public void checkTheLowestPriceOfVenue7OnAllegro() {
    ...
  }
}
```

In Scala with ScalaTest and Selenium the structure of Scala class will be **ComparisonTest.scala**

```scala
import org.scalatest._
import org.scalatest.selenium.Firefox

class ComparisonTest extends FlatSpec with Firefox with Matchers {

  "The lowest price of Venue 7 tablet on Allegro" should "be higher than PLN 350.00" in {
    ...
  }
}
```

And in Geb it is **ComparisonTest.groovy**

```groovy
class ComparisonTest {

  def "Check the lowest price of Venue 7 on allegro"() {
    ...
  }
}
```

In addition we also include an external file **GebConfig.groovy** containing settings. Of course we can set these
settings in a test class, but an external file is the most popular solution.

```groovy
import org.openqa.selenium.firefox.FirefoxDriver

driver = { new FirefoxDriver() }
```

First thing we can see, even in the test template, is a more friendly test name (description) in ScalaTest
(FlatSpec) and in Geb than in Java solution.

*Note: In this paper I won&rsquo;t describe all test templates of ScalaTest (such as FlatSpec). I chose the most
readable one in my opinion. To read more about test templates in ScalaTest go to the
[documentation](http://www.scalatest.org/user_guide/selecting_a_style).*

### First look at Test

Now that our testing environment is ready, let&rsquo;s design a simple test checking that the lowest price of Dell Venue
7 tablet is higher than PLN 350.00. The test scenario has the following steps:

1.  Go to Allegro Site
2.  Enter &ldquo;venue 7&rdquo; in the search field and press enter
3.  Click the &ldquo;Komputery&rdquo;(Computers) category link
4.  Click the &ldquo;Tablety&rdquo;(Tablet&rsquo;s) category link
5.  Sort results by the lowest price using a dropdown, choosing &ldquo;Cena: Od najniższej&rdquo; entry
6.  Get the first result from promoted offers with &ldquo;Buy Now&rdquo; option containing price with three digits before comma sign
7.  Check that found price is higher than PLN 350.00.

### Test implementation

Now that we have a scenario, it&rsquo;s time for a step by step implementation.

It is worth mentioning, that Java is the only technology which does not have any library or framework with support for a
pure given-when-then pattern. All `given`, `when`, `and`, `then` annotations are not obligatory, but they make the test more
readable for a business user.

First step is to open Allegro website. This step will be followed by checking that the site we are visiting is Allegro
indeed. We will use the following code:

Java:

```java
//when
get("http://allegro.pl");

//then
getTitle().startsWith("Allegro.pl");
```

Scala:

```scala
When("Going to Allegro Page")
go to "http://allegro.pl"

Then("title should start with Allegro.pl")
pageTitle should startWith("Allegro.pl")
```

Geb:

```groovy
when: "Going to Allegro Page"
go "http://allegro.pl/"

then: "title should start with Allegro.pl"
title.startsWith("Allegro.pl")
```

As we can see the code is quite similar and intuitive in all languages. Most differences can be seen in Groovy language and
ScalaTest framework word separation syntax which is not present in Java.

The next stage is to enter &ldquo;Venue 7&rdquo; string into the search box and to select chosen categories.

Java:

```java
//when
findElement(By.id("main-search-text")).sendKeys("venue 7\n");
findElement(By.xpath("//span[text() = 'Komputery']")).click();
findElement(By.xpath("//span[@class='name' and contains(.,'tablety')]")).click();
```

Scala:

```scala
When("we display list of Venue 7 offers in \"Tablets\" category")
textField("main-search-text").value = "venue 7\n"
click on xpath("//span[text() = 'Komputery']")
click on xpath("//span[@class='name' and contains(.,'tablety')]")
```

Geb:

```groovy
when: "we display list of Venue 7 offers in \"Tablets\" category"
$("#main-search-text") << "venue 7\n"
$("span.name", text: "Komputery").click()
$("span.name", text: contains("Tablety")).click()
```

In this part of the code I would like to show a few ways of targeting DOM elements. First line of each solution begins with
targeting an object by `Id` attribute. Each technology has a different approach to resolve this problem.

Java has [`By`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html) abstract class with many
methods (like `id`, `linkText`, `partialLinkText`, `name`, `tagName`, ...) which allow us to select an element. In
this case we use `By.id()` notation.

Scala also has [`findElement`](https://selenium.googlecode.com/svn/trunk/docs/api/java/org/openqa/selenium/WebElement.html#findElement%28org.openqa.selenium.By%29)
method like Java, which takes `By` object as an argument, but additionally it has a few other methods dedicated to
individual types of input fields (like [`textField`](http://www.artima.com/docs-scalatest-2.0.M5/org/scalatest/selenium/WebBrowser$TextField.html),
[`textArea`](http://doc.scalatest.org/2.1.5/index.html#org.scalatest.selenium.WebBrowser$TextArea),
[`pwdField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$PasswordField),
[`emailField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$EmailField),
[`colorField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$ColorField),
[`dateField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$DateField), ... and so on).
Every argument given to these methods as a string, will be treated as an `Id` element attribute.

In Geb case, we have to assume a completely different point of view. Each selection of DOM elements is achieved using
jQuery-like syntax, which is a JavaScript- and CSS-based tool and, taking into consideration this fact, no matter what we are
looking for and which attribute we are using for filtering elements, the expression is always written in the CSS style
syntax. In CSS `Id` is written after `#` char in the same way as we can see above in Geb code.

After finding this element, we enter &ldquo;venue 7\n&rdquo; into it in order to find a list of products we are
interested in. At this point, the list of search results which contains &ldquo;venue 7&rdquo; string in
title is displayed.

The `\n` substring is added in order to &ldquo;press Enter&rdquo; instead of finding and clicking the submit button in the search form.

In the next step we have to deal with a little more complicated case. We look for a `span` element with text &ldquo;Komputery&rdquo;
which determines a menu position for *Computers* category. In this case we can use
[`linkText`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#linkText-java.lang.String-)
or [`partialLinkText`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#partialLinkText-java.lang.String-)
methods to find a link element with the given text in languages like Java or Scala. But for demonstration purposes
let&rsquo;s assume that the text we look for is not a link. There are no methods in Selenium library that can directly
find an element with some text just by giving this text as an argument. To get around this problem (and many others with
  similar complexity of filtering preconditions) there is one method in Selenium `By` class which resolves it &mdash;
XPath. Generally XPath is a kind of path which allows to go through DOM structures and which delivers methods directing
the browser where to go. In this case we look for a `span` element with text &ldquo;Komputery&rdquo;, so XPath will be
`//span[text() = "Komputery"]`. That means: find every span that has text exactly equal to &ldquo;Komputery&rdquo;. It
is our job to assure that the criteria are unique for the element we are looking for.

Both CSS and XPath allow navigating through DOM structures, but there is one small difference. XPath can go to a parent
node while CSS cannot. CSS can only go deeper and deeper into the structure of the page. So in case we have to find
something that is not unique (but some other element next to it is), only XPath can find this unique element, go higher
up in the structure and then return back to the searched element
(`//unique_element/parent::parent_of_both_elements/descendant::searched_element`). However in our test there will be no
need for such a treatment.

In the case of Geb we can&rsquo;t use XPath so we are left with CSS. At this point jQuery comes to the rescue with its
useful methods. As we can see above, filtering is achieved just by adding &ldquo;text: searched_text&rdquo; argument to
style navigator.

However, we can observe some strange behavior of GEB. Direct translation of Java and Scala XPath to Geb&rsquo;s CSS and
JQuery command should look like this:

```groovy
$("span", text: "Komputery").click()
```

, but instead it has an additional class name parameter &ldquo;name&rdquo;, like in the code below:

```groovy
$("span.name", text: "Komputery").click()
```

Why do we need this? Theoretically there should be no difference &mdash; DOM structure of the page is the same, but in
case of GEB we can observe some inexplicable behavior. It can&rsquo;t deal with pure tag filtering in CSS. It means Geb
can easily find element by Id or class name, but cannot handle a single tag with no additional attributes. That&rsquo;s
the reason we added class name &ldquo;name&rdquo; parameter to the search path.

In the last lines of codes above we deal with quite a similar case. We use XPath/jQuery to find span with class name
&ldquo;name&rdquo; and text which contains substring &ldquo;Tablety&rdquo;. We can do it in the same way as a moment
ago, but we use `contains` method instead. The main difference is that if we don&rsquo;t use &ldquo;contains&rdquo;, the
whole text has to be exactly equal to the matched one. If we use `contains`, the text just has to contain a given substring.
You can find more information about XPath methods for Strings
[here](http://www.w3schools.com/xpath/xpath_functions.asp#string)

Let&rsquo;s go further.

Now when we are in the category page we want to be, with results displayed, it is time to sort the list of results by
price in an ascending order. To do such a thing we need to target the dropdown element responsible for sorting, choose
&ldquo;cena: od najniższej&rdquo; (price: from the lowest) entry and wait for the list to be sorted. This means waiting
until the page is reloaded &mdash; we will wait until the dropdown entry is reloaded and &ldquo;cena: od najniższej&rdquo; is
displayed in it. Let&rsquo;s go to the implementation then.

Java:

```java
//and
findElement(By.cssSelector("div.toggle span.label")).click();
waitForClickableElement(By
  .xpath("//dt[text()='cena']/following-sibling::dd[1]/descendant::a[contains(.,'od najniższej')]")
  ).click();
waitForElementToDisplayText(By.cssSelector("div.toggle span.label"), "od najniższej");
```

Scala:

```scala
And("sort results by lowest price")
click on cssSelector("div.toggle span.label")
eventually {
  click on xpath("//dt[text()='cena']/following-sibling::dd[1]/descendant::a[contains(.,'od najniższej')]")
}
eventually {
  xpath("//span[@class='label' and contains(.,'od najniższej')]").element.isDisplayed should be(true)
}
```

Geb:

```groovy
and: "sort results by lowest price"
$("div.toggle span.label").click()
waitFor { $("div.options dt", text: "cena").next("dd").find("a", text: contains("od najniższej"))
  .click() }
waitFor { $("span.label", text: contains("od najniższej")).displayed }
```

In the first line we look for a dropdown element. In this case I want to show you that Java and Scala can also
navigate the page using CSS. The
[`xpath`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#xpath-java.lang.String-) method is
replaced by [`cssSelector`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#cssSelector-java.lang.String-),
so we can target elements in a similar way as with GEB. We can find `span` with class `label` in block `div` with class
`toggle` and click it. The expected result is a display of the list of elements by which results can be sorted. Then we
have to click the entry &ldquo;cena: od najniższej&rdquo; and wait for the page to reload. This takes some time, so we
use waiting functions delivered with frameworks. In case of Scala and Geb we get quite flexible waiting functions like
`eventually` and `waitFor`. In case of Java we have
[`WebDriverWait`](https://seleniumhq.github.io/selenium/docs/api/java/org/openqa/selenium/support/ui/WebDriverWait.html)
class which has `until` method, which takes `ExpectedConditions` object as an argument, and so on. So I write a method
`waitForClickableElement` to make the code shorter. Its implementation is shown below:

```java
private WebElement waitForClickableElement(By by) {
  return new WebDriverWait(this, timeoutInSeconds, intervalInMilliseconds)
    .until(ExpectedConditions
      .elementToBeClickable(by)
    );
}
```

Now when *waiting functions* should be clear, let&rsquo;s move on to targeting DOM elements. In case of Java and Scala it is
necessary to use XPath again, because we look for an element in a given element structure that has a specified text (`dt`
element with text &ldquo;cena&rdquo; is next to `dd` element and in this `dd` element there is a link with a text
containing &ldquo;od najniższej&rdquo; substring &mdash; quite complex). After clicking the found element we should just
wait for the page to reload (wait until the dropdown element displays &ldquo;cena: od najniższej&rdquo;). And again we will
extract quite a long piece of Java code to an external method.

```java
private void waitForElementToDisplayText(By by, String expectedText) {
  new WebDriverWait(this, timeoutInSeconds, intervalInMilliseconds).until(ExpectedConditions
    .textToBePresentInElementLocated(by, expectedText));
}
```

Scala and Geb use `eventually` and `waitFor` in all cases that require waiting for fulfillment of any asserted conditions.

We are now at the place where we have got a list of search results narrowed down to categories of our choice and sorted in
ascending order by price. Last thing we have to do right now is to check the lowest price of the tablet. However in
the result list there are also gadgets for this tablet with &ldquo;Venue 7&rdquo; in the title and, because results were sorted
by price, they will be first (gadgets are usually cheaper than device itself). For our test we will just assume that
gadget prices are lower than PLN 100.00. So we find the first price which matches `XXX.XX` pattern, where X is a digit.
The first match found will be the lowest price of the tablet. Let&rsquo;s go back to the implementation again.

Java:

```java
//then
Optional<Double> amount = findFirstThreeDigitPrice();
assertThat(amount.isPresent()).isTrue();
assertThat(amount.get()).isGreaterThan(350.0);

quit();
```

Scala:

```scala
Then("the lowest price of device should be higher than PLN 350.00")
val priceStrings = findFirstThreeDigitPrice
priceStrings should not be empty
val amount = priceStrings.get.replace(",", ".").toDouble
amount should be > 350.00

quit()
```

Geb:

```groovy
then: "the lowest price of device should be higher than PLN 350.00"
def priceStrings = $("#featured-offers article span.buy-now.dist", text: contains(~/\d{3},\d{2}/)).text()
!priceStrings.empty
def amount = priceStrings.find(pattern).replace(",", ".").toDouble()
amount > 350.00
```

Let&rsquo;s analyze these code snippets step by step. First we gather all prices from &ldquo;buy now&rdquo; fields as a
list of elements and after that we try to find the first one which matches the given regular expression pattern. Then we
have to extract from the whole text only the interesting part, which represents price, and convert it from the String to
a double type. The last thing to do is to check whether the price is higher than the assumed PLN 350 or not. That would be the
end of our test. This time let&rsquo;s start from the last solution, i.e. Geb. Geb, thanks to jQuery library, can easily
find elements matching some regex. As a result we are able to solve the first problem with a simple line of code:

```groovy
$("#featured-offers article span.buy-now.dist", text: contains(~/\d{3},\d{2}/)).text()
```

There are two ways of writing CSS selectors in GEB framework. For demonstration purposes let&rsquo;s use
a little longer but more readable version which does exactly the same thing.

```groovy
$("#featured-offers").$("article").$("span.buy-now.dist", text: contains(~/\d{3},\d{2}/)).text()
```

Going down through the DOM structure should be read backwards of course, so... We look for a `span` element with `buy-now`
and `dist` classes containing text with a substring matching a regex. This span should be in an `article` tag, and that
tag should be placed in an element with &ldquo;featured-offers&rdquo; id attribute. We can deal with all this filtering by
using a simple one-line jQuery command with the help of a build-in matching tool. Finally we have to check if the
result list is non-empty ( `!priceString.empty` ) and if it is, convert the string to a double value and check if it is higher
than 350.

In Java and Scala things are a little more difficult. Generally, in XPath we can use `match` function, which can compare
any attribute of DOM element to given regex pattern. The problem is that this function is supported since XPath 2.0 and,
for the day of writing this paper, Selenium supports XPath in version 1.0 only. As a result we have to implement a
method to find matching elements and to take the first result by ourselves.

In Java this method looks as follows:

```java
private Pattern amountRegex = Pattern.compile("(\\d{3},\\d{2})");

private Optional<Double> findFirstThreeDigitPrice() {
  List<WebElement> prices = findElements(By
    .xpath("//*[@id='featured-offers']/descendant::article/descendant::span[@class='buy-now dist']"));
  return prices.stream()
    .map(price -> amountRegex.matcher(price.getText()))
    .filter(Matcher::find)
    .map(matcher -> matcher.group(1))
    .map(s -> s.replace(",", "."))
    .map(Double::valueOf)
    .findFirst();
}
```

In this piece of code we gather all elements with buy-now prices, then filter them with `amountRegex` pattern, convert
found Strings to Double type and return the first element which fulfills all these criteria. After that we check if the
optional double value exist (there is a possibility that nothing matches the criteria) and if it does, we check our main
condition, i.e. is returned amount greater than PLN 350.00. It is the end of our test, so we execute `quit` method to
close the browser.

In Scala method looks like:

```scala
val pattern = "\\d{3},\\d{2}"

private def findFirstThreeDigitPrice: Option[String] = {
  findAll(xpath("//*[@id='featured-offers']/descendant::article/descendant::span[@class='buy-now dist']")).map {
    case node => pattern.r.findFirstIn(node.text)
  }.filter(_.isDefined).toList.head
}
```

In this method we look for all elements matching the given XPath (the same as in Java case), then compare each element
of the map with a given pattern, take proper elements, convert them to list and get the first one. after execution of the method
we check if anything was returned (matched the criteria) and if anything did, convert String to Double type and check
the final condition.

This way we implemented our full tests. Whole tests with all imports, dependencies and project structures can be found
on [GitHub](https://github.com/targonsr/comparison-of-test-automation-tools) page.

### Conclusion

We discussed three different solutions dedicated to web testing automation. The most popular is Java with
Selenium library, but in my opinion it is also the least friendly. It doesn&rsquo;t allow for business-readable word
separation both in test names and in syntax, and does not support given/when/then pattern. You can resolve both problems
with [JBehave](http://jbehave.org/) library, but it is a more sophisticated tool for more complex purposes, not for simple
usage we need here. It also has the least flexible *Wait* method with the longest syntax necessary to determine
conditions, which is almost unusable without writing your own replacing methods. The main advantage is an execution time. I
found Java to be the fastest in tests execution and WebDriver browser handling. The differences in time are not
spectacular but noticeable. The best application for this solution is writing tests integrated into Java project and
stand-alone test suite when the shortest execution time is needed. Real differences in time appear in case of
hundreds of tests rather than in case of a common regressive test suite for microservices).

Generally both Scala with ScalaTest (with Specs2 definitely not) and Selenium, and Groovy with Geb are the best
candidates for a standalone test suite in common cases. They are human-readable, with short intuitive commands and
flexible (also with very short syntax) *Wait* methods (`eventually` in case of Scala and `waitFor` in Geb case). Both
also have given/when/then support and type inference in Scala or dynamic variable typing in Groovy.

Despite the fact that Geb has a problem with &ldquo;pure tags&rdquo; filtering, in my opinion it is the winner of this
comparison, because of its shortest and most intuitive commands and, thanks to the jQuery mechanism, flexibility in
matching/filtering of DOM elements. However it is a matter of the preference.

If you have any comments, suggestions, or feedbacks please do not hesitate to comment. I&rsquo;ll be very grateful.
