---
layout: post
title: The iOS bug chase
author: kamil.borzym
tags: [tech, ios, debugging, decompiling, MapKit, hopper, mitmproxy]
---

This article tells a story of chasing an iOS bug – a bug hidden so deep that it
required many different skills and debugging on different levels to identify it.
I think every native mobile app developer (not only an iOS developer) will find 
this text interesting. Non-mobile developers may find it an intriguing read as
well.

## Bugs

A mobile device is a fully-fledged computer these days and as such it always
does what it has been programmed to. If something fails, this is because a
computer did things exactly as it was commanded to. We – as humans – make
errors, which is part of our nature. Without errors, we would not be able to
learn.

> I don't want to insist on it, Dave, but I am incapable of making an error.
>
> HAL 9000

In a novel by Arthur C. Clarke, a potential AB-35 unit crash could be detected
before it even occurred. In the real world, we diagnose bug symptoms using
various tools:

- crash loggers — crashes and non-fatal errors,
- tracking tools — detecting user flow anomalies,
- remote configuration — possibility of disabling problematic features.

Often, these tools are sufficient to analyze an issue. But occasionally, they
can hardly detect if anything is wrong or, in the case of a very complex
problem, even the most sophisticated tools are of no help. One should be aware
that even a single undetected non-fatal error can affect the experience of
thousands of users. That is why here, at [Allegro](https://kariera.allegro.pl/),
we have to be very serious about all potential issues.

This article describes an iOS MapKit bug analysis and its resolution, starting
with source code, through network stack, down to the assembly, and ending up in
San Francisco.

## The Bug

One of our quality assurance engineers reported a strange bug. No one but him
was able to reproduce it. The problem could be seen in the process of selecting
a parcel machine for shopping delivery. Apparently the problem occurred on a
single device only.

The
[`MKMapView`](https://developer.apple.com/library/ios/documentation/MapKit/Reference/MKMapView_Class/)
controller had trouble displaying a map. Internet connection was working fine
on the device. Restarting or reinstalling the app did not fix the problem.

![The Bug](/img/articles/2016-08-01-the-ios-bug-chase/the_bug.png)

After playing with the bug for some time, the issue suddenly disappeared. The
situation was terrifying. Our iOS app has tens of thousands of daily active
users. Even if the problem persisted for a small percentage of that volume, it
could prevent users from selecting a parcel machine. This would block shopping
for a large number of buyers — the last thing we really wanted. Any attempt to
break `MKMapView` again failed (i.e. simulating a poor network, `MKMapView`
stress testing, etc.). Suddenly, when the bug re-appeared on two other devices,
we had a chance to catch it.

Strangely enough, the iOS Maps app showed the same symptoms, so did all the
third party apps installed. This seemed to be a bug in iOS, but we could not
ignore it anyway.

Each time you start ignoring a bug, you end up looking just like this
[owl](http://devopsreactions.tumblr.com/post/143885280016/when-you-get-accustomed-to-some-bugs).

<video src="/img/articles/2016-08-01-the-ios-bug-chase/owl.mp4" autoplay loop></video>

Now seriously... Although we could not fix the bug directly in iOS, we could at
least try to bypass it, so that it would no longer occur in our app. The
analysis began.

## The Code

I tried the most basic level of debugging — logging an error. MapKit provides a
handy delegate method:

```objc
-[MKMapViewDelegate mapViewDidFailLoadingMap:withError:]
```

so I implemented it with some `NSLog` logging inside.

I also added a breakpoint there, so I could debug and inspect the `error` in
depth using Xcode Variables View. The breakpoint was reached almost immediately.

![breakpoint](/img/articles/2016-08-01-the-ios-bug-chase/breakpoint.png)

The delegate method invocation was caused by a `GEOErrorDomain` domain error.
Its `userInfo` was a singleton dictionary, a single array of underlying errors
under the `SimpleTileRequesterUnderlyingErrors` key. Each underlying error had
two values in its `userInfo` dictionary: the first one under the `HTTPStatus`
key and the second one under the `NSErrorFailingURLStringKey` key. It was a
clear sign that a network error was a direct cause of failure to display map
tiles.

## The Man In The Middle

When it comes to the analysis of network communication, one of the simplest,
yet most powerful tools you will ever need is [mitmproxy](mitmproxy.org). Never
heard of it? You should really check it out, as it can save you hours of
debugging in the future. In this case, I only used it to intercept network
requests, but mitmproxy has many more features (e.g. scripting).

I started to intercept network traffic and displayed the map to trigger its
network activity. Mitmproxy showed a lot of map tile requests.

![mitmproxy](/img/articles/2016-08-01-the-ios-bug-chase/mitmproxy_410.png)

There were a lot of requests finished with `410` response code, indeed. But
wait... what? `410`?

![cat](/img/articles/2016-08-01-the-ios-bug-chase/cat.jpg)

>410 Gone
>Indicates that the resource requested is no longer available and will not be
available again. This should be used when a resource has been intentionally
removed and the resource should be purged.
>
>[rfc7231](https://tools.ietf.org/html/rfc7231#section-6.5.9)

And guess what... Just as I finished debugging, the bug suddenly disappeared!
The map worked great again and all map tile requests finished successfully with
`200` response code.

![mitmproxy](/img/articles/2016-08-01-the-ios-bug-chase/mitmproxy_200.png)

I lost the bug, but at least I had a network communication dump in mitmproxy.
The only thing I could do at that point was to take a closer look at it.

At first glance, the map tile request contained nothing extraordinary. Just
everything one could expect:

```
http://gspe19.ls.apple.com/tile.vf?flags=...&style=...&size=...&scale=...&v=...&z=...&x=...&y=...&sid=...&accessKey=...
```

I compared two tile requests – each corresponding to the same tile with the
same `x`, `y` and `z` coordinates, but the former finished with the `410` code
and the latter with the `200` code. Filtering the mitmproxy flow list with the
`style=1.*&z=14&x=8962&y=5377` limit filter gave rewarding results.

![mitmproxy](/img/articles/2016-08-01-the-ios-bug-chase/mitmproxy_filter.png)

Only one map tile request parameter looked suspicious – that was the `v`
parameter. I was 99% certain that the `v` stood for some kind of version
number. An analysis of a long-time request log confirmed my suspicions about
the `v` — the parameter went up every few minutes while I was browsing Apple
maps.

It was great! Imagine a world without the `v` parameter and a user browsing a
map region and the region being edited at the same time. That would result in
serious glitches. Map glitches are the last thing the car driver wants.

The question was: what caused `v` to increment? A couple of requests happened
in between the `410` and `200` responses, just while the `v` was being changed.

![mitmproxy](/img/articles/2016-08-01-the-ios-bug-chase/mitmproxy_geomanifest.png)

One request looked particularly suspicious and that was the request for
`/geo_manifest/dynamic/config`. It was also the only request that retrieved
serious data. Unfortunately, the response inspection revealed binary data with
neither `11040529` nor `0xA87711` (in any endianness). Even though the new `v`
value was not clearly visible in the `geo_manifest` data, it could still be
present there. Anyway, it would be hard, if not impossible, to understand
binary data of an unknown format. But I still had a few more tricks to use.

## The Machine Code

`MapKit.framework` was the one that should understand `geo_manifest`, so the
obvious option was to look for this understanding in the framework code. The
MapKit source code is obviously not publicly available, but there were two
things that helped overcome that obstacle.

Firstly, all iOS framework dylibs can be easily accessed from either:

* iOS Simulator files — x86 and i386 dylibs

```
/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/System/Library/Frameworks
```

* iOS Device Symbols — ARM dylibs

```
~/Library/Developer/Xcode/iOS\ DeviceSupport/*/Symbols/System/Library/Frameworks
```

![Frameworks](/img/articles/2016-08-01-the-ios-bug-chase/frameworks.png)

Secondly, [Hopper](https://www.hopperapp.com/) makes decompilation nothing but
pure pleasure. Hopper is such a powerful, yet simple and intuitive tool that
any person, even one without knowledge of assembly or Mach-O, could easily
analyze any executable. The basic Hopper usage scenario is as simple as that:

1. Use “Read Executable to Disassemble” and wait until Hopper processes the
binary.
2. Use the symbols panel to find the method of your interest.
3. Use “Show Pseudo Code of Procedure” to see selected method logic.

What method to look for in order to find a `geo_manifest` trace? The obvious
choice was to filter symbols using the `geomanifest` filter at first, and that
was it!

![symbols](/img/articles/2016-08-01-the-ios-bug-chase/symbols.png)

`GEOResourceManifestManager` caught my eye. Unfortunately, no method for that
class was visible, only an external symbol reference
`_OBJC_CLASS_$_GEOResourceManifestConfiguration`. This meant that MapKit used
another framework underneath. I listed shared libraries of MapKit dylib using
`otool`:

```bash
$ otool -L /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/System/Library/Frameworks/MapKit.framework/MapKit
...
	/System/Library/PrivateFrameworks/GeoServices.framework/GeoServices (compatibility version 1.0.0, current version 1151.49.0)
...
```

From among many other dylibs used by MapKit, `GeoServices.framework` looked
like the obvious owner of `GEOResourceManifestConfiguration`.
`GeoServices.framework` is a private system framework, no wonder I had never
heard of it before. So I tried to inspect the `GeoServices` dynamic library
using Hopper. I used `GEOResourceManifestManager` as a symbols filter and
Hopper showed a bunch of `GEOResourceManifestManager` methods. One of them was
the method:

```objc
-[GEOResourceManifestManager forceUpdate]
```

![force_update](/img/articles/2016-08-01-the-ios-bug-chase/force_update.png)

Once again, I was very lucky.

## The Hack

By pure coincidence I got another device affected by the maps problem. Having
the knowledge of `GeoServices.framework` internals, I could run the debugger
and try to perform some magic.

```objc
(lldb) po [GEOResourceManifestManager class]
GEOResourceManifestManager
(lldb)
```

Thanks to the dynamic nature of Objective-C, lldb had no trouble finding the
`GEOResourceManifestManager` class. Invoking `-[GEOResourceManifestManager
forceUpdate]` was not a problem either.

```objc
(lldb) po [[GEOResourceManifestManager sharedManager] forceUpdate]
 nil
(lldb)
```

Then, a miracle happened — mitmproxy showed a request for
`/geo_manifest/dynamic/config` followed by a nice bunch of successful tile
requests.

I was so close, yet so far from the fix. This was a one-time device state fix,
a symptomatic treatment, not a fix to the root cause of the problem. But I
tried to do it at least to see if the whole investigation was not totally wrong.

Later, using another affected device and just to play around, I ran the test
app with the following code:

```objc
- (void)viewDidLoad {
    Class resourceManifestManagerClass = NSClassFromString(@"GEOResourceManifestManager");
    SEL sharedManagerSelector = NSSelectorFromString(@"sharedManager");
    SEL forceUpdateSelector = NSSelectorFromString(@"forceUpdate");
    if (resourceManifestManagerClass && [resourceManifestManagerClass respondsToSelector:sharedManagerSelector]) {
        id sharedManager = [resourceManifestManagerClass performSelector:sharedManagerSelector];
        if (sharedManager && [sharedManager respondsToSelector:forceUpdateSelector]) {
            [sharedManager performSelector:forceUpdateSelector];
        }
    }
}
```

Note that using a private API is a violation of the iOS Developer Program
Agreement. Any app found using a private API is rejected by Apple. Even if such
app passes the Apple review, for example by hiding selectors with simple
[ROT13](https://en.wikipedia.org/wiki/ROT13), the app can be unstable.
Checking for `respondsToSelector:`? Still unsafe, because any private method
behavior could change anytime or cause a trap after detecting an illegal flow.
Do not ever try to release such code!

## The Radar

The investigation showed one thing — the bug was clearly in iOS, affecting the
whole system and could not be properly fixed in the app. The only thing that
could and should be done, was to [file an Apple bug
report](https://bugreport.apple.com) (aka radar). An external user (non-Apple
employee) can only see bug reports reported by himself and no one else, so it
may also be a good idea to file an [openradar](https://openradar.appspot.com)
so that everyone else can find it and see its status. This way, “the 410
MapKit” issue described above was reported as `rdar://25267344`. The issue was
also described on the [Apple Developer
Forum](https://forums.developer.apple.com/thread/43077).

## The Engineer

Some time after filing the bug report, I managed to attend
[WWDC2016](https://developer.apple.com/wwdc/).

WWDC is full of sessions about the latest iOS topics, but the real value lies
in the labs. I visited a MapKit lab to ask what was going on with
`rdar://25267344`. I met an Apple engineer and told him about the “410 MapKit
issue”. He opened the [Radar](https://www.theiphonewiki.com/wiki/Radar) on his
iPhone and searched for the bug report. As it turned out, there was a lot of
comments under the bug report – comments seen only by Apple engineers. He told
me that my bug report helped to capture a 4-year old bug regarding incorrect
`410` HTTP status handling and the bug was fixed in iOS 10 beta 1.

Shortly after that conversation, I received an update regarding the bug report
— it asked me to test the issue in iOS 10 beta and to let Apple know if it
still occurred. My first thought was: “It will really be hard to test this
non-deterministic bug...”, but was it? The engineer told me the bug was about
incorrect `410` HTTP status handling, so I thought I could reproduce the `410`
status codes using mitmproxy. I just had to write a simple mitmproxy script
that would change the response of every tile request by replacing the status
code with `410`.

```python
def response(context, flow):
    if flow.request.path.startswith("/tile.vf"):
        flow.response.status_code = 410
        flow.response.content = b""
```

Then, by adding the script to mitmproxy, I could test the map behavior in iOS
10 beta 2 (latest beta at that time).

![mitmproxy_fixed](/img/articles/2016-08-01-the-ios-bug-chase/mitmproxy_fixed.png)

Mitmproxy changed the status code of each tile request to `410`. Once the first
tile request finished with `410` status code, `geod` daemon immediately updated
its manifest requesting fresh `/geomanifest/dynamic/config`. It worked just as
expected! The bug was resolved!

## What could go wrong?

A bug chase is often a long and hard process. In the one I have described, luck
was a big contributor to success, because – as usual – many things could have
gone wrong:

- the issue could just not have occurred on our test devices at all,
- maps API could have been secured with SSL-pinning,
- Apple could have ignored such an ephemeral bug report,
- the investigation could have gone in a wrong direction,
- the investigation could have required jumping through a decompiled framework call hierarchy — it is often very easy to get lost there.

## Summary

A good conclusion could be these four simple pieces of advice:

1. Install [mitmproxy](https://mitmproxy.org/) now.
2. Download [Hopper](https://www.hopperapp.com/), play with the trial version and add Hopper Personal License to your wish list.
3. File Apple bug reports — the Bug Reporter is not `/dev/null`, the whole Apple staff are just waiting for your reports.
4. “Stay Hungry. Stay Foolish.” + Learn internals... internals of everything — this will make the Force strong with you.

This was a happy-ending story — the bug has been resolved the right way, Apple
Maps will once again work seamlessly and the Allegro iOS app will provide the
best user experience. Nothing will stop our users from shopping. Or so it
seems... Crashes happen and we examine each crash report very carefully.
Maintaining the iOS app of the largest e-commerce business in Poland is a
challenge, but developers at Allegro do their best to protect users from any
obstacle to shop.
