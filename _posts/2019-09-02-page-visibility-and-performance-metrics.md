---
layout: post
title: Page visibility and performance metrics
author: [eryk.napierala, pawel.lesiecki]
tags: [webperf, frontend, performance, metrics, perfmatters]
---

When we measure the page loading speed from the user's perspective, we pay attention to the appearance of subsequent
elements on the screen. Metrics such as First Contentful Paint, First Meaningful Paint and Visually Complete directly
reflect what the user sees and when. But what if the page is invisible, when it loads in the background, for example in
a different tab? Should we consider such views interesting for us? Don’t the collected metrics distort the results?

[![performance metrics]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image2.png %})]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image2.png %})

## Methodology

To answer these questions, we first need information about whether the page was visible when it was loading. For this purpose, we decided to send
new pieces of information from the browsers, collected by the Page Visibility API:

* Initial page visibility state
* Change of page visibility

Each time the tab is switched, hidden or the browser window is displayed (including switching the desktop in the operating system), it is recorded.

By comparing time of visual metrics with time of visibility changes, we can split page views into two buckets:

* Visible all the time until Visually Complete
* Invisible or partially invisible while loading

## Results

After splitting metrics in the way described above, we can compare the number of page views of each type and the values of the main metrics
collected for them. We did this for three Allegro pages: home page, offers listing and the offer page. The one loaded in the
background the most was the offer page, then homepage and last — listing page. This seems to correspond to the scenarios of using these
pages — e.g. when browsing search results, users open multiple offers in the background to compare them with each other.

[![Counts — desktop](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image5.png "Counts — desktop")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image5.png %})
[![Counts — smartphone](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image3.png "Counts — smartphone")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image3.png %})

Many more views took place in the background for desktops than for smartphones. This data is not surprising, either, since on the phone it is much
less convenient to use websites in many tabs.

For smartphones, First Contentful Paint time turned out to be several hundred seconds (!) higher for pages loading in the background than
for visible pages. For desktops, it was much less, but still over 100 seconds.

[![First Contentful Paint — smartphone](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image1.png "FCP — smartphone")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image1.png %})
[![First Contentful Paint — desktop](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image9.png "FCP — desktop")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image9.png %})

When we excluded an error in the aggregation algorithm, we looked at how we collect metrics. For better approximation of the moment when content
appears on the screen, we used to use the ```requestAnimationFrame``` API, which has been available for a long time in all major browsers. This
function allows plugging in custom code into the browser rendering process, just before the work of drawing the content. At this very
moment — when the interesting part of HTML was parsed, but before showing it on the screen — we send information to the server.
Unfortunately, currently there is no browser API that would allow code to be executed right after the visible content has been
updated.

```html
<div id="meaningul-content-here"></div>
<script>
function sendMark() {
  window.performance.mark('FirstMeaningfulPaint');
}

requestAnimationFrame(sendMark);
</script>
```

It turned out that in order to optimize the use of hardware resources, the browser does not render anything for tabs in the background. Even though it
still downloads stylesheets and parses HTML, it omits calculation of elements’ dimensions (so called Layout) and drawing them. There is no
animation frame rendered, thus the code passed to ```requestAnimationFrame``` is not executed. This stage of work is postponed until the tab is
activated. The reporting function starts almost at the same time as sending information about the change of visibility of the page. We have
experimentally proved this hypothesis, and it also found confirmation in the collected data. [First Paint](https://w3c.github.io/paint-timing/#first-paint) — a metric reported by the browser
itself — is also very high for hidden tabs. This means the first frame render occurs when a tab becomes active.

[![First Paint — smartphone](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image12.png "FP — smartphone")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image12.png %})
[![First Paint — desktop](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image4.png "FP — desktop")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image4.png %})

In order not to bias the results, we decided to conditionally — for invisible pages — collect metrics related to drawing at the time of
parsing the HTML code of elements. We are aware that this is a distortion in the opposite direction (measured time is smaller than it should be), but
the expected difference is much smaller than when using ```requestAnimationFrame```.

```html
<div id="meaningul-content-here"></div>
<script>
function sendMark() {
  window.performance.mark('FirstMeaningfulPaint');
}

if (document.visibilityState != 'visible') sendMark();
else requestAnimationFrame(sendMark);
</script>
```

After implementing the patch and re-checking the data, the picture changed significantly, but the trend remained — invisible pages
load noticeably slower and their higher times affect the overall result.

[![First Contentful Paint — smartphone](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image14.png "FCP — smartphone")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image14.png %})
[![First Contentful Paint — desktop](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image11.png "FCP — desktop")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image11.png %})

At first glance, this might seem illogical — since the browser does not render the content of invisible tabs, i.e. it does less work for
them, loading should end faster. Again, it is about optimizing utilization of resources and giving higher priority to the active tab. For
pages loading in the background, the browser limits not only access to the CPU but also to network resources. This way resources downloaded in inactive tabs have lower priority, which results in increased loading times.

[![First Meaningful Paint — smartphone](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image7.png "FMP — smartphone")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image7.png %})

[![First Meaningful Paint — desktop](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image15.png "FMP — desktop")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image15.png %})

[![Visually Complete — smartphone](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image8.png "VC — smartphone")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image8.png %})

[![Visually Complete — desktop](/img/articles/2019-09-02-page-visibility-and-performance-metrics/image6.png "VC — desktop")]({% link /img/articles/2019-09-02-page-visibility-and-performance-metrics/image6.png %})

## Summary

While we optimize the front-end we focus primarily on the speed of delivering content to the user. We should pay attention to the pages
someone is looking at and ignore those loaded in the background. We will treat the visibility of the page during the loading process as
another dimension on our dashboards and we will focus mostly on the measures collected from active tabs. We believe that data from inactive
tabs should be considered unnecessary and distorting the picture.
<style type="text/css">.post a img{margin: 0 auto;display: block;}</style>

