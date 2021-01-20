---
layout: post
title: Testing server faults with Wiremock
author: filip.marszelewski
tags: [wiremock, TDD, testing, integration tests, fault injection]
---

SOA (Service Oriented Architecture) as a modern approach to build distributed enterprise applications gives us many benefits,
including resiliency and fault-tolerance. On the other hand, there are many new kinds of SOA-specific faults,
like publishing, discovery, composition, binding or execution faults (as stated in
[A Fault Taxonomy for Service-Oriented Architecture](http://edoc.hu-berlin.de/series/informatik-berichte/215/PDF/215.pdf)). Error handling is one of the most
important things to have services right designed and implemented
(see article [Error Handling Considerations in SOA Analysis & Design](http://www.infoq.com/articles/error-handling-soa-design)).
In this article, I want to focus only on a small aspect of this broad subject: unexpected service behaviors which,
if not properly handled by the client, can lead to application inaccessibility.

### Example service client

Let's have an example service client. It is written in Java using [Jersey client](https://jersey.java.net/documentation/latest/client.html).
It contains some weaknesses, but it's not an academic example — the following code was part of a real, production application
used in one of the microservices in Allegro Group (class names are anonymized).
Of course there are several ways and libraries useful for writing RESTful clients, but ideas mentioned in the article are
general, Java+Jersey stack was chosen only as a real-live example.

```java
public class ExampleClient {

    private WebTarget webTarget;

    public ExampleClient(Client client, String url) {
        this.webTarget = client.target(url);
    }

    public ExampleResource getExampleResource(String id)
        throws ExampleResourceNotFoundException, ExampleResourceUnavailableException {
        Response response = webTarget
            .path(String.format("resources/%s", id))
            .request(MediaType.APPLICATION_JSON)
            .get();
        if (response.getStatus() == Response.Status.NOT_FOUND.getStatusCode()) {
            throw new ExampleResourceNotFoundException(response.readEntity(String.class));
        }
        if (response.getStatus() != Response.Status.OK.getStatusCode()) {
            throw new ExampleResourceUnavailableException(response.readEntity(String.class));
        }
        return response.readEntity(ExampleResource.class);
    }
}
```

The client has an integration test written in [Groovy](http://www.groovy-lang.org/) based on
[Spock](http://spockframework.github.io/spock/docs/1.0/index.html) and [Wiremock](http://wiremock.org/).
Describing integration tests in general or libraries used in code samples is out of the scope of this article,
but you can watch two interesting presentations of my colleagues from Allegro:

* (in English) [Drop the clutter: lightweight tests with Spock](https://vimeo.com/120673753) by Piotr Betkier, presented at
 [Geecon TDD](http://2015.tdd.geecon.org/) in Poznan (2015)
* (in Polish) [Wykorzystanie języka Groovy w testach](https://www.youtube.com/watch?v=EGKOSUBGy8M) by Mirosław Gołda,
 presented at [Toruń JUG](http://torun.jug.pl/) meeting (2015)

You can also read about other testing tools in
 [Testing RESTful services and their clients]({% post_url 2014-11-26-testing-restful-service-and-clients %}) by Rafał Głowiński.

```groovy
class ExampleClientSpec extends Specification {

    public static final String ID = "1234"
    def exampleClient = new ExampleClient(ClientBuilder.newClient(), 'http://localhost:8089')

    @Rule
    WireMockRule wireMockRule = new WireMockRule(8089);

    def "should perform successful get request"() {
        given:
        wireMockRule.
        stubFor(get(urlEqualTo("/resources/" + ID))
            .willReturn(aResponse()
            .withStatus(200)
            .withHeader("Content-Type", MediaType.APPLICATION_JSON)
            .withBody('{"type":"Monitory", "attributeGroupId": "46541684664"}')))

        when:
        def resource = exampleClient.getExampleResource(ID)

        then:
        resource.getType() == "Monitory"
        resource.getAttributeGroupId() == "46541684664"
    }

    @Unroll
    def "should throw #exception on #statusCode response while retrieving resource"() {
        given:
        stubFor(get(urlEqualTo("/resources/" + ID))
            .willReturn(aResponse()
            .withStatus(statusCode)
            .withHeader("Content-Type", MediaType.APPLICATION_JSON)))

        when:
        exampleClient.getExampleResource(ID)

        then:
        thrown(exception)

        where:
        statusCode | exception
        404        | ExampleResourceNotFoundException
        500        | ExampleResourceUnavailableException
    }
}
```

At a first glance everything is OK — the client is tested against different statuses
returned by REST service. But in the real world, there are many more things that could go wrong...

### Server has gone away

In the service-oriented approach, we use discovery service to get actual instance URL. Microservice instances with
long response times or not responding at all are cut off. However, it takes some time to unregister such instances
from discovery service by monitoring tools. After a sudden crash (think about physical server failure,
disconnection from network or DNS issue), for some time there is a big chance that your client will
try to connect to a non-functioning instance.

You can simulate this situation in Wiremock — just disable the stubbed server in a test case:

```groovy
def "should handle server fault on retrieving resource"() {
    given:
    wireMockRule.stop()

    when:
    exampleClient.getExampleResource(ID)

    then:
    thrown(ExampleResourceUnavailableException)
}
```

This test fails — `ProcessingException` thrown by Jersey client is not catched and wrapped in `ExampleResourcesUnavailableException`.
This may lead to unexpected behaviour in the application where the client is used. Adding try/catch around request processing makes the test green:

```java
public ExampleResource getExampleResource(String id)
    throws ExampleResourceNotFoundException, ExampleResourceUnavailableException {
    Invocation.Builder request = webTarget
        .path(String.format("resources/%s", id))
        .request(MediaType.APPLICATION_JSON);
    Response response;
    try {
        response = request.get();
    } catch (ProcessingException ex) {
        throw new ExampleResourceUnavailableException(ex);
    }
    if (response.getStatus() == Response.Status.NOT_FOUND.getStatusCode()) {
        throw new ExampleResourceNotFoundException(response.readEntity(String.class));
    }
    if (response.getStatus() != Response.Status.OK.getStatusCode()) {
        throw new ExampleResourceUnavailableException(response.readEntity(String.class));
    }
    return response.readEntity(ExampleResource.class);
}
```

### Timeout

In microservices architecture, services should be fast. But sometimes they aren't. Think of database overload, garbage
collection pause or unusual network latency. Service response time becomes seconds, not milliseconds. There is one
fundamental question in such a case: is a response from the service critical? You can think about two options:

* response is critical — for example you cannot render a page for the end user without having microservice's response.
In this case it is probably better not to set timeout or set it at a high value —
user may prefer to have page rendered in a few seconds more than usual instead of seeing an error page;
* response is not critical — as a real example there is a seo-service in Allegro Group, which serves metadata
such as page title and description for [allegro.pl listing](http://allegro.pl/search?nl=1&string=java).
This is important due to SEO positioning, but the lack
of response is invisible to the user (default metadata can be used as a fallback) and if the seo-service failure is short-term
(for example several minutes or even few hours) it has no negative impact on SEO positioning.
In this case setting timeout is crucial — it's much worse for the user to have page rendering delayed a few seconds than
having page loaded fast but without some invisible metadata.

You can easily test the second scenario with Wiremock using `withFixedDelay` method:

```groovy
def "should throw exception on response delay"() {
    given:
    stubFor(get(urlEqualTo("/resources/" + ID))
        .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", MediaType.APPLICATION_JSON)
        .withBody('{"type":"Monitory","attributeGroupId":"46541684664"}')
        .withFixedDelay(2000)))

    when:
    exampleClient.getExampleResource(ID)

    then:
    thrown(ExampleResourceUnavailableException)
}
```

The test fails, because the client has no timeout implemented. It is very easy to set timeout in Jersey client, just add two
properties to `Client` object passed to `ExampleClient` constructor:

```java
client.property(ClientProperties.CONNECT_TIMEOUT, 500);
client.property(ClientProperties.READ_TIMEOUT, 1000);
```

Thanks to dependency injection, our `ExampleClientSpec` could still be fast. Just set different timeouts for integration tests:

```groovy
def exampleClient = new ExampleClient(ClientBuilder.newClient()
    .property(ClientProperties.CONNECT_TIMEOUT, 50)
    .property(ClientProperties.READ_TIMEOUT, 300),
    'http://localhost:8089')
```

### Weird response

JSON is widely used as a part of communication standard between microservices. In the client code we often use some
automagic features that map JSON to a business object (for example, [Jackson](http://wiki.fasterxml.com/JacksonHome)).
There is no explicit conversion, we just call `readEntity` method giving as an argument a class that we want as a
response. Annotations on this class do the rest.
Because of this simplicity — it is easy to forget that assumption that server always returns JSON mappable to our business
object is only a good belief. There are many reasons to fail here, like errors in implementation, misconfiguration
or hardware failures. This can even be a cause of failure during error handling when you want to read a detailed
error message from the response. I saw a situation where JSON with an error message was expected, but the server returned
404 with HTML. The effect was an unhandled exception thrown in error handling routine.

Wiremock gives us an out-of-the-box possibility to inject this kind of failures. In details, it is described on
[Simulating Faults](http://wiremock.org/simulating-faults.html) page. You can choose between 3 kinds of bad responses:
completely empty response, 200 OK response with garbage body or totally random data. Let's test all three cases,
thanks to the compact Spock syntax you need only a few lines of code:

```groovy
@Unroll
def "should throw exception on bad response: #fault"() {
    given:
    stubFor(get(urlEqualTo("/resources/" + ID))
            .willReturn(aResponse()
            .withFault(fault)))

    when:
    exampleClient.getExampleResource(ID)

    then:
    thrown(ExampleResourceUnavailableException)

    where:
    fault << [Fault.EMPTY_RESPONSE, Fault.MALFORMED_RESPONSE_CHUNK, Fault.RANDOM_DATA_THEN_CLOSE]
}
```

Two of three cases fail. What's wrong? `ProcessingException` is thrown, but not during the request processing. The failure
is in mapping the response to `ExampleResource` class object. Let's fix this bug:

```java
public ExampleResource getExampleResource(String id)
    throws ExampleResourceNotFoundException, ExampleResourceUnavailableException {
    Invocation.Builder request = webTarget
        .path(String.format("resources/%s", id))
        .request(MediaType.APPLICATION_JSON);
    Response response;
    try {
        response = request.get();
        if (response.getStatus() == Response.Status.NOT_FOUND.getStatusCode()) {
            throw new ExampleResourceNotFoundException(response.readEntity(String.class));
        }
        if (response.getStatus() != Response.Status.OK.getStatusCode()) {
            throw new ExampleResourceUnavailableException(response.readEntity(String.class));
        }
        return response.readEntity(ExampleResource.class);
    } catch (ProcessingException | IllegalStateException ex) {
        throw new ExampleResourceUnavailableException(ex);
    }
}
```

Now the test is green. As you can read from `readEntity` method documentation, also `IllegalStateException` could also be thrown,
so in our case we should catch it the same way as `ProcessingException`.

### Extremal but real: response mapped to object, but still unexpected things happen

This example sounds a little bit exotic, but it was a real case. Due to an error in the service implementation,
the server returned 200 OK instead of 500, but the response body was as for an internal server error:

```json
{
    message: "Could not connect to database."
}
```

What happened in the client? Because `@JsonIgnoreProperties(ignoreUnknown = true)` in `ExampleResource` class, this JSON was
properly mapped to `ExampleResource` object. But of course, every field was null. Let's assume that one of the fields
is of type `Boolean`, and a decision is made depending on the value of this field in the application code:

```java
if (exampleResource.isSomeBooleanValue()) {
    ...
}
```

Because the response validation and mapping to the object were not strict enough, `NullPointerException` was thrown
in the application code. The application had wrong assumption that the response can always be mapped to the business object
if the response status code is 200 OK.

### Conclusion

When testing and writing the code of service clients, we should not only remember to check the response status code,
but think about:

* what should happen if the service is inaccessible?
* what should happen if response from the service is delayed — should we wait a longer time or quickly use the fallback?
* how to deal with an unexpected response?
* not trusting an object returned from the client or better — take more control over mapping HTTP response to the business object.

These basic steps are essential to improve the stability and fault-tolerance of your SOA environment.
