---
layout: post
title: Don't lose your user's context when installing Android applications
author: krzysztof.kocel
tags: [android, java, google play, usability]
---
We live in a mobile-oriented world so it's crucial to provide the best usability experience possible.
In this post we show how you can preserve user's context when installing a mobile application from a website.

## Problem

Have you ever seen this comic?

<center>
![xkcd comic](http://imgs.xkcd.com/comics/server_attention_span.png "Source http://xkcd.com/")
<br/>
(source: [http://xkcd.com/869/](http://xkcd.com/869/))
</center>

Even though web developers did their homework, it is still a common scenario to install an application and
just lose context of where you were just before.

Let's say a user is browsing through offers on a real estate page. She notices a banner at the top which advertises her to install a mobile application.

<center>
![banner advertising possibility to install a mobile application ](/img/articles/2014-11-19.install_banner.png)
</center>

She clicks it, opens [Google Play Store](https://play.google.com/store/apps/details?id=pl.otodom), installs an application and totally loses content she saw at the beginning of the whole process.


## Solution

Fortunately, there is a solution for maintaining context. To do so, we would use [Campaign Parameters](https://developers.google.com/analytics/devguides/collection/android/v3/campaigns?hl=pl#campaign-params "Campaign Parameters") passed to Google Play Link.

In this example we would use `utm_term` for passing the id of the offer we want to be shown.

On every page with application advertisement we add this parameter with the corresponding `id` of the real estate property.

So our link for `id` 12345 looks like this:

`https://play.google.com/store/apps/details?id=pl.otodom&referrer=utm_source%3Dmobile_site%26utm_term%3D12345`

When application is installed from Google Play, broadcast is emitted with data from the referrer. We implement and register a custom broadcast receiver, capture `utm_term` and display the offer within our application.

Our broadcast receiver:

``` java
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.google.common.base.Splitter;
import com.google.common.primitives.Ints;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
[...]

public class PlayServicesUtmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent){
        if (intent.hasExtra("referrer")) {
            String utmTerm = getUtmTerm(intent);
            if (utmTerm != null && Ints.tryParse(utmTerm) != null) {
                // Start detail Activity here with id from utmTerm
            }
        }
    }

    private String getUtmTerm(Intent intent) {
        try {
            return Splitter.on("&").withKeyValueSeparator("=")
                    .split(URLDecoder.decode(intent.getStringExtra("referrer"), "UTF-8")).get("utm_term");
        } catch (UnsupportedEncodingException e) {
            // TODO handle unsupported exception here
        }
        return null;
    }

}
```

## Summary

Using this trick you will be able to maintain context between application and mobile website. It will provide better experience to your users. We hope that you find it useful.
