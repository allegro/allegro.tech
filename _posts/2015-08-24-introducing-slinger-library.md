---
redirect_from:
   - /introducing-slinger-library.html
layout: post
title: Introducing Slinger - deep linking library for Android
author: krzysztof.kocel
tags: [tech, android, Slinger]
---

Consider you are an Android application developer. You created a mobile application for your website and you would like to enable your
users to browse content of your website using a mobile app. It’s easy if a website uses RESTful guidelines for creating URLs.
Problem comes when a website uses SEO friendly URLs. Handling such links is hard because regular expression mechanism in Android manifest is flawed.

Suppose you want to support links in such format:

`http://www.example.com/{product-id}-{product-name-and-product-description}.html`

In `AndroidManifest.xml` you define:

```xml
<intent-filter android:label="@string/app_name">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data android:host="www.example.com"
          android:pathPattern=".*-product-.*/.html"
          android:scheme="http" />
</intent-filter>
```

Pretty easy, huh?

But let’s say that we want to handle links in the following format:

`http://www.example.com/{friendly-yet-changing-title}-t{product-id}.html`

Using `android:pathPattern` attribute won't help since it has very limited functionality and can’t handle more complex patterns.

## Solution

[Slinger](https://github.com/allegro/slinger) was created to address such situations.

Slinger is a simple library that captures all the links within a domain and redirects them to corresponding parts of mobile
application.

Here is conceptual diagram that shows how Slinger works:

<center>
![Diagram explaining how Slinger works](/img/articles/2015-07-31-slinger-diagram.png)
</center>

## Installation

As a Slinger user you need to create thin `Activity` handling all URLs used by website and provide regular expressions with
corresponding `Intent` that launch specific part of your application.

At the beginning you declare `Activity` that will be handling all URLs within your domain:

```xml
<activity android:name="com.example.MySlingerRoutingActivity ">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <data android:scheme="http"
              android:host="www.example.com"
              android:pathPattern="/.*" />
    </intent-filter>
</activity>
```

Then you create appropriate rules that redirect URL to concrete `Activity`:

```java
import pl.allegro.android.slinger.SlingerActivity;
import pl.allegro.android.slinger.resolver.DefaultIntentResolver;
import pl.allegro.android.slinger.resolver.RedirectRule;

public class MySlingerRoutingActivity extends SlingerActivity {

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

You can provide as many `RedirectRules` as you wish. When URL doesn’t match any rule, a default intent is launched.

## Conclusion

If your website has friendly urls and you are tired of limitations of intent filters then try [Slinger](https://github.com/allegro/slinger)!
