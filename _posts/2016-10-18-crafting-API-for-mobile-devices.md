---
layout: post
title: API crafted for mobile
author: [mariusz.wojtysiak]
tags: [tech, api, rest api, mobile]
---

Do you develop service and plan to make it publicly available? Do you want developers of mobile appliactions integrate with your api faslty and painlessly? Do you care how stable and predictable mobile applications using your service are?

Below you find a bunch of API architecture decisions, which caused new features in Allegro mobile apps not being delivered as fast as we expected and caused some problems with stability.

## Many requests to build one view
On our backend we have microservices architecture. Every service supports narrow area of business logic. Let’s look at example how introducing of microservices affected our mobile development:

![Offer details](/img/articles/api-crafted-for-mobile/offer-watch.png)

Above we see Allegro application for Android presenting offer “Woman Watch VERSUS VERSACE”, with minimal delivery cost “7,90 zł” and seller reliability “99,4%”. Details of offer, delivery costs and seller rankings are supported by 3 microservices, so smartphone had to make 3 requests to show above view:

- GET /offers/{offerId}
- GET /delivery-prices/{delivery-list-id}
- GET /sellers/{sellerId}

Mobile developer had to:

- define 3 different data models
- implement sending 3 different requests
- make 3 error handling routines
- handle view refreshing — 3 times
- we usually send requests asynchronously — 3 async requests increases level of complexity

Above work was done for all our applications: on Android, iOS and Windows Phone, so amount of needed work multiplied 3 times.

Microservice architecture caused that mobile app had to send many requests to display one view. It made our application less reliable. That’s because phones often uses poor internet connection and each additional request increases probability of network failure.

To avoid those problems, we introduced Service [Façade](https://en.wikipedia.org/wiki/Facade_pattern) also known as [Backend For Frontend](http://samnewman.io/patterns/architectural/bff/):

![Offer details](/img/articles/api-crafted-for-mobile/BFF.png)

Now BFF service sends one response with all data needed by mobile app. Of course BFF is tightly coupled with client requirements, so it can be developed when UX team delivers view sketches.

BFF allows developers to integrate new features more quickly, views in mobile apps are refreshed faster (3 requests are still sent, but all are internal requests within datacenter) and applications are more stable. Additionaly we use less mobile data packets and saves phone battery.

## Null values returned from time to time
At the very beginning we didn’t care, which fields in API responses may return null. So our swagger documentation had not any hint, which fields are optional. For example pure auctions on Allegro cannot be bought using “buy now”, so auctions do not have `buyNowPrice`. Our swagger documentation looked like this:

![](/img/articles/api-crafted-for-mobile/offer-no-optional.png)

Mobile developers had to predict somehow, for which fields implement null value handler. They made these predictions using theirs knowledge of how Allegro works. But it’s hard in such big system to find all border cases, so prediction was not accurate. Users noticed it, when our application crashed from time to time.

Now in API documentation we specify in which fields null values should be expected. Additionaly we add short description in what case null is returned.

![](/img/articles/api-crafted-for-mobile/offer-optional.png)

Property `optional` appears, when we ommit field name in API specification / required:
![](/img/articles/api-crafted-for-mobile/swagger-required.png)

With `optional` properties in documentation, mobile developers no longer need to predict where to expect nulls. Our testers can precisely recognize corner cases and test it.

## Inconsistent errors signalling
Every microservice in Allegro is developed by independent team. After a few weeks of intruducing the new architecture we realized that every service has its own way to signal that error occured. Let's look at example:

![](/img/articles/api-crafted-for-mobile/inconsistent-errors-handling.png)

One error “Resource not found”, but each service signals it with different http status and different JSON structure. It causes that mobile developer have to implement different error handling for every service.

In most cases, when error occurs, application just show appropriate message. In above case message has to be figured out by mobile developer. It is good practice to deliver user message from the service.

To make this good practice clear and alive, we introduced [REST API Guideline](http://allegro-restapi-guideline.readthedocs.io/en/latest/Error/), where we descibed how errors should be signalled.

In Allegro following JSON structure has to be returned in case of every error:

```JSON
{
    "errors": [
        {
            "userMessage": "Wybrana oferta została przeniesiona do archiwum",
            "message": "Offer not found",
            "code": "NotFoundException"
        }
    ]
}
```

where:

- `userMessage` is a message ready to show for user in user’s language
- `message` is a technical message in english, for mobile developer, often written to application log
- `code` can be used to choose special error handling strategy, for example after code CaptchaRequired application should display “Captcha view” instead of showing userMessage

Consistent errors signalling allowed mobile developers to implement one generic error handling procedure, which just shows userMesage delivered by service. This is enough for 99% of errors. 1% of errors has special handling like redirecting user to application preferences or refreshing OAuth2 token.

## Summary
In this article I presented 3 changes we introduced into our REST API architecture, which speed up process of delivering new features into mobile applications. These changes needs some extra work on backend side, but it’s usually cheaper to make it on backend, than developing it in apps on 3 mobile platforms.

If you are curious of other good practices of designing REST API, I recommend studying full version of our [REST API Guildeline](http://allegro-restapi-guideline.readthedocs.io/en/latest/).
