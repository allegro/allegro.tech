---
layout: post
title: Introducing Slinger - deep linking library for Android
author: krzysztof.kocel
---

Consider you are an Android application developer. You created an application for your product and you would like to enable your users browse content of your product using mobile app. If a product website has it's addresses organized as resources it's easy, problem comes when there is no clear distinction between resources since they can be SEO friendly. The reason why handling such links in Android is hard is that intent-filter mechanism is very limited. 

Suppose you want to suppot links in such format: `http://www.example.com/123-product-my-product-description-in-url.html`

In Android application you define:

```xml
    <intent-filter android:label="@string/app_name">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <data
            android:host="www.example.com"
            android:pathPrefix=".*-product-.*/.html"
            android:scheme="http" />
    </intent-filter>
```

Pretty easy, huh?

But let's say that we want to handle links in following format: `http://www.example.com/friednly-yet-changing-title-t123.html`

Using `android:pathPattern` won't help 

That's why Slinger was created.

Slinger is a simple library that captures all the links within a domain and redirects them to corresponding parts of mobile application.

Here is conceptual diagram that shows how Slinger works:




