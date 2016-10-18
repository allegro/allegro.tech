---
layout: post
title: API crafted for mobile
author: [mariusz.wojtysiak]
tags: [tech, api, rest api, mobile]
---

---
layout: post
title: Crafting API for mobile devices
author: [mariusz.wojtysiak]
tags: [tech, api, rest api, mobile]
---

Are you developing service and plan to make it publicly available? Do you want mobile appliactions developers integrate with your api fast and painless? Do you care how stable and predictable run mobile applications using your service?

Below you find a bunch of our API aritecture decisions, which caused that new features in Allegro mobile apps were not delivered as fast as we expected, and caused some problems with stability.

## Many requests to build one view
On our backend we have microservices architecture. Every service supports narrow area of business logic. Let's see on example how introduced microservices affected our mobile development:

![Offer details](/img/articles/api-crafted-for-mobile/offer-watch.png)

Above we see allegro application for Android presenting offer "Woman Watch VERSUS VERSACE", with minimal delivery cost "7,90 zł" and seller reliability "99,4%". Offer item details, delivery costs, and seller rankings are supported by 3 microservices, so smartphone had to make 3 requests to show above view:

- GET /offers/{offerId}
- GET /delivery-prices/{delivery-list-id}
- GET /sellers/{sellerId}

Mobile developer had to:

- define 3 different data models
- implement sending of 3 different requests
- make 3 error handling routines
- handle refreshing of view — 3 times
- we usually sends requests asynchronously — 3 async requests increases level of complexity

Above work were done for all our applications: on android, ios and windows phone, so amount of needed work multiplied 3 times.

Microservice architecture cuased that mobile app had to send many requests to display one view. It made our application less reliable. That's because phones often uses poor internect connection and each additional request increases probability of network failure.

To avoid those problems, we introduced Service [Façade](https://en.wikipedia.org/wiki/Facade_pattern) also known as [Backend For Frontend](http://samnewman.io/patterns/architectural/bff/):

![Offer details](/img/articles/api-crafted-for-mobile/BFF.png)

Now BFF service sends one response with all data needed by mobile app. Of course BFF is tightly coupled with client requirements, so it can be developed when UX team delivers view sketches.
But our mobile developers integrates new features more quickly, views are refreshed faster (3 requests are still sent, but all are internal requests within datacenter) and applications are more stable.
Additionaly we uses less user's data packets and save phone battery.

## Null values returned from time to time
At the very beginning we didn't care, which fields in API responses may return null. So our swagger documentation have not any hint, which field are optional. For example auctions on allegro cannot be bought using "buy now", so auctions have not buyNowPrice. Our swagger looked like this:

![](/img/articles/api-crafted-for-mobile/offer-no-optional.png)

Mobile developers had to predict somehow, for which fields imlements handling of null values. They made this predictions using theirs knowledge how Allegro works. But it's impossible in such big system to find all border cases, so prediction was not accurate. Our users noticed it, when they observed app crashes from time to time.

Now in API documentation we specify in which fields expect null values, with short description in what case this null is returned.

![](/img/articles/api-crafted-for-mobile/offer-optional.png)

Property `optional` appears when in API specification, section required we ommit field name:
![](/img/articles/api-crafted-for-mobile/swagger-required.png)

Property `Optional` in documentation allow mobile developers not to predict where to expect nulls. Our testers can preciselly recognize corner cases and test it.

## Inconsistent errors signalling
Every microservice in Allegro is developed by independent team. After a few feeks of intruducing the new architecture we realized that every service has own way to signal occurred errors. Let's see an example:

![](/img/articles/api-crafted-for-mobile/inconsistent-errors-handling.png)

One error "Resource not found", but each service signal it with different http status and different JSON structure. It causes that mobile developer has to implement different error handling for every service.

In most cases, after an error, application just show appropriate message. In above case message has to be figured out by mobile developer. Good practice is to deliver it from the service.

To make this good practice clear and alive, we intruduced [REST API Guideline](http://allegro-restapi-guideline.readthedocs.io/en/latest/Error/), where descibed how errors should be signalled.

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

- userMessage is a message ready to show for user in user's language
- message is a technical english message, for mobile developer, often written to application log
- code can be used to choose special errors handling strategy, for example after code CaptchaRequired application should display "Captcha view" instead of showing userMessage

Consistent errors signalling allowed us to implement in mobile apps one generic error handling, which showing userMesage delivered by service. This is  enough for 99% of errors. 1% of errors has special handling like redirecting user to application preferences, or refreshing OAuth2 token.

## Summary
In this article I presented 3 changes we intruduced into our REST API architecture, which speeds up process of delivering new features into mobile applications. These changes needs some extra work on backend site, but it's usually cheaper to make it on backend, than developing it in apps on 3 mobile platforms.

If you curious of other good practices of designing REST API, I recommend you to study full version of our [REST API Guildeline](http://allegro-restapi-guideline.readthedocs.io/en/latest/).
