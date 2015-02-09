---
layout: post
title: Using Jersey model processor for supporting edge-service features
author: piotr.glazar
tags: [java, jersey, annotation]
---

In this post I would like to show you how to add a resource programatically in Jersey
container. We start from a business use case that needs to be implemented. What we are
trying to achieve is to allow external clients to use some resources of internal
microservices. I am aware of the fact that the solution we are going to discuss is not
the best way to solve the problem. Choosing the best solution lies outside the scope
of this post. What is covered in this post are the steps and solutions we tried to use
in order to solve the problem.

### Business use case
At Allegro, we are constantly working on rebuilding our architecture to the
[Service Oriented Architecture](http://en.wikipedia.org/wiki/Service-oriented_architecture)
(SOA). This means that a monolithic system is being replaced by microservices. Unfortunately,
this architecture shift solves problems of one type but creates other problems instead. Let
us take a look at a concrete example. Suppose we want to sell some clothes that our child
has grown out of. We take our mobile phone, take some pictures and then list them on
[allegro.pl](http://allegro.pl/). Since the monolithic system is accessible from the Internet,
the mobile application can access the system’s API. But when we use SOA, a microservice
responsible for rendering a list of offers is accessible only from within the cloud
environment. We need an edge service that serves as a proxy between mobile devices and the
listing items microservice (and other microservices too).

### PublicApiVersion
Of course, not all resources provided by microservices are available for public access. We
have decided that when a microservice wants to expose some of its resources, it has to set
a specific supported media type for these resources. Since we use Jersey as our JAX-RS
implementation, this means that a proper media type must be set for all methods that process
HTTP requests:

```java
@Path("/somePath")
public class SomeEndpoint {

    @GET
    @Produces("application/vnd.allegro.public.v1+json")
    @Consumes("application/vnd.allegro.public.v1+json")
    public Response getSomeResponse(@Valid @NotNull SomeRequest someRequest) {
        ...
    }
}
```

The solution presented above works for sure, but we do not like to stick to it because it is
very error-prone. We want to get rid of hard-coded values because, for example, a typo may
force us to go through the build-release-deploy cycle again and again (imagine that multiplied
by the number of microservices that want to expose some part of their API to the public).
Moreover, the code presented above is more difficult to maintain. What we are trying to
achieve is to produce one solution in the form of an external dependency (a library) for all
microservices implemented in Java. We came to the conclusion that the optimal solution should,
first of all, not be a burden to the teams that develop and maintain their services. Our
solution is the `@PublicApiVersion` annotation:

```java
@Documented
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface PublicApiVersion {
  long value() default 1;
}
```

```java
@Path("/somePath")
public class SomeEndpoint {

    @GET
    @PublicApiVersion(1)
    public Response getSomeResponse() {
        ...
    }
}
```

Now, the proposed solution looks nice and clean to users of our public-api-version library.
They only have to include the library in the classpath and use the `@PublicApiVersion`
annotation. But how to configure Jersey to treat `@PublicApiVersion(1)` as
`@Produces("application/vnd.allegro.public.v1+json")` and
`@Consumes("application/vnd.allegro.public.v1+json")`?

### Filters
There are two main kinds of filters in Jersey: client filters and server filters. Of course,
implementing a client filter that would change a request media type is not an option because
our clients may use  REST clients other than the client provided by Jersey. As a result, we
do not want to modify and maintain any REST client, and consequently, we focus on server
filters.

[`ContainerRequestFilter`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/container/ContainerRequestFilter.html)
is a server filter which allows us to manipulate requests. According
to [filter and interceptor execution order](https://jersey.java.net/documentation/latest/user-guide.html#d0e9762),
we are only interested in pre-matching filters. Post-matching filters are not an option
because the matching process has been already completed before they are fired, and a client
request with the `application/vnd.allegro.public.v1+json` media type does not match any
resource method. Consequently, we cannot use the
[`@NameBinding`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/NameBinding.html)
annotation because
name-bound filters are also fired after the matching process is completed.

In order to create a pre-matching filter we should annotate our class with
the [`@PreMatching`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/container/PreMatching.html)
annotation and implement the
ContainerRequestFilter interface:

```java
@PreMatching
@Provider
public class PreMatchingFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        ...
    }
}
```

[`ContainerRequestContext`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/container/ContainerRequestContext.html)
provides lots of useful information. For example, in order to find
acceptable media types of a request we should call the
`requestContext.getAcceptableMediaTypes()` method that returns an immutable `List<MediaType>`.
`ContainerRequestContext` has only a few setter methods (`setEntityStream()`, `setMethod()`,
`setProperty()`, `setRequestUri()`, `setSecurityContext()`) none of which serves our purpose.
This class has a method that could be useful, i.e. `getHeaders()` that returns a mutable
[`MultivaluedMap`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/core/MultivaluedMap.html).
But what should we put in that map? The problem is how can we access the
metainformation about the class (i.e. `SomeEndpoint.class`) to find resource methods that
handle HTTP requests? Please keep in mind that we are not allowed to hardcode anything and we
cannot assume anything about the microservice implementation. Our library clients just
include it in their classpath, annotate some methods with `@PublicApiVersion` — and that is
all what they need to do. In order to handle `@PublicApiVersion` properly we must be able to
get information about all endpoints and their methods, but unfortunately, we have no such
information in a `@PreMatching` filter. Therefore, we cannot tell methods annotated with
`@PublicApiVersion` from other ones and we cannot fetch metainformation provided by the
annotation.

### Dynamic Feature
Jersey
[`DynamicFeature`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/container/DynamicFeature.html)
allows us to register providers that may be applied to a particular
resource class or method. Let us take a look at an example from the
[StackOverflow](http://stackoverflow.com/) website:

```java
@Provider
public class MyDynamicFeature implements DynamicFeature {

    @Override
    public void configure(final ResourceInfo resourceInfo, final FeatureContext context) {
        if ("HelloWorldResource".equals(resourceInfo.getResourceClass().getSimpleName())
                && "getHello".equals(resourceInfo.getResourceMethod().getName())) {
            context.register(MyContainerRequestFilter.class);
        }
    }
}
```

```java
@Provider
public class MyContainerRequestFilter implements ContainerRequestFilter {

    ...
}
```

As you can see, `MyContainerRequestFilter` will be applied to the
`HelloWorldResource.getHello` method. But still `MyContainerRequestFilter` is an instance of
`ContainerRequestFilter` and hence, it is not possible to use `DynamicFeature` to implement
`@PublicApiVersion`.

### Interceptors
Jersey interceptors are intended to modify entities by manipulating entity input/output
streams. Unfortunately, they are useless in this case.

### ResourceConfig
The [`ResourceConfig`](https://jersey.java.net/apidocs/2.0/jersey/org/glassfish/jersey/server/ResourceConfig.html)
API allows us to create Jersey resources programatically. According to
the [Jersey documentation](https://jersey.java.net/documentation/latest/resource-builder.html),
this can be useful when the creation of a REST service depends on lots of configuration
parameters or other things such as database structure. This sounds very useful but,
unfortunately, the API does not work in our case. What we are trying to achieve is to alter or
replace existing resources with resources for which their media types in
[`@Produces`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/Produces.html)
and
[`@Consumes`](https://jax-rs-spec.java.net/nonav/2.0-SNAPSHOT/apidocs/javax/ws/rs/Consumes.html)
annotations have been set properly according to the `@PublicApiVersion`
annotation, and not to add new resources.

### ModelProcessor for the win!
Having spent some time researching the subject, we came across
[`ModelProcessor`](https://jersey.java.net/apidocs/latest/jersey/org/glassfish/jersey/server/model/ModelProcessor.html).
According to the documentation, this is a part of API for constructing or altering resources
programmatically. Every resource that can be designed using the standard JAX-RS approach (e.g.
`SomeEndpoint`) via annotated resource classes can be also modeled using the Jersey
programmatic API. In the documentation we read: “the standard use case is to enhance the
current resource model by additional methods and resources” and this is exactly what we want
to achieve.

Before we dive into `PublicApiVersionProcessor`, let us visit some helper methods first:

```java
private boolean isPublicApiVersionAnnotationPresent(final Method method) {
    return method.isAnnotationPresent(PublicApiVersion.class);
}

private Method getClassMethod(final ResourceMethod resourceMethod) {
    return resourceMethod.getInvocable().getDefinitionMethod();
}

private String getPublicApiVersionMediaType(final Method method) {
    PublicApiVersion annotation = method.getAnnotation(PublicApiVersion.class);
    return String.format("application/vnd.allegro.public.v%s+json", annotation.value());
}
```

* `getPublicApiVersionMediaType()` – given a `Method`, this method returns a String
representation of the `PublicApiVersion` media type,
* `getClassMethod()` – given a `ResourceMethod`, this method returns
`java.lang.reflect.Method` implementing the `ResourceMethod`. For example, assuming
that the `ResourceMethod` object describes `getSomeResponse()`, `getClassMethod()`
returns `getSomeResponse()`’s `java.lang.reflect.Method`,
* `isPublicApiVersionAnnotationPresent()` – checks whether or not the method is annotated
with `@PublicApiVersion`.

Here is our solution:

```java
package pl.allegro.tech.api.version.server;

import org.glassfish.jersey.server.model.ModelProcessor;
import org.glassfish.jersey.server.model.Resource;
import org.glassfish.jersey.server.model.ResourceMethod;
import org.glassfish.jersey.server.model.ResourceModel;
import pl.allegro.tech.api.version.annotation.PublicApiVersion;

import javax.ws.rs.core.Configuration;
import javax.ws.rs.ext.Provider;
import java.lang.reflect.Method;

@Provider
public class PublicApiModelProcessor implements ModelProcessor {

    @Override
    public ResourceModel processSubResource(ResourceModel subResourceModel, Configuration configuration) {
        return subResourceModel;
    }

    @Override
    public ResourceModel processResourceModel(ResourceModel resourceModel, Configuration configuration) {
        final ResourceModel.Builder newResourceModelBuilder = new ResourceModel.Builder(false);

        resourceModel.getResources().stream().forEach(resource -> newResourceModelBuilder.addResource(createResource(resource)));

        return newResourceModelBuilder.build();
    }

    private Resource createResource(Resource resource) {
        final Resource.Builder resourceBuilder = Resource.builder()
            .path(resource.getPath())
            .name(resource.getName());

        resource.getChildResources().stream().forEach(childResources ->
                resourceBuilder.addChildResource(createResource(childResources)));

        for (final ResourceMethod resourceMethod : resource.getResourceMethods()) {
            Method classMethod = getClassMethod(resourceMethod);
            if (isPublicApiVersionAnnotationPresent(classMethod)) {
                final String publicApiVersionMediaType = getPublicApiVersionMediaType(classMethod);
                resourceBuilder.addMethod(resourceMethod)
                        .consumes(publicApiVersionMediaType)
                        .produces(publicApiVersionMediaType);
            } else {
                resourceBuilder.addMethod(resourceMethod);
            }
        }

        return resourceBuilder.build();
    }

    private boolean isPublicApiVersionAnnotationPresent(final Method method) {
        return method.isAnnotationPresent(PublicApiVersion.class);
    }

    private Method getClassMethod(final ResourceMethod resourceMethod) {
        return resourceMethod.getInvocable().getDefinitionMethod();
    }

    private String getPublicApiVersionMediaType(Method method) {
        PublicApiVersion annotation = method.getAnnotation(PublicApiVersion.class);
        return String.format("application/vnd.allegro.public.v%s+json", annotation.value());
    }
}
```

We annotate `PublicApiVersionModelProcessor` with `@Provider` because we want Jersey to
register it automatically. Subresources are not processed so in `processSubResource()` we
leave `subResourceModel` unchanged. The real action takes place in `processResourceModel()`
and `createResource()` methods. The main idea is simple: leave all the methods that are not
annotated with `@PublicApiVersion` unchanged. On the other hand, we add
`@Produces("application/vnd.allegro.public.vX+json")` and
`@Consumes("application/vnd.allegro.public.vX+json")` for all methods that are annotated with
`@PublicApiVersion`.  In order to implement this, we start by creating a new
`ResourceModel.Builder` that will be filled up with resource methods. Next, we create a new
`Resource` in the `createResource()` method for each resource in `ResourceModel`.
The first step in the `createResource()` method is to create a `Resource.Builder` object. We
set its `path` and `name` to values from the original resource. Then, we process each
subresource recursively by invoking the `createResource()` method.
The third step involves processing resource methods. If a method is annotated with
`@PublicApiVersion`, we create a copy of the method with `consumes()` and `produces()` values
equal to the media type provided by the annotation. But if there is no `@PublicApiVersion`
annotation present on the method, we just copy the method as it is.
Finally, we build and return the new resource.

### Testing
At Allegro, we believe that skilled software engineers never leave their code untested. Apart
from unit tests, we wanted to create an integration/context test to make sure that
`PublicApiModelProcessor` works properly inside a Jersey container. Fortunately, there is no
need to create a full-blown end-to-end test, where we would set up the server and then send
some requests to server endpoints. Our test case simply extends
`JerseyTest` which does all of the configuration of the Jersey container for us, but we still
need an endpoint:

```java
@Path("/publicApiVersion")
public class PublicApiVersionEndpoint {

    @GET
    @PublicApiVersion
    public String publicApiVersion() {
        return "ok";
    }
}
```

Then, we have to configure Jersey to use the endpoint and the `PublicApiModelProcessor` — the
setup is done in the `configure()` method:

```java
public class PublicApiModelProcessorContextTest extends JerseyTest {

    @Override
    protected Application configure() {
        // Log request and response
        enable(TestProperties.LOG_TRAFFIC);

        ResourceConfig resourceConfig = new ResourceConfig(PublicApiModelProcessor.class);
        resourceConfig.register(PublicApiVersionEndpoint.class);

        return resourceConfig;
    }

    @Test
    public void shouldServeRequestToPublicApiVersion() {
        // given
        final String path = "/publicApiVersion";
        final String mediaType = "application/vnd.allegro.public.v1+json";

        // when
        final Response response = target(path).request(mediaType).get(Response.class);

        // then
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getMediaType.toString()).isEqualTo(mediaType);
    }
}
```

### Acknowledgments
I would like to thank Łukasz Przybyła for his hard work and commitment while working on this
task and the first implementation of `PublicApiModelProcessor`.

### Summary
[The Jersey framework](https://jersey.java.net/) is very flexible and really simplifies
RESTful service development. Thanks to its API you can easily configure it to fit
your needs. Moreover, model processors can be executed in the chain so that each model
processor will be executed with resource model processed by the previous model processor.
As a result, you can go far beyond the standard use case (e.g. adding OPTIONS HTTP methods for
every URI endpoint) and completely change the resource model.
