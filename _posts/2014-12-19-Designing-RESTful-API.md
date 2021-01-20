---
layout: post
title: Designing RESTful API
author: przemyslaw.debek
tags: [rest, restful, api, http, hateoas, microservices]
---
In distributed environments it is crucial to have a common, standardized language which services can use to exchange
information between each other. At Allegro, to meet this goal, we’ve chosen the REST architecture.

This article will guide you through REST API concepts and good practices that we use in our projects. In order to show
you how to use them, we will create a simple REST service in the financial domain — an eBanking platform.

## What does it mean to be RESTful?

First of all, let's start with a little bit of theory. REST abbreviation stands for Representational State Transfer.
It is a set of rules, good practices and constraints for designing APIs over HTTP protocol. The base term in discussed
concept is a resource. A resource is an entity identified by a unique ID.  All operations are performed in context
of this resource. Resources are reachable by URIs (Unified Resource identifiers). The transport protocol is
HTTP (with all of its features in use). API responses allow navigating through system by providing
hyperlinks ([HATEOAS (Hypermedia as the Engine of Application State)](http://spring.io/understanding/HATEOAS)).

To learn more about REST and HTTP visit:

* [Roy Fielding's doctoral dissertation (original idea for REST)](http://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
* [HTTP RFC](https://www.ietf.org/rfc/rfc2616.txt)
* [PATCH RFC](http://tools.ietf.org/html/rfc5789)
* [The RESTful CookBook](http://restcookbook.com)

Things not covered by this article (but worth further reading):

* [Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html)
* [API Versioning and custom media types](http://pivotallabs.com/api-versioning/)
* [Asynchronous operations]({% post_url 2014-10-29-async-rest %})
* [Testing RESTful services]({% post_url 2014-11-26-testing-restful-service-and-clients %})

### Naming conventions

What distinguishes RESTful API's from others at first sight is the naming convention. Resources must be constructed with
nouns - there is no place for verbs in path params. It is reasonable that choosen nouns come from the service's domain.
Mandatory parameters of a request should be a part of path params and optional need to be passed as query params.

For instance an API for getting storm forecast for Warsaw should not be constructed this way:

```
GET /getStormForecastForWarsaw
```

But rather this way:

```
GET /weather-forecast/warsaw/storms
```

And when we want to narrow the results to the last few days, we should pass them through additional query params:

```
GET /weather-forecast/warsaw/storms?from=2014-11-01&to=2014-11-12
```

### HTTP methods overview

Before we start building an example, let's have a look at most common HTTP methods. We consider them in terms of idempotency, safety
and recommended usages. Idempotency is a trait of operation which guarantees that the state of the resource becomes
steady after first call and remains unchanged after further, identical calls. Safe methods do not affect the state
of the resource at all.

Method | Idempotency | Safety  | Usage
-------|-------------|---------|----------------------------------------------
GET    | YES         | YES     | Selecting resources
POST   | NO          | NO      | Creating resources (id generated server-side)
PUT    | YES         | NO      | Creating resources (id generated client-side)
PATCH  | NO          | NO      | Partial updates of resources
DELETE | YES         | NO      | Deleting resources

## An example

As mentioned before we will build an e-banking platform, wich provides operations for creating and managing a bank account.
In each of the six scenarios we will add some functionality by implementing good practices and conventions of RESTfull API.

### Scenario #1: Creating a bank account

Registering a bank account is neither an idempotent nor a safe operation. The account ID is generated server-side
so the POST method is a proper choice. We'll use JSON content type.

```
POST /accounts HTTP/1.1
Content-Type: application/json
```

```json
{
    "firstName": "John",
    "lastName": "Doe",
    "currency": "PLN",
    "limit": "1000"
}
```

The application should return HTTP Response with Status Code = 201 and a Location header containing the address of
the created resource.

```
HTTP/1.1 201 Created
Location: /accounts/97695c60-4675-11e4-916c-0800200c9a66
```

### Scenario #2: Find bank account by ID

This use case represents a typical, safe and idempotent operation so we should use the GET Method. The account's ID
is a resource identifier so it is a part of path, not a query param.

```
GET /accounts/97695c60-4675-11e4-916c-0800200c9a66 HTTP/1.1
```

The application should return HTTP response with Status Code = 200.

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
    "id": "97695c60-4675-11e4-916c-0800200c9a66",
    "firstName": "John",
    "lastName": "Doe",
    "currency": "PLN",
    "state": "ACTIVE",
    "limit": "1000",
    "balance": "100",
    "_links": [
            {
                "href": "http://localhost/accounts/97695c60-4675-11e4-916c-0800200c9a66",
                "rel": "self",
                "method": "GET"
              },
              {
                "href": "http://localhost/accounts/97695c60-4675-11e4-916c-0800200c9a66/transactions",
                "rel": "transactions",
                "method": "GET"
              },
              {
                "href": "http://localhost/accounts/97695c60-4675-11e4-916c-0800200c9a66/cards",
                "rel": "cards",
                "method": "GET"
              }
      ]
}
```

The links array is an implementation of the HATEOAS concept. With dynamic links it gives client a possibility to navigate
to account's hypothetical subresources like registered credit cards or transactions. No contract or schema is needed,
features can be added dynamically.

It is a good practice to ensure that the entity keeps a reference to itself when there are multiple ways of getting to
a resource (e.g., redirects, filtering a collection). A client should know the main path and use it in subseqent queries
to the same resource. In the example above the link with the attribute rel = "self" contains a self-referencing URI.

### Scenario #3: Deleting bank account

It's not surprising that we use the DELETE method for that.

```
DELETE /accounts/97695c60-4675-11e4-916c-0800200c9a66 HTTP/1.1
```

According to HTTP Specification, we can use 200, 202 or 204 as the response code. In this case the 204 No Content
is the best choice because the body of the response is empty:

```
HTTP/1.1 204 No Content
```

Subsequent query for that account should result in the 404 Not Found.

### Scenario #4: Getting all bank accounts

It is a simple case when HTTP GET to /accounts returns all registered bank accounts. Response code is of course 200 OK.

```
GET /accounts HTTP/1.1
```

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
[
    {
        "id": "97695c60-4675-11e4-916c-0800200c9a67",
        "firstName": "John",
        "lastName": "Doe",
        "currency": "PLN",
        "limit": "1000",
        "_links": [
            {
                "href": "http://localhost/accounts/97695c60-4675-11e4-916c-0800200c9a66",
                "rel": "self",
                "method": "GET"
              }
          ]
    },

    ...

    {
        "id": "97695c60-4675-11e4-916c-0800200c9a75",
        "firstName": "Jane",
        "lastName": "Smith",
        "currency": "PLN",
        "limit": "1000",
        "balance": "-200",
        "_links": [
            {
                "href": "http://localhost/accounts/97695c60-4675-11e4-916c-0800200c9a67",
                "rel": "self",
                "method": "GET"
              }
          ]
    }
]
```

#### Handling empty result sets
In case of an empty result set we still should return 200 OK, but with an empty array in the body. 404 Not Found
is tempting, but inappropriate - the 4xx codes family indicates client side errors, and in this case none occured.

```
HTTP/1.1 200 OK
Content-Type: application/json
[]
```

### Scenario #5: Filtering, pagination and partial responses

Suppose we have a giant result set and want to narrow it down, have it paginated, and what is more, we are interested
in particular fields only. We use the <code>/accounts</code> resource, parameterized by query params. Parameter field
contains names of fields to be displayed. Offset and limit are used to paginate the result set. Default value of
the offset is 0 and the limit is 10. The result set collection is enriched by pagination links.

```
GET /accounts?currency=PLN&firstName=John&fields=firstName,lastName,balance HTTP/1.1
```

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
    "content": [
        {
            "firstName": "John",
            "lastName": "Doe",
            "balance": "350"
        },

    ...

        {
            "firstName": "John",
            "lastName": "Smith",
            "balance": "-200"
        }
    ],
    "_links": [
        {
            "href": "http://localhost/accounts?offset=0&limit=10",
            "rel": "self",
            "method": "GET"
        },
        {
            "href": "http://localhost/accounts?offset=10&limit=10",
            "rel": "next",
            "method": "GET"
        },
        {
            "href": "http://localhost/accounts?offset=0&limit=10",
            "rel": "first",
            "method": "GET"
        },
        {
            "href": "http://localhost/accounts?offset=250&limit=10",
            "rel": "last",
            "method": "GET"
        }
    ]
}
```

### Scenario #6: Blocking an account

Blocking an account is a perfect use case for the PATCH method because we are updating the account partially.

```
PATCH /accounts/97695c60-4675-11e4-916c-0800200c9a66 HTTP/1.1
```

```json
{
    "state": "BLOCKED"
}
```

The response body is empty so 204 No Content is used, but other codes from the 2xx family can be used as well.

```
HTTP/1.1 204 OK
```

If your clients are not compatibile with PATCH, use POST instead. Certainly not PUT - it should update full resource only.

## How to recognize a truly RESTful API?

Based on the example above we can extract some features that characterize a good RESTful API. It should:

* be divided into separate links, constructed with nouns
* obey HTTP specification, use proper methods and error codes
* be easily navigable by providing dynamic links from one resource to another
* provide possible operations on given resources as if it was a GUI

## Summary

Following all REST rules seems to be easy at first, but when the complexity of your domain grows, things become
complicated. At some point you need to find a compromise between constraints, specification in RFCs and common sense.
Some say there is no such thing as a 100% pure RESTful API.
