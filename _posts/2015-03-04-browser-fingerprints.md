---
layout: post
title: Browser Fingerprinting — introduction
author: jacek.zoch
tags: [tech,javascript, frontend, fingerprints, cookies]
---
Any website finds identification of visitors crucial.
Usually, [cookie files](http://en.wikipedia.org/wiki/HTTP_cookie) are used, but they have several drawbacks,
as users can delete or block them (e.g. by activating the “incognito” mode in web browsers).
Besides, cookies fail to identify a user who uses several different web browsers, even if he or she connects using the same device.
Hence the idea of a _browser fingerprint_ &mdash; a unique user identifier
which does not change between successive sessions and which does not depend on selected web browser.

## Identification of persons
What do you need to identify a person? The answer is not that easy. A single piece of data such as gender,
date of birth or ZIP code will not help you identify anybody, unless you know all the other details.

In information technology, [entropy](http://en.wikipedia.org/wiki/Entropy_%28information_theory%29) is a measure of certainty about information.
It can be used as a measure of how much specific pieces of information increase the possibility of revealing someone’s identity.
We can think of entropy as a certain value indicating how many values a random variable can have: two possibilities - 1 bit of entropy,
four possibilities - 2 bits of entropy, etc.
Since there are about 7 billion people on Earth, you need about 33 bits of entropy (2 ^ 33 ≈ 8 billion) to identify a random person.

Each detail you know about a person reduces the entropy by a certain value,
which you can calculate using this formula: _&Delta;S = - log<sub>2</sub> Pr (X = x)_, where _&Delta;S_ is the entropy decrease expressed in bits
and _Pr (X = x)_ is the probability of a given fact.
For example, date of birth: _&Delta;S = - log<sub>2</sub> Pr (DOB = 01.11 ) = -log<sub>2</sub> (1/365) ≈ 8.51_ bits of information.
(See [Panopticlick](https://panopticlick.eff.org))

## Techniques of fingerprinting
How does the calculation from previous paragraph apply to web browsers? You can identify them not only by their IP address or cookies, but also by other features.
The technique I would like to present is called browser or machine fingerprinting.

What features can you use to identify browsers?

### Use of popular plugins
Adobe Flash is very convenient for the identification of web surfers because it is adopted by many users.
Moreover, the plugin version is an excellent identifying feature.

### Detecting fonts
The [list of system fonts](http://www.darkwavetech.com/fingerprint/fingerprint_fonts.html) can serve as a part of the user’s unique fingerprint.
You can collect it thanks to plugin-base detection.
ActionScript (Flash's scripting language) provides APIs for retrieving a list of fonts installed on a system.
Order of entries in the list in the list is another fingerprinting feature.
If the Flash plugin is unavailable, you can use Javascript to check whether a specific font is installed.
Simply browse through the list of fonts and compare,
if height and width of a fixed string provided in a certain font are different than the height and width of the same string provided in a standard font.

### Detecting IP address
Users can set their browsers to send all requests through a proxy in order to hide their IP address.
With a Flash application you can bypass HTTP Proxy and contact your backend directly to receive the IP address.

### Special fingerprint plugin
Such a plugin can read a lot of information about a user's system, but you need user consent for installing your plugin.

### Detecting browser and OS version
You cannot rely on `navigator.userAgent` or `User-Agent` HTTP header, because users can easily modify them.
Therefore, you have to focus on special, browser-populated JavaScript objects - `navigator` and `screen`.
You can identify a browser owing to:

1. property order of special browser objects, such as navigator and screen objects, which depends on a browser,
its version and operating system,
2. presence of some unique methods and properties of special browser objects, such as
`navigator.mozSms`( _Firefox_ ), `navigator.webkitStartActivity`( _Chrome_ ), `navigator.appMinorVersion`( _IE_ ) ,
3. modification of special objects with Javascript - checking if a script can delete an object property,
replace one property with another, or delete the whole object,
4. new browser features introduced in each version.

(See [True browser javascript](http://www.darkwavetech.com/fingerprint/fingerprint_truebrowser.html))

### Checking if particular plugins are present
A very interesting example are user-agent spoofing extensions.
Although user-agent spoofing is used by some users to avoid browser fingerprinting,
you can find out what extension is used and employ it as a part of browser identification.
You can identify each user-agent spoofing extension by a specific feature:

1. modification of `navigator.userAgent`, while leaving properties such as `appName`, `appVersion`, `vendor` and `platform` unchanged,
2. no support for screen object alteration, so browsers report invalid screen resolutions in case of mobile devices,
3. modification of HTTP header only, instead of complete `navigator` object.

### [HTML5 canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) fingerprinting

> The same HTML5 Canvas elements return unique pixels depending on a web browser and an operating system.
> Web browsers use different image processing engines, export options or compression level,
thus final images may get different hashes even if they are pixel-perfect,
whereas operating systems use different algorithms and settings for anti-aliasing and sub-pixel rendering.
> [Browserleaks.com](https://www.browserleaks.com/canvas)

(See [How does canvas fingerprinting work](https://www.browserleaks.com/canvas#how-does-it-work))

### [WebGL](https://www.khronos.org/webgl) support.
You can simply check the level of browser’s WebGL support, and retrieve some parameters related to the web browser’s identity.

(See [How to identify WebGL](https://www.browserleaks.com/webgl#howto-webgl-ident) )

### TCP SYN packet signature
A SYN packet is the first packet sent by a client when negotiating a connection via TCP protocol.
Usually, the packet signature, in particular in case of TCP Options, varies from one operating system to another,
even between versions of the same operating system.
This method is used by [Nmap](http://nmap.org/book/osdetect-methods.html) for OS fingerprinting.

### Latency Fingerprint
Check the latency between the server and the client.
The latency timing can be affected by many factors and particular user timing can vary over a range of latency numbers,
so you should take only standard deviation into account.

```Javascript
  perfData = window.performance.timing;
  requestTime = perfData.responseStart - perfData.requestStart;
  networkLatency = perfData.responseEnd - perfData.fetchStart;
```

## Good fingerprint
After collecting data described above, it is possible to calculate a fingerprint,
which :

 1. does not depend on the IP address and can efficiently track changes in the IP address
 2. can distinguish between different PCs behind a NAT
 3. is not affected by computer upgrades and browser updates, switching browsers, plugins or emptying local storage.

(see [Privacy Enhancing Technologies]( http://pet-portal.eu/files/articles/2011/fingerprinting/cross-browser_fingerprinting.pdf ) )

Some of the features such as browser versioning, IP address, font list or canvas fingerprint can be used to track changes in the fingerprint,
as there is almost no correlation between them in case of popular OSes.
If one value changes, while the other three remain unchanged, it usually means that a user switched browsers or installed new fonts.
Nevertheless, it is still the same user.

## More info
* [Darkwave Technologies] (http://www.darkwavetech.com/device_fingerprint.html)
* [W3Org] (http://www.w3.org/wiki/images/7/7d/Is_preventing_browser_fingerprinting_a_lost_cause.pdf)
* [Panopticlick] (https://panopticlick.eff.org)
* [noc.to] (http://noc.to)
* [Privacy Enhancing Technologies] (http://pet-portal.eu/blog/tag_search/?tag=fingerprint)
* [Browserspy.dk] (http://browserspy.dk)

### Final notice
I would like to remind that browser fingerprinting should be performed only in compliance with both ethical and legal requirements.
