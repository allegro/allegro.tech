---
layout: post
title: Introducing Slinger - deep linking library for Android
author: krzysztof.kocel
---

## Problem

Consider you are an Android application developer. You created an application for your product and you would like to enable your users browse content of your product using mobile app. If a product website has its addresses organized as resources it's easy, problem comes when there is no clear distinction between resources since they can be SEO friendly. The reason why handling such links in Android is hard is that intent-filter mechanism is very limited. 

Suppose you want to support links in such format: `http://www.example.com/123-product-and-some-product-description-in-url.html`

In `AndroidManifest.xml` you define:

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

But let's say that we want to handle links in following format: `http://www.example.com/friendly-yet-changing-title-t123.html`

Using `android:pathPattern` won't help since it's very limited and can't handle more complex patterns.

## Solution

That's why Slinger was created.

Slinger is a simple library that captures all the links within a domain and redirects them to corresponding parts of mobile application.

Here is conceptual diagram that shows how Slinger works:

<center>
![Diagram explaining how Slinger works](/img/articles/2015-07-31-slinger-diagram.png)
</center>

## Installation

As Slinger user you need to create thin `Activity` handling all urls beneath your website and provide regular expression with corresponding `Intent` that will launch specific part of your application.

```java
public class MySlingerRoutingActivity {

  ...
  
  private RedirectRule getRedirectRuleForProductActivity() {
    return RedirectRule.builder()
        .intent(new Intent(context, MyConcreteActivityForProduct.class))
        .pattern("http://www.example.com/.*-t[0-9]+\\.html")
        .build();
  }
  
  @Override protected IntentResolver getIntentResolver() {
    return new IntentResolver(asList(getRedirectRuleForProductActivity()));
  }
}
```

You can provide as many `RedirectRules` as you wish. When url doesn't match any a default intent will be launched. 

## Conclusion

If your website has friendly urls and you are tired of limitations of intent filters then try Slinger!