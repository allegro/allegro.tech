---
layout: post
title: Java Testing Toolbox
author: rafal.glowinski
tags: [java, testing, mockito, junit, assertj]
---

## Introduction
This article is addressed mainly to people who are not very experienced in the area of unit / integration testing although basic knowledge
of [JUnit](http://junit.org/) is required. I am going to provide you with a quick recap of the most commonly used Java testing tools, starting with JUnit
(together with three nice complementary libraries: [JUnitParams](https://github.com/Pragmatists/junitparams), [catch-exception](https://code.google.com/p/catch-exception/)) and [Mockito](https://code.google.com/p/mockito/). Then I will show you how to perform
assertions in a much nicer and cleaner way using [AssertJ](http://joel-costigliola.github.io/assertj/) so that you never have to use [Hamcrest](http://hamcrest.org/JavaHamcrest/) again.

It is important to understand however, that this article is not a tutorial for any of these tools. It is merely a guide (with some
examples) that should make you curious and want to read more on the subject and quite possibly experiment a bit. Have fun!

## JUnit
We have picked JUnit over [TestNG](http://testng.org/) mainly because of the rich set of tools and libraries that just work better with JUnit. Also, most developers
are more accustomed to using JUnit. Both libraries provide a very similar set of functionalities that are just used differently. Let's start with what parts of JUnit we use,
and which we do not and why.

### Rules
What are rules? JUnit's documentation defines rules in the following way: "Rules allow very flexible addition or redefinition of the
behavior of each test method in a test class. Testers can reuse or extend one of the provided Rules below, or write their own.". To put it
simply: JUnit Rules allow one to define custom code to be executed before/after test method (Method-Level Rules) or before/after test
class (Class-Level Rules) in a way that makes them easily reusable between test classes and even projects. We use Class-Level Rules to
start up embedded servers (Apache Cassandra, MongoDB, Undertow) and use them in our tests. More details on how we are using embedded servers
will be found in the later part of this article.

### Parametrized tests
Parametrized test, in general, is a concept that makes it possible to run the same test class with a set of parameters defined outside of
the test method itself. It is a very nice feature that we use extensively, but not JUnit's implementation. Here is how one defines such a
test (example taken from JUnit's Wiki: [https://github.com/junit-team/junit/wiki/Parameterized-tests]
(https://github.com/junit-team/junit/wiki/Parameterized-tests)):

```java
@RunWith(Parameterized.class)
public class FibonacciTest {
    @Parameterized.Parameters
    public static Collection<Object[]> data() {
        return Arrays.asList(new Object[][]{
                {0, 0}, {1, 1}, {2, 1}, {3, 2}, {4, 3}, {5, 5}, {6, 8}
        });
    }
    private int fInput;
    private int fExpected;
    public FibonacciTest(int input, int expected) {
        fInput= input;
        fExpected= expected;
    }
    @Test
    public void test() {
        assertEquals(fExpected, Fibonacci.compute(fInput));
    }
}
```

Notice that parameters have to be defined at class level, since it is Test Class that gets spawned multiple times. We don't like to
write such code and thus have decided to use [JUnitParams](https://code.google.com/p/junitparams/) library instead. The same test could be
now rewritten as follows:

```java
@RunWith(JUnitParamsRunner.class)
public class FibonacciTest2 {
    @Test
    @Parameters({
        "0, 0", "1, 1", "2, 1", "3, 2", "4, 3", "5, 5", "6, 8"
    })
    public void test(int input, int expected) {
        assertEquals(expected, Fibonacci.compute(input));
    }
}
```

Benefits are quite obvious. First of all, we can have multiple test methods each of them defined with a separate set of parameters. What's more,
parameters are defined right next to the test method, which makes tests much easier to read and understand. Last but not least: there
are almost 50% less lines of code!

### Exception testing
Quite often we want to test if System Under Test (SUT) throws some exception. In standard JUnit there are 3 ways to achieve this, none of them good enough.

#### "expected" attribute in @Test

JUnit's `@Test` annotation has `expected` attribute which can be set to a Class object of an exception that is expected to be thrown from
inside of the test. Sample usage looks like this:

```java
@Test(expected = IllegalArgumentException.class)
public void shouldThrowIllegalArgumentExceptionForZeroValue() {
    Fibonacci.compute(0);
}
```

It would work well for a simple one-liner like this, but what if there were more lines in the test method? There are two problems related to using `expected` attribute in `@Test`:

* it does not document exactly where the exception is thrown
* we may catch an exception thrown by another method inside the test method and thus receive a false positive


#### try/catch block

In JUnit, one can solve problems mentioned above by surrounding the line of code we expect to throw an exception, with `try/catch` block.
Now, test code looks as follows:

```java
import static org.junit.Assert.fail;

@Test
public void shouldThrowIllegalArgumentExceptionForZeroValue() {
    //given
    inputGeneratorMock.setStartFrom(0);

    //when
    try {
        Fibonacci.compute(inputGeneratorMock.next());
        fail();
    } catch (IllegalArgumentException e) {
        // ignore expected exception
    }
}
```

Is it nice and easy to read? Maybe... but it also requires us to use an extra call to `fail()` method if somehow the test passes the line that
should throw the expected exception, or we will get a false positive instead.

#### ExpectedException Rule
Another approach to this problem is `ExpectedException` Rule from JUnit. It allows us to set up (also using matchers) what exception was
expected to be thrown. All values are verified **after the test concludes**. Again, rewritten example would look as follows:

```java
import org.junit.rules.ExpectedException;

@Rule
public ExpectedException thrown = ExpectedException.none();

@Test
public void shouldThrowIllegalArgumentExceptionForZeroValue() {
    //given
    thrown.expect(IllegalArgumentException.class);
    thrown.expectMessage("Input must be > 0");

    inputGeneratorMock.setStartFrom(0);

    //when
    Fibonacci.compute(inputGeneratorMock.next());
}
```

It certainly looks cleaner than using `try/catch`, but gives us less control since all thrown (or not) exceptions are verified when test
method concludes. We can safeguard ourselves by putting calls to `rule.expect` as close to our test method call as possible, but it will
obscure the test. Also, some developers were reporting problems with using `@Rule` and `@RunWith` annotations together, they were receiving false
positives in their tests.

#### catch-exception to the rescue!
Luckily, there is a library called [catch-exception](https://code.google.com/p/catch-exception/) that is a very good choice for exception
testing. However, it would not work with the code above, as it does not allow to catch exceptions thrown from static methods. So assuming
we do have an instance of class Fibonacci, we can rewrite above code to:

```java
import static com.googlecode.catchexception.CatchException.catchException;

@Test
public void shouldThrowIllegalArgumentExceptionForZeroValue() {
    //given
    Fibonacci fibonacci = new Fibonacci();
    inputGeneratorMock.setStartFrom(0);

    //when
    catchException(fibonacci).compute(inputGeneratorMock.next());

    //then
    assertThat(caughtException()).isInstanceOf(IllegalArgumentException.class);
}
```

I bet it is easier to read and understand this test written using catch-exception than pure JUnit's functionalities. Unfortunately,
catch-exception library cannot catch exceptions that are thrown from constructors, but it is still a very nice tool to use.


## Mockito
Over the years, [Mockito](http://mockito.org) has become an "industry standard" among Java libraries used for mocking which is not surprising. It has been
released in 2008 (http://monkeyisland.pl/2008/01/14/mockito/) and since that time has almost completely superseded other mocking frameworks
like JMock or EasyMock. According to Wikipedia: "A research performed in 2013 on 10,000 GitHub projects found that Mockito is the 9th most
popular Java library."

So, what exactly Mockito give us? The short version is that it allows us to create mocks (test doubles) and to use them in our unit tests. The
longer is a bit more complex.

Mocks can be used for both stubbing ( = telling a mock how to behave when it is interacted with) and verification (if required method has
been called, how many times etc.). Thanks to Mockito, these are now much easier to do than they used to be in older mocking libraries that
were mostly following "expect - run - verify" pattern. Now you can just stub behaviour or just verify your expectations. They are not
coupled heavily together anymore. What's more, you use real Java code (no strings for method names = easy refactoring) without any
additional Domain Specific Language (DSL), because interactions are method calls. There are two semantically identical syntaxes,
for performing stubbing, available in Mockito:

* when / then (e.g. when(mockObject.foo()).thenReturn(bar))
* given / will (e.g. given(mockObject.foo()).willReturn(bar))

with the latter being much closer to a BDD approach and is also the one I encourage you to use.

Mockito also has so called Spy objects (partial mocks) that let us stub only parts of class methods. But be very careful, if you write
new code and you need to use a Spy to test it properly, then it usually means that the design of the classes is flawed.
There is even a warning in Mockito's JavaDoc:

> Object oriented programming is more less tackling complexity by dividing the complexity into separate, specific, SRPy objects. How does
> partial mock fit into this paradigm? Well, it just doesn't...  Partial mock usually means that the complexity has been moved to a different
> method on the same object. In most cases, this is not the way you want to design your application.
>
> However, there are rare cases when partial mocks come handy: dealing with code you cannot change easily (3rd party interfaces, interim
> refactoring of legacy code etc.)
> However, I wouldn't use partial mocks for new, test-driven & well-designed code.

This article is by no means a Mockito tutorial, so let me just point you to the [official documentation]
(http://docs.mockito.googlecode.com/hg/latest/org/mockito/Mockito.html) for more information and some examples as well. If you feel like
reading more on the topic then the book "Practical Unit Testing with JUnit and Mockito" by Tomasz Kaczanowski is the right one for you. It has
was published in April, 2013 and covers all the aspects of proper Mockito usage.

Another explanation of differences between different types of objects used in tests can be found at [this blog post](http://blog.8thlight.com/uncle-bob/2014/05/14/TheLittleMocker.html) by Robert C. Martin.


## AssertJ
[AssertJ](http://joel-costigliola.github.io/assertj/) is a Java library containing a very rich set of predefined fluent assertions but at the same time it makes it very easy to write
your own. It has started off as a fork of a well known [FEST Assert](https://code.google.com/p/fest/) but until today it has greatly superseded
its parent. AssertJ's creator has decided to fork FEST Assert because he was happy neither with the pace at which development of version
2.x was progressing nor with its openness to user demands and contributors.

Before FEST Assert (and AssertJ later on) were available, the most popular way to verify expectations in JUnit was to use JUnit's built in assertions
like `import static org.junit.Assert.assertEquals` or `org.hamcrest.MatcherAssert.assertThat` with Hamcrest matchers `org.hamcrest.Matchers` or
a mix of both. The new approach to assertions not only lets you verify expectations more easily but also makes your code much nicer and easier to read. An example? Sure!

Let us assume we have following classes, where `PersonDataReader` reads and parses data from some bizarre text format.

```java
// some typical anemic data container
public class Person {
    private final String name;
    private final String lastName;
    private final Sex sex;
    public Person(String name, String lastName, Sex sex) {
        this.name = name;
        this.lastName = lastName;
        this.sex = sex;
    }

    // getters
    // +
    // proper implementation of equals and hashCode
}

// common interface for all custom Data Readers
public interface DataReader<T> {
    List<T> readAll(String filePath);
}

// ...and its file based implementation for Person class
public class PersonDataReader implements DataReader<Person> {
    @Override
    public List<Person> readAll(String filePath) {
        // some complex code here
    }
}
```

Now, how would we test the code of class `PersonDataReader` using plain JUnit + Hamcrest ? Most likely we would end up with code similar to
this one:

```java
@Test
public void shouldCorrectlyReadAndParseInputFile() {
    //given
    PersonDataReader reader = new PersonDataReader();

    //when
    List<Person> readData = reader.readAll("<file on classpath>");

    //then
    assertEquals(readData.size(), 3);
    assertEquals(readData.get(0), new Person("Jim", "Morrison", Sex.MALE));
    assertEquals(readData.get(1), new Person("Aretha", "Franklin", Sex.FEMALE));
    assertEquals(readData.get(2), new Person("Frank", "Sinatra", Sex.MALE));
}
```

It is not the worst test I have ever seen, but it certainly can be made much cleaner using AssertJ and its built in Assertions for
Collection classes:

```java
@Test
public void shouldCorrectlyReadAndParseInputFile() {
    //given
    PersonDataReader reader = new PersonDataReader();

    //when
    List<Person> readData = reader.readAll("<file on classpath>");

    //then
    assertThat(readData)
            .hasSize(3)
            .containsOnly(
                    new Person("Jim", "Morrison", Sex.MALE),
                    new Person("Aretha", "Franklin", Sex.FEMALE),
                    new Person("Frank", "Sinatra", Sex.MALE)
            );
}
```

We can also go one step further and use extractors together with tuples (no direct Person constructor calls):

```java
@Test
public void shouldCorrectlyReadAndParseInputFile() {
    //given
    PersonDataReader reader = new PersonDataReader();

    //when
    List<Person> readData = reader.readAll("<file on classpath>");

    //then
    assertThat(readData)
            .hasSize(3)
            .extracting("name", "lastName", "sex")
            .containsOnly(
                    tuple("Jim", "Morrison", Sex.MALE),
                    tuple("Aretha", "Franklin", Sex.FEMALE),
                    tuple("Frank", "Sinatra", Sex.MALE)
            );
}
```

or if we often have to perform assertions on instances of `List<Person>` then we can create our own assertion:

```java
public class PersonListAssert extends ListAssert<Person> {
    protected PersonListAssert(List<Person> actual) {
        super(actual);
    }

    public static PersonListAssert assertThat(List<Person> actual) {
        return new PersonListAssert(actual);
    }

    public PersonListAssert hasPerson(int index, String name, String lastName, Sex sex) {
        isNotNull();

        // check index
        // ... index checking code ...

        // check name
        String actualName = actual.get(index).getName();
        if (!actualName.equals(name)) {
            failWithMessage("Expected person's name to be <%s> but was <%s>", name, actualName);
        }

        // check last name
        String actualLastName = actual.get(index).getLastName();
        if (!actualLastName.equals(lastName)) {
            failWithMessage("Expected person's last name to be <%s> but was <%s>", lastName, actualLastName);
        }

        // check sex
        Sex actualSex = actual.get(index).getSex();
        if (actualSex != sex) {
            failWithMessage("Expected person's sex to be <%s> but was <%s>", sex, actualSex);
        }

        return this;
    }
}
```

and rewrite the test for the last time:

```java
@Test
public void shouldCorrectlyReadAndParseInputFile() {
    //given
    PersonDataReader reader = new PersonDataReader();

    //when
    List<Person> readData = reader.readAll("<file on classpath>");

    //then
    PersonListAssert.assertThat(readData)
            .hasPerson(0, "Jim", "Morrison", Sex.MALE)
            .hasPerson(1, "Aretha", "Franklin", Sex.FEMALE)
            .hasPerson(2, "Frank", "Sinatra", Sex.MALE)
            .hasSize(3);
}
```

This is of course just an example of what AssertJ is capable of doing. I really encourage you to read the documentation and experiment a bit.

Just to make you a bit excited about AssertJ, here is the list of some assertions that are provided out of the box in the Core module:

* BooleanAssert / BigDecimalAssert / StringAssert / DoubleAssert / CharacterAssert / etc.
* ClassAssert
* IterableAssert
* FileAssert / InputStreamAssert
* ListAssert / MapAssert
* ThrowableAssert

There are also additional modules (other than Core) of AssertJ that enhance this already rich set of assertions with additional ones:

* Guava ([http://joel-costigliola.github.io/assertj/assertj-guava.html](http://joel-costigliola.github.io/assertj/assertj-guava.html))
* Joda-Time ([http://joel-costigliola.github.io/assertj/assertj-joda-time.html](http://joel-costigliola.github.io/assertj/assertj-joda-time.html))
* Swing UI ([http://joel-costigliola.github.io/assertj/assertj-swing.html](http://joel-costigliola.github.io/assertj/assertj-swing.html))

## Spock
>[Spock](https://code.google.com/p/spock/) is a testing and specification framework for Java and Groovy applications. What makes it stand out from the crowd is its beautiful
>and highly expressive specification language. Thanks to its JUnit runner, Spock is compatible with most IDEs, build tools, and continuous
>integration servers.

I am not going to cover Spock's features in this article as it has already grown way beyond initial assumptions. But at the same time, I
think that it would be not fair not to mention Spock framework at all as it is the new star on the horizon and is getting more and more
popular each day. It is a bit like Mockito + AssertJ (+ a few others) combined into one library with Groovy's awesome syntactic sugar. I
really recommend you to at least give it a try and see if you like it.

## Conclusions
I have presented a set of core tools that I use in my everyday work and that I find best suited for me. They really help me to write
better: more expressive and cleaner, tests. Knowing that Java community is by far the biggest IT community in the World, there is a big
chance that I have missed some really nice testing libraries (maybe even better that the ones I am using). Let me know if that is the case!

## More reading (highly recommended...)

* [Growing Object-Oriented Software, Guided by Tests by Steve Freeman and Nat Pryce](http://www.growing-object-oriented-software.com/)
* [xUnit Test Patterns: Refactoring Test Code by Gerard Meszaros](http://xunitpatterns.com/)
* [Practical Unit Testing with JUnit and Mockito by Tomasz Kaczanowski](http://practicalunittesting.com/)
* [Bad Tests, Good Tests by Tomasz Kaczanowski](http://practicalunittesting.com/btgt.php)
