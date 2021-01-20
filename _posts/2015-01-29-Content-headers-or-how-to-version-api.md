---
layout: post
title: Content headers or how to version your API?
author: krzysztof.debski
tags: [java, rest, version, api, headers, http]
---

When you publish your service API it is crucial to make it easy to upgrade. If you forget about it, you might end up in dependency hell.
Each attempt to change your API will force you to contact all your clients and tell them to upgrade their software.
As a result, both you and your clients will be very unhappy.
You can mitigate it by providing multiple versions of your resources. But there is no single way how to manage them.
Different companies solve it in different ways. Below you find three most popular approaches.

## Where to put a version number?

### Version in URL

The easiest way to handle multiple versions is to put the version number into the URL. You can find this approach for example in Twitter API.


```
    http://myapplication.com/api/v1/user/1
    http://myapplication.com/api/v2/user/1
```

Pros:

- It is easy to use and test. All you need is to send your peer URL to resource.

Cons:

- You have the same resource under multiple URLs. Sometimes URLs differ only in data layout.
- It is hard to get the most recent version of API, unless you add another URL that points to the actual API.
- You add additional elements in your URL which are not really part of resource path in REST meaning.

### Version in query parameter

To achieve browser compatibility and simplify testing you might want to add a query parameter to represent API version.

```
    http://myapplication.com/user/1?version=1
    http://myapplication.com/user/1?version=2
```

Pros:

- It is easy to use and test.
- You can add default version if there is no version provided and it won't break API compatibility.

Cons:

- Version parameter might interfere with resource attributes. You mix actual query params with control parameters.

### Version in header

In HTTP protocol you already have a place to store all the control parameters. You can add them to the HTTP headers.
There are three possible places to add API version to the headers:

* additional header

```
    GET /user/1 HTTP/1.1
    Host: myapplication.com
    Accept: application/json
    Version: 1
```

* additional field in Accept/Content-Type header

```
    GET /user/1 HTTP/1.1
    Host: myapplication.com
    Accept: application/json; version=1
```

* enhanced media type

```
    GET /user/1 HTTP/1.1
    Host: myapplication.com
    Accept: application/vnd.myapplication.user.v1+json
```

Pros:

- You use only one resource address for all versions.
- You don't mix the control params like version with your application parameters.

Cons:

- It is hard to test in browser if you are not familiar with developer tools, eg. if you show it to your business client.
- If you use an additional header or an additional field it might not be compatible with some strict tools.
- Enhanced media type is not compatible with some browsers like Firefox.


## Content Headers Example

Let's focus on header versioning. I will show you how to mitigate problems that arise when choosing this approach.

### Example without versions

First let's prepare a basic endpoint.

```java
    package pl.allegro.versionexample.users.rest;

    import pl.allegro.versionexample.users.model.User;
    import pl.allegro.versionexample.users.repository.UserRepository;
    import pl.allegro.versionexample.users.rest.responses.UserResponse;
    import pl.allegro.versionexample.users.rest.responses.UserResponseFactory;

    import javax.inject.Inject;
    import javax.ws.rs.GET;


    @Path("/users")
    public class UsersEndpoint {

    private final UserRepository userRepository;
    private final UserResponseFactory userResponseFactory;

    @Inject
    public UsersEndpoint(UserRepository userRepository, UserResponseFactory userResponseFactory) {
        this.userRepository = userRepository;
        this.userResponseFactory = userResponseFactory;
    }

    @GET
    @Path("/{userId}")
    @Produces("application/json")
    public UserResponse findUser(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponse(getMessage("findById.success"), user);
    }
```

We have exposed here is just a collection of users without versioning.
If you query your application from a browser you will receive user response formatted as JSON.
It is because your browser requests data without "accept" header or with header `accept:*/*` which means it doesn't expect, any specific data:

```
    GET /users/1 HTTP/1.1
    Host: myapplication.com
    Accept: */*
```

### Example with just one version exposed

Let's assume that we use enhanced media type and let's add initial version support.

```java
    @Produces("application/vnd.allegro.example.user.v1+json")
    public UserResponse findUser(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponse(getMessage("findById.success"), user);
    }
```

Now, if we query application without any specified header we will receive resource with content-type `application/vnd.allegro.example.user.v1+json`.
Some browsers (e.g. Chrome) will understand it as an enhanced json so it will be displayed well-formatted, but e.g. Firefox doesn't understand it.
So let's add versioning support that all browsers can understand.


```java
    @Produces({"application/json", "application/vnd.allegro.example.user.v1+json"})
    public UserResponse findUser(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponse(getMessage("findById.success"), user);
    }
```

Now we have support for 2 versions of user resource. Both are displayed in the same way.
What will happen if we query the application without an accept header?
First matching content-type will be served. In our example it will be `application/json`. Therefore we can have version support for development tools and human readable format for all developers.

### Example with two versions exposed

When we want to expose our application in two different versions we can add versioned methods.

```java
    @Produces("application/vnd.allegro.example.user.v1+json")
    public UserResponse findUserV1(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponseV1(getMessage("findById.success"), user);
    }

    @Produces({"application/json", "application/vnd.allegro.example.user.v2+json"})
    public UserResponse findUserV2(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponseV2(getMessage("findById.success"), user);
    }
```

As you might expect, depending on an accept header we can get the user resource in either version 1 or version 2.
But what will happen if we query without accept header? There is no single answer. It depends on the machine that we use to run our code.
It might use either the first method and then return `application/vnd.allegro.example.v1+json` or the second method and return `application/json`.

How to make it more predictable?

Let's dig deeper into [the HTTP RFC](http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html). It allows us to indicate weight of various negotiable parameters.
The weight is normalized to a real number in the range 0 through 1 (default value). If a parameter has a quality value of 0, then content with this parameter is `not acceptable' for the client.

When a client queries for a resource they can add a quality parameter to the accept header.
In the example below we see additional `q` parameter, which lowers the weight of `application/vnd.allegro.example.user.v1+json` from 1 to 0.9.

```
   GET /users/1 HTTP/1.1
   Host: myapplication.com
   Accept: application/vnd.allegro.example.user.v1+json;q=0.9, application/json
```

Above example says that if server can provide both `application/vnd.allegro.example.user.v1+json` and `application/json`, the client prefers application/json.

It might be hard to force all clients to use a custom header, so we can set up it on the server side as well.
To differentiate the names of quality parameter on client and server sides, apart of using name `q` we use parameter name `qs`.
All other rules stay the same.
In the example below we lower value of quality for `application/vnd.allegro.example.user.v1+json` and `application/vnd.allegro.example.user.v2+json` from 1 to 0.9.
The value of quality for `application/json` stays unchanged.

```java
    @Produces("application/vnd.allegro.example.user.v1+json;qs=0.9")
    public UserResponse findUserV1(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponseV1(getMessage("findById.success"), user);
    }

    @Produces({"application/json", "application/vnd.allegro.example.user.v2+json;qs=0.9"})
    public UserResponse findUserV2(@PathParam("userId") String userId) {
        User user = userRepository.findOne(userId);
        return userResponseFactory.successUserResponseV2(getMessage("findById.success"), user);
    }
```

In the example above when client query without accept header they receive response with media type `application/json`.

## Conclusion

There are no silver bullet with API versioning. All the approaches have some pros and cons.
I prefer version API with headers. It has some drawbacks, but you can mitigate them if you follow the tips above.


