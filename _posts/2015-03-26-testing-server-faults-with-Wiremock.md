---
layout: post
title: Testing server faults with Wiremock
author: filip.marszelewski
tags: [wiremock, TDD, testing, integration tests, fault injection]
---

SOA as modern approach to build distributed enterprise applications gives us many benefits,
including resiliency and fault-tolerance. On the other hands there are many new kinds of SOA-specific faults,
like publishing, discovery, composition, binding or execution faults (as stated in:
[A Fault Taxonomy for Service-Oriented Architecture](http://edoc.hu-berlin.de/series/informatik-berichte/215/PDF/215.pdf)). Error handling is one of the most
important things to have services right designed and implemented
(see article: [Error Handling Considerations in SOA Analysis & Design](http://www.infoq.com/articles/error-handling-soa-design)).
In this article I want to focus only on small aspect of this broad subject: unexpected service behaviors which,
if not properly handled by client, can lead to application inaccessibility.

### Example service client

Let's have an example service client. It is written in Java using [Jersey client](https://jersey.java.net/documentation/latest/client.html).
It contains some bugs but it's not an academic example — following code was a part of real, production application
used in one of the microservices in Allegro Group (class names are anonymized).
Of course there are several ways and libraries useful for writing RESTful clients, but ideas mentioned in article are
general, Java+Jersey stack was choosen only as a real-live sample.

```java
public class ExampleClient {

	private final Client client;
	private final String url;

	public ExampleClient(Client client, String url) {
		this.client = client;
		this.url = url;
	}

	public ExampleResource getExampleResource(String id)
	    throws ExampleResourceNotFoundException, ExampleResourceUnavailableException {
		Response response = this.client.target(url)
				.path(String.format("resources/%s", id))
				.request("application/json")
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

The client have an integration test written in [Groovy](http://www.groovy-lang.org/) based on
[Spock](http://spockframework.github.io/spock/docs/1.0/index.html) and [Wiremock](http://wiremock.org/).
Describing integration tests in general or libraries used in code samples is out ot the scope of this article,
but you can watch two interesting presentations of my colleagues from Allegro:
 - (in English) [Drop the clutter: lightweight tests with Spock](https://vimeo.com/120673753) by Piotr Betkier, presented at
 Geecon TDD in Poznan (2015)
 - (in Polish) [Wykorzystanie języka Groovy w testach](https://www.youtube.com/watch?v=EGKOSUBGy8M) by Mirosław Gołda,
 presented at Torun JUG meeting (2015)

 You can also read about other tools used for testing in article
 [Testing RESTful services and their clients](http://allegrotech.io/testing-restful-service-and-clients.html) by Rafał Głowiński.

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
            .withHeader("Content-Type", "application/json")
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
			.withHeader("Content-Type", "application/json")))

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

At a first glance everything is OK — client is tested against different statuses
returned by REST service. But in real world, there are much more things that could go wrong...

### Server has gone away

In SOA we use discovery service to get microservice address, which is not given directly in configuration properties.
Despite non-responding instances or instances with long delays are cut off, it always take some time for monitoring
tools to unregister such an instance from discovery service. After sudden instance crash (think about physical server failure,
disconnection from network or DNS issue), there is a big chance for some time that your client will try to connect to non-functioning
instance.

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

This test fails — ProcessingException thrown by Jersey client is not catched and wrapped in ExampleResourcesUnavailableException.
This may lead to unexpected behaviour in application where client is used. Adding try/catch around request processing makes the test green:

```java
public ExampleResource getExampleResource(String id)
    throws ExampleResourceNotFoundException, ExampleResourceUnavailableException {
    Invocation.Builder request = this.client.target(url)
            .path(String.format("resources/%s", id))
            .request("application/json");
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

In microservices architecure, services should be fast. But sometimes they don't. Think of database overload, garbage
collection pause or unusual network latency. Service response time becomes seconds, not milliseconds. There is one
fundamental questsion in such a case: is response from the service critical? You can think about two options:
- response is critical — for example you cannot render page for end user without having microservice's response.
In this case it is probably better not to set timeout or have it at high value —
user may prefer to have page rendered in few seconds more than usual instead of seeing error page;
- response is not critical — as a real example there is seo-service in Allegro Group, which serves metadata
 such as page title and description for [allegro.pl listing](http://allegro.pl/search?nl=1&string=java).
 This is important due to SEO positioning, but lack
 of response is invisible to user (default metadata can be used as a fallback) and if seo-service failure is short-term
 (for example several minutes or even few hours) it has no negative impact on SEO positioning.
 In this case setting timeout is crucial — it's much worse for user to have page rendering delayed few seconds than
 having page loaded fast but without some invisible metadata.

You can easily test the second scenario with Wiremock using `withFixedDelay` method:

```groovy
def "should throw exception on response delay"() {
    given:
    stubFor(get(urlEqualTo("/resources/" + ID))
        .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody('{"type":"Monitory","attributeGroupId":"46541684664"}')
        .withFixedDelay(2000)))

    when:
    exampleClient.getExampleResource(ID)

    then:
    thrown(ExampleResourceUnavailableException)
}
```

Test fails, because client has no timeout implemented. It is very easy to set timeout in Jersey client, just add two
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

JSON is widely used as a part of communication standard between microservices. In client code we often use some
automagic features that map JSON to business object (for example, [Jackson](http://jackson.codehaus.org/)).
There is no explicit conversion, we just call `readEntity` method giving as an argument a class that we want as an
response, annotations on this class do the rest.
Because of simplicity — it is easy to forget that assumption that server always returns JSON mappable to our business
object is only a good belief. There are many reasons to fail here, like errors in implementation, misconfiguration
or hardware failures. This can even be cause of failure during error handling, when you want to read detailed
error message from response. I saw the situation where JSON with error message was expected, but server returned
404 with HTML. The effect was an unhandled exception thrown in error handling routine.

Wiremock gives us out-of-the-box possibility to inject this kind of failures. In details it is described on
[Simulating Faults](http://wiremock.org/simulating-faults.html) page. You can choose between 3 kinds of bad responses:
completely empty response, 200 OK response with garbage body or totally random data. Let's test all three cases,
thanks to compact Spock syntax you need only few lines of code:

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

Two of three cases fails. What's wrong? `ProcessingException` is thrown, but not during the request processing. Failure
is in mapping response to `ExampleResource` class object. Let's fix this bug:

```java
public ExampleResource getExampleResource(String id)
    throws ExampleResourceNotFoundException, ExampleResourceUnavailableException {
    Invocation.Builder request = this.client.target(url)
            .path(String.format("resources/%s", id))
            .request("application/json");
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

Now test is green. As you cen read from `readEntity` method documentation, also `IllegalStateException` could be thrown, so
in our case we should catch it the same way as `ProcessingException`.

### Extremal but real: response mapped to object, but still unexpected things happen

This example sounds a little bit exotic, but it was a real case. Due to error in service implementation, server returned
200 OK instead of 500, but response body was as for internal server error:

```json
{
    message: "Could not connect to database."
}
```

What happened in client? Becasuse of `@JsonIgnoreProperties(ignoreUnknown = true)` in `ExampleResource` class, this JSON was
properly mapped to `ExampleResource` object. But of course, every field was null. Let's assume that one of the fields
is of type `Boolean` and in application code there is a decision made depending of value of this field:

```java
if (exampleResource.isSomeBooleanValue()) {
    ...
}
```

Because response validation and mapping to object was not too strict, `NullPointerException` was thrown in application code.
Bad response was not filtered in client — and application trusted that if anything is not OK with response, exception
will be thrown in client.

### Conclusion

When testing and writing code of service clients, we should not only remember to checking response status code, but think about:
- what should happen if service is inaccessible?
- what should happen if response from service is delayed — should we wait a longer time or quickly use fallback?
- how to deal with unexpected response?
- not to trust an object returned from client or better — take more control over mapping HTTP response to business object.

These basic steps are essential to improve stability and fault-tolerance in SOA environment.
