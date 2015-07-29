---
layout: post
title: Comparison of WebDriver-based solutions for test automation
author: ryszard.targonski
tags: [java, scala, groovy, geb, selenium, webrdriver, testing, automated testing]
---
Nowadays, in age of great popularity of test automation, we can observe growing number of different frameworks which
allow us to write scripts and programs that simulate human actions performed on the website under test. The most popular
solution for this kind of tests is, compatible with majority of common languages, [Selenium](http://www.seleniumhq.org/docs/)
WebDriver framework. Wide compatibility is a big advantage of Selenium specially in cases when we have to write some
tests integrated to our application project, cause no matter in which language we write application, Selenium probably
has an API for that language too. But there are also situations, like writing standalone test suite, when we can decide
in which technology we&rsquo;d like to write the most. Taking into consideration this case, let me introduce You short
comparison of three jdk-based technologies:

* Java with JUnit and Selenium frameworks,
* Scala with ScalaTest and Selenium frameworks,
* Groovy with GEB framework.

Let me present them briefly to You.
I think there is no need to introduce Java, one of the most popular objective language these days, as well as common
unit test framework for Java &mdash; JUnit. Both give us great and easly-extended environment for writing unit tests. But We
also need something that will give us an opportunity to automatically open web browsers, to manage them, and to interact
with individual page elements the way end user can do. In this place the aforementioned Selenium comes to the rescue.
Selenium is WebDriver&mdash;based framework which works with many browsers (like Safari, Opera, Chrome, Internet Explorer,
Firefox, different headless browsers ...), operating systems, programming languages (such as C#, Groovy, Haskell, Java,
JavaScript, Objective&mdash;C, Perl, PHP, Python, Ruby, Scala ...) and their testing frameworks (NUnit, JUnit, TestNG, Behat,
robot framework, RSpec ...). Selenium allows opening web browser of our choice automatically, going to chosen pages and
interacting with them like &ldquo;reading website&rdquo;, checking title, clicking, writing, moving elements, checking
sources, clear and set cookies, etc. Java with JUnit (or TestNG) and Selenium library is nowadays most common solution
for web testing automation.

The second programming language I want to talk about is Scala. Scala is a JDK&mdash;based language that is much younger than
Java and allows both objective and functional programming paradigms. Two the most popular testing frameworks for Scala
are [ScalaTest](http://scalatest.org/) and [Specs2](https://etorreborre.github.io/specs2/).
Depending on our needs we should choose ... Specs2 if we need to have our tests integrated with our service. The main
advantage of this framework is its ability to easily start the service under test before the tests themselves are
started. For example it is highly integrated with Play framework which can do such a thing. The other hand if You don&rsquo;t
need to integrate tests with product and can write standalone tests suite, then I recommend ScalaTest framework which
has, in my opinion, more intuitive and definitely more user friendly syntax. In this article I am going to use ScalaTest
and Selenium library for Scala.

The last technology I want to talk about is GEB, which is Groovy&mdash;based solution combining the conciseness of Groovy
language with the flexibility of DOM navigation syntax of jQuery and CSS. This solution is designed only for web testing
automation purposes.

All versions of test will be shown as standalone tests designed to use FireFox browser and all will be written with
business friendly given&mdash;when&mdash;then pattern. For better clearness of code we won&rsquo;t use any test patterns
like Page Object, but of course all of solutions showed below support this methodology.

### Necessary libraries

At the begging we have to prepare our environments to writing tests. So let&rsquo;s start with required libraries.
All libraries attached to project will be managed by proper build tool (Gradle for Java and Groovy, and SBT for Scala).
Required dependencies are:

Java project: **build.gradle** file

```java
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

```java
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

```java
name := "Comparision_Scala"
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
focus only on pure features delivered by test frameworks.

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

```java
import org.scalatest._
import org.scalatest.selenium.Firefox

class ComparisonTest extends FlatSpec with Firefox with Matchers {

  "The lowest price of Venue 7 tablet on Allegro" should "be higher than PLN 350.00" in {
    ...
  }
}
```

And in Geb it is **ComparisonTest.groovy**

```java
class ComparisonTest {

  def "Check the lowest price of Venue 7 on allegro"() {
    ...
  }
}
```

In additional we include also an external file **GebConfig.groovy** containing settings (of course we can set these
settings in test class, but this is the most popular and the best solution of structure organization.)

```java
import org.openqa.selenium.firefox.FirefoxDriver

driver = { new FirefoxDriver() }
```

First thing we can observe, even in the pure template of test, is more friendly test name (description) in ScalaTest
(FlatSpec) and in Geb. Here is the first disadvantage of Java solution.

*Note: In this paper I won&rsquo;t describe all test templates of ScalaTest (as FlatSpec). I choose the most readable in
my opinion. To read more information about test templates in ScalaTest go to
[documentation](http://www.scalatest.org/user_guide/selecting_a_style).*

### First look on Test

Now if we have ready testing environment, let&rsquo;s design simple test checking that the lowest price of Dell Venue 7
tablet is higher than PLN 350,00. The scenario of test has the following steps:

1.  Go to Allegro Site
2.  Write &ldquo;venue 7&rdquo; in searching field and press enter
3.  Click the &ldquo;Komputery&rdquo;(Computers) category link
4.  Click the &ldquo;Tablety&rdquo;(Tablet&rsquo;s) category link
5.  Sort results from the lowest price using Dropdown with choosing &ldquo;Cena: Od najniższej&rdquo; position
6.  Get the first result from promoted offers with &ldquo;Buy Now&rdquo; option containing price with three digits before comma sign
7.  Check that found price is higher than PLN 350.00.

Scenario is quite simple and could be designed more reasonable, but it is perfect for demonstration purposes.

### Test implementation

If we have a scenario, now it&rsquo;s time for step by step implementation.

It is worth to be mentioned, that Java is the only technology which does not have any library or framework which support
pure given&mdash;when&mdash;then pattern. All given, when, and, then notifications are not obligatory, but they make
test more readable for business user.

First step is to open Allegro web site. This step will be followed by check that the site we are in is Allegro indeed.
To do such a thing we will use the following commands:

Java:

```java
//when
get("http://allegro.pl");

//then
getTitle().startsWith("Allegro.pl");
```

Scala:

```java
When("Going to Allegro Page")
go to "http://allegro.pl"

Then("title should start with Allegro.pl")
pageTitle should startWith("Allegro.pl")
```

Geb:

```java
when: "Going to Allegro Page"
go "http://allegro.pl/"

then: "title should start with Allegro.pl"
title.startsWith("Allegro.pl")
```

As we can see all instructions are quite similar and intuitive in all languages. The main difference is delivered with
Groovy language and ScalaTest framework word separation syntax which is not present in Java.

Next stage is to enter &ldquo;Venue 7&rdquo; string to search box and select chosen categories.

Java:

```java
//when
findElement(By.id("main-search-text")).sendKeys("venue 7\n");
findElement(By.xpath("//span[text() = 'Komputery']")).click();
findElement(By.xpath("//span[@class='name' and contains(.,'tablety')]")).click();
```

Scala:

```java
When("we display list of Venue 7 offers in Tablet's category")
textField("main-search-text").value = "venue 7\n"
click on xpath("//span[text() = 'Komputery']")
click on xpath("//span[@class='name' and contains(.,'tablety')]")
```

Geb:

```java
when: "we display list of Venue 7 offers in Tablet's category"
$("#main-search-text") << "venue 7\n"
$("span.name", text: "Komputery").click()
$("span.name", text: contains("Tablety")).click()
```

In this part of code I would like to show You a few kinds of targeting DOM elements. First line of each solution begins
with targeting an object by *Id* attribute. Each technology has a different approach to resolve this
problem.

Java has [`By`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html) abstract class with many
methods (like `id`, `linkText`, `partialLinkText`, `name`, `tagName`, ...) which allow us to select chosen element. In
this case we use `By.id()` notation.

Scala also has [`findElement`](https://selenium.googlecode.com/svn/trunk/docs/api/java/org/openqa/selenium/WebElement.html#findElement%28org.openqa.selenium.By%29)
method like Java, which takes By object as argument, but in additional it has a few implemented in advance others
methods dedicated to each type of input field (like [`textField`](http://www.artima.com/docs-scalatest-2.0.M5/org/scalatest/selenium/WebBrowser$TextField.html),
[`textArea`](http://doc.scalatest.org/2.1.5/index.html#org.scalatest.selenium.WebBrowser$TextArea),
[`pwdField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$PasswordField),
[`emailField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$EmailField),
[`colorField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$ColorField),
[`dateField`](http://doc.scalatest.org/2.0/index.html#org.scalatest.selenium.WebBrowser$DateField), ... and so on).
Every argument given to these methods as a String, will be considered as an **Id** element attribute.

In Geb case, we have to take a completely different point of view. Each selection of DOM elements is achieved using
jQuery syntax, which is JavaScript- and CSS-based tool and, taking into consideration this fact, no matter what we are
looking for and which attribute we are using to filtering elements, always the expression is written in the CSS styles
manner. In CSS *Id* is written after *#* char in the same way as we can see it above in Geb code.

After finding this element, we write &ldquo;venue 7\n&rdquo; into it in order to find a list of products we are
interested in. At this point the list of searching results which are containing given &ldquo;venue 7&rdquo; string in
title is displayed.

The &ldquo;\n&rdquo; substring is added to &ldquo;press Enter&rdquo; instead of finding submit button for search form.

In the next step we have to deal with a little more complicated case. We look for a span element with text &ldquo;Komputery&rdquo;
which determines a menu position for computers category. In this case we can use
[`linkText`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#linkText-java.lang.String-)
or [`partialLinkText`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#partialLinkText-java.lang.String-)
methods to find a link element with a text given as an argument in languages like Java and Scala. But for demonstration
purposes let&rsquo;s assume that the text we look for is not a link (there are no methods in Selenium library that can
directly find an element with some text just by giving this text as an argument). To get around this problem (and many
others with similar complexity of filtering preconditions) there is one method in Selenium *By* class which resolves it &mdash;
XPath. Generally XPath is a kind of path which allow Us to go through DOM structures and which deliver us some methods
directing Us where to go. In this case we look for span element with text &ldquo;Komputery&rdquo;, so XPath will be
`//span[text() = "Komputery"]`. That means &mdash; find every span that has text exactly equal to &ldquo;Komputery&rdquo;.
It is our job to assure that criteria will be unique for element we are looking for.

Both CSS and XPath allow to travel through DOM structures, but there is one small difference. XPath can go to
parent node while CSS cannot. CSS can only go deeper and deeper into the structure of page. So in case we have to find
something that is not unique (but some other element next to it is), only XPath can find this unique element, go
upper in the structure and then return lower to searched element
(`//unique_element/parent::parent_of_both_elements/descendant::searched_element`). However in our test there will be no
need for such a treatments.

In Geb case we can&rsquo;t use XPath so we are condemned to use CSS. In this place jQuery comes to the rescue with its
useful methods. As we can see above filtering is achieved just by adding &ldquo;text: searched_text&rdquo; argument to
styles navigator.

However we can observe some strange behavior of GEB. Direct translation of Java and Scala XPath to Geb&rsquo;s CSS and
JQuery command, should looks like this:

```java
$("span", text: "Komputery").click()
```

, but instead it has additional class name &ldquo;name&rdquo; parameter like in case of next lines of code and looks like:

```java
$("span.name", text: "Komputery").click()
```

What is the reason of such a treatment? Theoretically there should be no difference &mdash; DOM structure on the page is
the same, but in case of GEB we can observe some inexplicable behavior. It can&rsquo;t deal with pure tag filtering in
CSS. It means Geb can easily find element by id or class name, but cannot handle single tag with no additional attributes.
That&rsquo;s the reason we added class name &ldquo;name&rdquo; parameter to search path.

In the last lines of codes above we deal with quite similar case. We use XPath/jQuery to find span with
class name &ldquo;name&rdquo; and text which contains substring &ldquo;Tablety&rdquo;. We can do it in the same way like
a moment ago, but we use `contains`; method instead for demonstration purpose (the main difference is that if we
don&rsquo;t use &ldquo;contains&rdquo; ,the whole text has to be exactly like a given one. If we use it, text just has
to contain a substring with given text &mdash; it is very useful). The more information about XPath methods for Strings
You can find [here](http://www.w3schools.com/xpath/xpath_functions.asp#string)

This way we just make first steps in our test. Let&rsquo;s go further.

Now when we are on category we want to be, with results displayed, it is the time to sort the list of that results
ascending (from the lowest price). To do such a thing we need to target dropdown element responsible for sorting on page
, choose &ldquo;cena: od najniższej&rdquo; (price: from the lowest) position, and wait for the list to be sorted (page
to be reloaded - precisely in this case we will wait until dropdown position will be reloaded and
&ldquo;cena: od najniższej&rdquo; will be displayed in it). Let&rsquo;s go to implementation then.

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

```java
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

```java
and: "sort results by lowest price"
$("div.toggle span.label").click()
waitFor { $("div.options dt", text: "cena").next("dd").find("a", text: contains("od najniższej"))
  .click() }
waitFor { $("span.label", text: contains("od najniższej")).displayed }
```

In the first line of code we look for a dropdown element. In this case I want to show You that Java and Scala can also
navigate on page using CSS. The method
[`xpath`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#xpath-java.lang.String-) is
replaced by [`cssSelector`](https://selenium.googlecode.com/git/docs/api/java/org/openqa/selenium/By.html#cssSelector-java.lang.String-),
so we can target elements in similar way like we do with GEB. We can find *span* with class *label* in block *div* with
class *toggle* and click it. The expected result is a display of the list of elements by which results can be sorted.
Then we have to click chosen position (&ldquo;cena: od najniższej&rdquo;) and wait for page to reload. This takes some
time, so we use delivered with frameworks waiting functions. In case of Scala and Geb we have already given quite
elastic waiting functions like `eventually` and `waitFor`. In case of Java we have got
[`WebDriverWait`](https://seleniumhq.github.io/selenium/docs/api/java/org/openqa/selenium/support/ui/WebDriverWait.html)
class which has method until, which takes ExpectedConditions object as an argument, and so on. So I write a method
`waitForClickableElement` to make code much shorter. Its implementation is shown below:

```java
private WebElement waitForClickableElement(By by) {
  return new WebDriverWait(this, timeoutInSeconds, intervalInMilliseconds)
    .until(ExpectedConditions
      .elementToBeClickable(by)
    );
}
```

Now when *waiting functions* should be clear, let&rsquo;s go to targeting DOM element. In case of Java and Scala it is
necessary to use XPath again, because we look for an element in given element structure that have given text
(*dt* element with text &ldquo;cena&rdquo; is next to *dd* element and in this *dd* element there is a link with a text
containing &ldquo;od najniższej&rdquo; substring &mdash; quite complex). After clicking found element we should just
wait for the page to reload (We wait until dropdown element will display &ldquo;cena: od najniższej&rdquo;). And again
we will extract quite long piece of code in Java to external method.

```java
private void waitForElementToDisplayText(By by, String expectedText) {
  new WebDriverWait(this, timeoutInSeconds, intervalInMilliseconds).until(ExpectedConditions
    .textToBePresentInElementLocated(by, expectedText));
}
```

Scala and Geb use `eventually` and `waitFor` in all cases requiring waiting for fulfillment of any assumed
conditions.

We are now at the place where we have got a list of search results bounded by categories of our choice and sorted
ascending by price. Last think we have to do right now is to check the lowest price of tablet. However in results list
also appear different gadgets for this tablet with &ldquo;Venue 7&rdquo; in title and, cause results were sorted by
price , they will be first (gadgets are usually cheaper than device itself). For our test we will just assume that
gadgets prices are lower than PLN 100.00. So we will find the first price which matches to XXX.XX pattern, where X is a
digit. The first found match will be the lowest price of tablet. Let&rsquo;s go back to implementation again.

Java:

```java
//then
Optional<Double> amount = findFirstThreeDigitPrice();
assertThat(amount.isPresent()).isTrue();
assertThat(amount.get()).isGreaterThan(350.0);

quit();
```

Scala:

```java
Then("the lowest price of device should be higher than PLN 350,00")
val priceStrings = findFirstThreeDigitPrice
priceStrings should not be empty
val amount = priceStrings.get.replace(",", ".").toDouble
amount should be > 350.00

quit()
```

Geb:

```java
then: "the lowest price of device should be higher than PLN 350,00"
def priceStrings = $("#featured-offers article span.buy-now.dist", text: contains(~/\d{3},\d{2}/)).text()
!priceStrings.empty
def amount = priceStrings.find(pattern).replace(",", ".").toDouble()
amount > 350.00
```

Let&rsquo;s analyze these code snippets step by step. First we gather all prices from &ldquo;buy now&rdquo; fields as a
list of elements and after that we try to find the first one which matches given regular expression pattern. Then we
have to cut only the interesting part, which represents price, from the whole text and convert it from String to double
type. The last thing to do is to check whether is the price higher than assumed PLN 350 or not. That would be the end of
our test. This time let&rsquo;s start from the last solution, i.e. Geb. Geb, thanks to jQuery library, can easily find
element matching some regex. In result we are able to solve first problem with a simple line of code:

```java
$("#featured-offers article span.buy-now.dist", text: contains(~/\d{3},\d{2}/)).text()
```

Maybe for demonstration purposes (there are two ways of writing CSS selectors in GEB framework) let&rsquo;s write it in
a little longer but more readable version which does completely the same.

```java
$("#featured-offers").$("article").$("span.buy-now.dist", text: contains(~/\d{3},\d{2}/)).text()
```

Going down through DOM structures should be of course read backward, so... We look for a *span* element with
*buy&mdash;now* and *dist* classes containing text with a substring matching regex. This span should be in an
&ldquo;article&rdquo; tag, and that tag should be placed in element with &ldquo;featured-offers&rdquo; id attribute. We
can deal with all this filtering by just using simple one-line jQuery command with the help of build&mdash;in matching
tool. Finally we have to check if the result list is not empty ( `!priceString.empty` ) and if it is not, convert string
to double value (that it could be compared to 350.00) and check if it is higher than assumed value.

In Java and Scala ... things are a little more difficult. Generally in XPath we can use `match` function, which can
compare any attribute of DOM element to given regex pattern. The trouble is, that this function is supported since XPath
2.0 and, for the day of writing this paper, Selenium supports XPath in version 1.0 only. As a result we have to implement
a method to find matching elements and to take the first result on our own.

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

In this piece of code we gather all elements with buy&mdash;now prices, then filter them with `amountRegex` pattern,
convert found Strings to Double type and return the first element which fulfill all these criteria. After that we
check if the optional double value exist (there is possibility that nothing will be returned, because nothing will
fulfill criteria) and if it does, we check our main condition, i.e. is returned amount greater than PLN 350.00.
It is the end of our test, so we execute `quit` method to close the browser.

In Scala method looks like:

```java
val pattern = "\\d{3},\\d{2}"

private def findFirstThreeDigitPrice: Option[String] = {
  findAll(xpath("//*[@id='featured-offers']/descendant::article/descendant::span[@class='buy-now dist']")).map {
    case node => pattern.r.findFirstIn(node.text)
  }.filter(_.isDefined).toList.head
}
```

In this method we are look for all elements matching the given XPath (the same as in Java case), then compare each
element of map with given pattern, take proper elements, converte them to list and get the first one. After
execution of method we check did anything was returned (fulfilled the criteria) and if did, convert String to
Double type and check out final condition.

This way we implemented our full tests. Whole tests with all imports, dependencies and project structures can be found
on [GitHub](https://github.com/targonsr/comparison-of-test-automation-tools) page.

### Conclusions

There were introduced three different solutions dedicated for web testing automation. The most popular is Java with
Selenium library, but in my opinion it is the least friendly also. It doesn&rsquo;t allow for business-readable word
separation, and do not support given/when/then pattern (You can resolve both problems with [JBehave](http://jbehave.org/)
library, but it is more complex tool for more complex purposes, not for a such simple usage as we need here). It also
has quite long and the least elastic *Wait* method, which is almost unusable without writing your own replacing methods.
The main advantage is execution time. Java is the fastest in tests execution and WebDriver browser handling. The
differences in time are not very spectacular but noticeable. The best application for this solution is writing
integrated tests in Java project and stand-alone test suite when the shortest execution time is needed (rather in case
of hundreds of tests than in case of common regressive test suite for microservices).

Generally both Scala with ScalaTest (cause with Specs2 definitely not) and Selenium, and Groovy with Geb are the best
candidates for stand-alone test suite in common cases. They are human-readable, with short intuitive commands and
elastic (also very short) *Wait* methods (`eventually` in case of Scala and `waitFor` in Geb case). Both also have
given/when/then support and (thanks to languages) dynamic variables typing.

Despite the fact that Geb has a problem with &ldquo;pure tags&rdquo; filtering, in my opinion it is the winner of this
comparison, because of its shortest and the most intuitive commands and, thanks to the jQuery mechanism, flexibility in
matching/filtering of DOM elements. However it is the matter of the preferences.

If You have any comments, suggestions, or feedbacks please do not hesitate to contact me. I&rsquo;ll be very grateful.
