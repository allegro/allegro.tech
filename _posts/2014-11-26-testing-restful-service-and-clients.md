---
layout: post
title: Testing RESTful services and their clients
author: rafal.glowinski
tags: [java, testing, junit, restito, rest-assured, rest]
---

[REST (Representational State Transfer)](http://en.wikipedia.org/wiki/Representational_state_transfer) has become very popular
over the course of the past few years. It has happened so not only because of growing popularity of lightweight Web frameworks
(like [Angular.js](https://angularjs.org/)) but also due to the new [Microservice Architecture](http://martinfowler.com/articles/microservices.html)
hype (thank you [Netlifx](http://techblog.netflix.com/)). Frameworks like Spring add new REST-related functionalities with
each new release and more and more companies decide to give them a try... But how do you test them - REST services and their clients?

In the first part of this article I show how to test REST service clients using [Restito](https://github.com/mkotsur/restito)
library. Second part contains a bit more complex example of testing REST service with [REST-assured](https://code.google.com/p/rest-assured/).
Both of these libraries can be used with JUnit, so if you read my previous article: [Java Testing Toolbox]({% post_url 2014-10-01-java-testing-toolbox %}),
then you should be already well accustomed to testing with JUnit and given-when-then style of writing tests.

### Client testing with Restito ([https://github.com/mkotsur/restito](https://github.com/mkotsur/restito))
Restito is a tool that can be used to mock a REST server. It allows you to stub HTTP calls and verify interactions between the client and the
server. This is why it is only suitable for testing REST clients. Restito starts an HTTP server that is later used to stub certain calls.
It is best used with JUnit (and JUnit Rules) because such setup is very simple.

Create a base class for your Restito tests and use ```com.xebialabs.restito.support.junit.ServerDependencyRule``` JUnit Rule:

```java
public abstract class StubServerDependent {
    protected StubServer server;

    @Rule
    public ServerDependencyRule serverDependency = new ServerDependencyRule();

    @Before
    public void startServer() {
        if (serverDependency.isServerDependent()) {
            server = new StubServer().run();
        }
    }

    @After
    public void stopServer() {
        if (server != null) {
            server.stop();
        }
    }
}
```

Then make sure your test class extends ```StubServerDependent``` and use ```com.xebialabs.restito.support.junit.NeedsServer``` annotation on each
test method that needs a stub HTTP server. You will also need to initialize the client since stub server starts on "localhost" and a random port
that can be read from the protected field ```server``` (of type ```StubServer```) that is available to all extending classes. The complete example
is presented below (remember that we are using Jersey Client in our code).

We are going to use [http://www.openweathermap.com/](http://www.openweathermap.com/) and its public, free REST API. The most
basic request is a query for current weather data for a city (by name):
[http://api.openweathermap.org/data/2.5/weather?q=Warsaw](http://api.openweathermap.org/data/2.5/weather?q=Warsaw)
If you need a quick JSON Schema to POJO generator then consider this one: [http://jsongen.byingtondesign.com/](http://jsongen.byingtondesign.com/).

**Restito test class setup**

```java
public class OpenWeatherMapClientTest extends StubServerDependent {
    private OpenWeatherMapClient client;

    @Before
    public void setUp() throws Exception {
        WebTarget webTarget = ClientBuilder.newClient().target("http://localhost:" + server.getPort());
        client = new OpenWeatherMapClient(webTarget);
    }

    @Test
    @NeedsServer
    public void shouldReadCurrentWeatherDataForWarsaw() {
        // ...
    }
}
```

Now that we have setup Restito and JUnit, we can finally write a test. First one will be easy as we just want to make sure that our code
performs an HTTP GET to the proper path (with proper query params) and correctly parses the response.

**Simple "happy day scenario" test**

```java
@Test
@NeedsServer
public void shouldReadCurrentWeatherDataForWarsaw() {
    //given
    whenHttp(server).match(uri("/data/2.5/weather"), parameter("q", "Warsaw"))
            .then(ok(), stringContent("..."), contentType("application/json"));

    //when
    CurrentWeatherData currentData = client.readCurrentDataForCity("Warsaw");

    //then
    verifyHttp(server).once(
            method(Method.GET),
            uri("/data/2.5/weather"),
            parameter("q", "Warsaw")
    );

    // Assume we have a custom assertion for CurrentWeatherData class
    assertThat(currentData)
            .hasCityName("Warsaw")
            .hasCountryCode("PL");
}
```

So what happens in this test?

* First, we tell our stub server to return predefined text content ```stringContent(...)```, HTTP Response Status 200 and
Content-Type = "application/json" when server path "/data/2.5/weather" is queried with a query string "q=Warsaw".
* Then we perform a normal client call using an instance of our client class: ```OpenWeatherMapClient``` and we verify if the stub server is queried with a proper HTTP GET request.
* At the very end, we just assert (using our custom assertion) that returned object contains all the data that should be parsed from JSON
response received from the stub server.

Even though both the usage scenario and above test were very simple, you should already get some more insight into what Restito is and how
to use it. What's important, it is very easy to modify the code to test if our client behaves properly when REST server returns
HTTP Response Code of 404 or 500. We find Restito to be #1 tool for testing our REST clients.

### Server testing with REST-assured ([https://code.google.com/p/rest-assured/](https://code.google.com/p/rest-assured/))
Unlike Restitio, REST-assured is designed to test RESTful services. It is much easier to test RESTful services in dynamic languages
(e.g. Groovy) than it is in Java. This is where REST-assured and its nice DSL syntax come in handy. You would most likely want to use this
tool when testing your own services running in some embedded server (Jetty, Undertow, etc.). REST-assured is able to send real HTTP requests
over the wire and thus lets you perform some real end-to-end testing (and simulate all possible mistake types a client can do: bad content
type, wrong request type, bad JSON format, etc.). It can not only validate various types of response bodies (JSON, XML) but also
HTTP response codes, headers and cookies. What's more, it is being actively developed.

While I strongly encourage you to read the entire documentation of REST-assured, here are a few usage examples. Assuming we own the
OpenWeatherMap service.

If you remember the previous example with OpenWeatherMap and query for current weather in Warsaw, then below is the JSON response from
this query [http://api.openweathermap.org/data/2.5/weather?q=Warsaw](http://api.openweathermap.org/data/2.5/weather?q=Warsaw)
(some parts of the response were removed to increase readability):

```javascript
{
   "coord":{
      "lon":21.01,
      "lat":52.23
   },
   "weather":[
      {
         "id":802,
         "main":"Clouds",
         "description":"scattered clouds",
         "icon":"03n"
      }
   ],
   "dt":1406055061,
   "id":756135,
   "name":"Warsaw",
   "cod":200
}
```

Before we write a test case, we have to tell REST-assured where to find the server that should be used for testing. It can be done as follows:

```java
@Before
public void setUp() {
    // set default port for REST-assured
    RestAssured.port = 80;

    // set default URI for REST-assured.
    // In integration tests, this would most likely point to localhost.
    RestAssured.baseURI = "http://api.openweathermap.org";
}
```

In this code snippet we have told REST-assured to send requests to [http://api.openweathermap.org](http://api.openweathermap.org)
server and port 80. Of course in case of testing your own services you would most likely set 'baseURI' to 'http(s)://localhost', but for
the sake of this example we are using the well known REST API provided by OpenWeatherMap.

Assuming above configuration and sample JSON response, our first REST-assured based test looks like this:

```java
import static com.jayway.restassured.RestAssured.given;

@Test
public void shouldReturnWeatherDataForWarsaw() {

    // when
    Response response =
            given().
                    header("Accept-Encoding", "application/json").
            when().
                    get("/data/2.5/weather?q=Warsaw");

    // then
    assertThat(response.contentType()).isEqualTo("application/json; charset=utf-8");
    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(response.body().jsonPath().getString("name")).isEqualTo("Warsaw");
}
```

What exactly happens is as follows:

* We tell REST-assured to perform HTTP GET operation on path ("/data/2.5/weather?q=Warsaw"), using specified HTTP Header
(Accept-Encoding = "application/json")
* Then, we verify if the HTTP response has status OK (200), content type is "application/json" and response body (JSON) contains a root
element "name" that has value of "Warsaw".

What I don't like in this basic example is the entire assertion block. It is too verbose. Can we do anything about it? Yes, we can use built-in
features of REST-assured!

```java
import static com.jayway.restassured.RestAssured.given;

@Test
public void shouldReturnWeatherDataForWarsaw() {
    given().
            header("Accept-Encoding", "application/json").
    when().
            get("/data/2.5/weather?q=Warsaw").
    then().
            statusCode(200).
            contentType(ContentType.JSON).
            body("name", equalTo("Warsaw"));
}
```

The difference between the first and the latter tests is usage of ```.then()``` method on Response object returned by ```get(...)``` method.
Thanks to calling ```.then()``` we are not only following "given / when / then" sections of a test, but we also gain access to an instance of
```com.jayway.restassured.response.ValidatableResponse``` which provides us with a nice and rich set of methods that can be used to verify
response headers and body.

What is particularly interesting is the very rich functionality for extracting and matching parts of the response body using JsonPath and
XmlPath provided by REST-assured. First argument passed to the ```body(...)``` method is the path expression - as defined in
JsonPath / XmlPath. Time for a bit more complex test.

Following example uses the OpenWeatherMap API to query for weather data for multiple cities (using their IDs):
[http://api.openweathermap.org/data/2.5/group?id=756135,3094802&unitsq=metric](http://api.openweathermap.org/data/2.5/group?id=756135,3094802&unitsq=metric)
(Warsaw and Cracow). How do we verify that the data returned by the REST service is correct and that latitude and longitude for Warsaw match expected values?

Response to this query ([http://api.openweathermap.org/data/2.5/group?id=756135,3094802&unitsq=metric](http://api.openweathermap.org/data/2.5/group?id=756135,3094802&unitsq=metric))
has the following JSON format (some parts of the response were removed to increase readability):

```javascript
{
   "cnt":2,
   "list":[
      {
         "coord":{
            "lon":21.01,
            "lat":52.23
         },
         "weather":[
            {
               "id":800,
               "main":"Clear",
               "description":"Sky is Clear",
               "icon":"01n"
            }
         ],
         "dt":1406579400,
         "id":756135,
         "name":"Warsaw"
      },
      {
         "coord":{
            "lon":19.92,
            "lat":50.08
         },
         "weather":[
            {
               "id":800,
               "main":"Clear",
               "description":"Sky is Clear",
               "icon":"01n"
            }
         ],
         "dt":1406579400,
         "id":3094802,
         "name":"Krakow"
      }
   ]
}
```

We can see that there are two entries in the ```list``` field of the response. One of them is for Warsaw and one for Cracow. Latitude and
longitude data is hidden not only inside the ```list[n]``` entry object but is also encapsulated inside the ```coord``` object. How do we verify our
assertions in such complex JSON documents without de-serializing to our Java object model?

```java
@Test
public void shouldReturnDataForQueriedCitiesWithProperGeoCoords() {
    given().
            header("Accept-Encoding", "application/json").
    when().
            get("http://api.openweathermap.org/data/2.5/group?id=756135,3094802&unitsq=metric").
    then().
            statusCode(200).
            contentType(ContentType.JSON).
            body(getLatitudeByCityName("Warsaw"), equalTo(52.23f)).
            body(getLongitudeByCityName("Warsaw"), equalTo(21.01f));
}

private String getLatitudeByCityName(String name) {
    return String.format("list.find { city -> city.name == '%s' }.coord.lat", name);
}

private String getLongitudeByCityName(String name) {
    return String.format("list.find { city -> city.name == '%s' }.coord.lon", name);
}
```

What happens in this example?

* We perform an HTTP GET operation as we did before (obviously using a different query this time)
* The tricky part happens in ```getLatitudeByCityName``` / ```getLongituteByCityName``` methods which create JsonPath queries
  * First, we query the ```list``` field for an entry that has a field ```name``` with value specified as the method argument (in this example it
  is Warsaw)
  * Then, we assume there is only one such entry and for it we extract ```coord``` field and its underlying ```lat``` / ```lon``` fields
* Once the value of ```list[n].coord.lon``` / ```list[n].coord.lat``` is extracted, we can use standard matchers to validate the value. Why not
use the form ```list[n].coord.lon```? Because in this scenario we cannot be sure of the order of entries in the ```list``` collection. If we were,
then it would be the cleanest way to do so.

When testing REST Services, you might be tempted to reuse the domain model of the service in order to create requests, serialize them to JSON and
send this JSON as a request. Don't. Just think what will happen if you introduce an unwanted change to the requst object. An example could be a typo
in name of one of the fields (against the contract) that you use to generate and send JSON. Your test would generate a **wrong** JSON and your service
would still accept and process it without any problems - because they were using the same, **wrong** request. However painful and time wasting it may seem to be,
it really pays off to keep these two models (test vs production) separated. It has already saved me a few bugs in production and I am sure it will
help you avoid them as well.

### Summary

I hope that after viewing these examples you see how Restito and REST-assured can help you write clean and concise tests of your RESTful services and their clients.
Writing such testing frameworks from scratch would be extremely expensive and completely pointless. Open Source rules!
