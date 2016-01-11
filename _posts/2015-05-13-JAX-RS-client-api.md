---
redirect_from:
   - /JAX-RS-client-api.html
layout: post
title: How to write JAX-RS Client fast
author: lukasz.przybyla
tags: [tech, REST, client, JAX-RS]
---
According to best practices, when developing a service, one should provide a client for it.
If your service API undergoes changes quite often, constant client updates may become troublesome.
In this article, I will show you how to develop (quickly and effortlessly!) a JAX-RS client that handles all API changes smoothly.


### Project design
Before you develop anything, think about a structure for your project. At this stage, you have to define who your service is for.
My proposition involves dividing the project in order to suit a developer, i.e. a service user.
It includes 3 project parts: **api**, **client** and **service**.

#### API
It contains the structure of the model and API interface (POJO) provided by a service.
Developers can use this API to develop their own client if they do not want you use the offered one.

#### Client
This directory contains the service client — a specific implementation of the API.

#### Service
By “service” I understand main functionalities available through the model and an interface located in API.
In this article I will only be writing about client and in the next one I will focus on good practices during writing a service.

**In this article, I will focus on API and Client parts.**

## JAX-RS Client
Here is an example of a presented concept – a service that processes collection points where a buyer can collect purchased goods.

#### API
The class GeneralDeliveryApi represents an interface provided by service API and includes two methods:

  1. getGeneralDeliveries - returns a list of points from a particular location defined by geographic coordinates
  2. getGeneralDeliveryDetails - returns details of a collection point based on its ID

The GeneralDeliveryMediaType class stores versions of methods transferred in a request header.

```java
    package pl.allegro.purchase.generaldelivery.api;

    // ... imports omitted for brevity ...

    @Path("/general-delivery")
    public interface GeneralDeliveryClient {

        @GET
        @Consumes(GeneralDeliveryMediaType.V1_JSON)
        @Produces(GeneralDeliveryMediaType.V1_JSON)
        PointsCollection getGeneralDeliveries(@QueryParam("nwLat") @NotNull Double nwLat,
                                              @QueryParam("nwLon") @NotNull Double nwLon,
                                              @QueryParam("seLat") @NotNull Double seLat,
                                              @QueryParam("seLon") @NotNull Double seLon
        );

        @GET
        @Path("{id}")
        @Consumes(GeneralDeliveryMediaType.V1_JSON)
        @Produces(GeneralDeliveryMediaType.V1_JSON)
        PointDetail getGeneralDeliveryDetails(@PathParam("id") String id);
    }
```

Gradle dependencies:

```
    compile "javax.ws.rs:javax.ws.rs-api:2.0.1"
    compile "javax.validation:validation-api:1.1.0.Final"
```

#### Standard Client
When adopting a standard approach, building a client for presented API would involve:

  - setting the path of a method to be called
  - mapping input parameters on queryParams and on a parameter located in path
  - setting an `Accept` HTTP header

For client implementation I use [Jersey](https://jersey.java.net/).

```java
package pl.allegro.purchase.generaldelivery.client;

// ... imports omitted for brevity ...

public class GeneralDeliveryJerseyClient {
    private final WebTarget webTarget;

    public GeneralDeliveryJerseyClient(String host) {
       webTarget = ClientBuilder.newClient().target(host);
    }

    public PointsCollection getGeneralDeliveriesV1(Double nwLat, Double nwLon, Double seLat, Double seLon) {
        return webTarget
                .path("general-delivery")
                .queryParam("nwLat", nwLat)
                .queryParam("nwLon", nwLon)
                .queryParam("seLat", seLat)
                .queryParam("seLon", seLon)
                .request(GeneralDeliveryMediaType.V1_JSON)
                .get(PointsCollection.class);
    }

    public PointDetail getGeneralDeliveryDetailsV1(String id) {
        return webTarget
            .path("general-delivery/{id}")
            .resolveTemplate("id", id)
            .request(GeneralDeliveryMediaType.V1_JSON)
            .get(PointDetail.class);
    }
}
```

Gradle dependencies:

```
    compile "org.glassfish.jersey.core:jersey-client:2.16"
```

When adopting a standard approach, any API change requires client update.
Each new method, new method version or model modification results in changes related to client implementation.

#### Proxy Client
To build a Proxy client, try WebResourceFactory of GlassFish implementation, which needs API interface only.

The class GeneralDeliveryClientFactory is a factory that allows you to build a client supporting your service.

```java
package pl.allegro.purchase.generaldelivery.client;

// ... imports omitted for brevity ...

public final class GeneralDeliveryJerseyClientFactory {

    private GeneralDeliveryClientFactory() {
    }

    public static GeneralDeliveryApi createClient(String uri) {
        Configuration configuration = new ResourceConfig()
                .packages("pl.allegro")
                .register(JacksonFeature.class);

        Client client = ClientBuilder.newClient(configuration);
        WebTarget webTarget = client.target(uri);

        return WebResourceFactory.newResource(GeneralDeliveryClient.class, webTarget);
    }
}
```

As you can see, the implementation is very simple. As parameters, a client accepts the service URI.
The client is entirely built upon delivered API interface.

Gradle dependencies:

```
    compile "org.glassfish.jersey.core:jersey-client:2.16"
    compile "org.glassfish.jersey.core:jersey-server:2.16"
    compile "org.glassfish.jersey.ext:jersey-proxy-client:2.16"
    compile "org.glassfish.jersey.media:jersey-media-json-jackson:2.16"
```

### Use case example

```java
package pl.allegro.mobile.facade.generaldelivery;

// ... imports omitted for brevity ...

public class GeneralDeliveryFacade {

    private final GeneralDeliveryClient client;

    public GeneralDeliveryFacade() {
        client = GeneralDeliveryJerseyClientFactory.createClient("http://localhost:8080");
    }

    public PointsCollection getPoints(GdSearchRequest request) {
        return client.getGeneralDeliveries(
                request.getNwLat(),
                request.getNwLon(),
                request.getSeLat(),
                request.getSeLon()
            );
    }

    public PointDetail getPointDetail(String id) {
        return client.getGeneralDeliveryDetails(id);
    }

}
```

### Summary
With a ready-made library, you can create a service client in no time.
Presented project design allows you to modify your client through a structure of the model and API interface without maintaining client implementation.
