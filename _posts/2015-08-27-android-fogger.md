---
layout: post
title: Blur background under Android common UI elements
author: pawel.byszewski
tags: [tech, android, ui, blur, renderscript]
---
All over the Internet there are code snippets that show how to make a blur effect on Android. But if you want to
introduce blur as a part of your app design and use it as an effect to hide content under dialogs, drawer etc. there is
no ready solution for all UI components. That’s why I wrote the [Fogger](https://github.com/allegro/fogger) library.

It does not require any complicated setup and has almost no effect on your app architecture. So it is simple to use
even if your product is already on the market. Here is some showcase:

<iframe height="315" width="420" src="https://www.youtube.com/embed/QqfhN5deSIU?rel=0" frameborder="0" allowfullscreen class="youtube_iframe"></iframe>

If you want to try it yourself, check out the
[example app](https://play.google.com/store/apps/details?id=pl.allegro.foggerexample) on Google Play.

### How it works?
The library allows to blur background under drawer, dialogs or context menu. Mechanism of blurring and attaching
blurred background to app’s UI components looks almost the same in all three cases. Differences are connected only
with various life cycles of UI components and the fact that even in clean Android opening a drawer and a dialog looks
quite different.
![schema]({{site.baseurl}}{% link /img/articles/2015-07-30-android-fogger/schema.png %})

There is no way to blur some part of the screen. So at first the library creates a screenshot of the
screen and blurs it. When the blurred image is ready, it is attached as a part of the screen, just under the element which will
have the blurred background (eg. drawer or dialog window). Finally the image is shown with animation, that simulates fluent
blurring process. Thus after all the view hierarchy has one more layer at the top of all your views which simulates dynamic blurring process.

It looks pretty simple and clear, so where is the challenge? Time. Everything must be done fast enough to look smooth.
The most demanding situation occurs when user interacts with a drawer. Background blurring must be directly proportional
to drawer sliding. So the blurred image must be available almost at the same time the user starts to interact with the
drawer. However there is no guarantee for duration of the whole process, so there must be an additional mechanism that
smoothly adjust the blur level if some part of the drawer is already visible.

### Need for speed
To save time I have made a lot of micro-optimizations. Decreasing the time of taking screenshots was the key to success. There are few ways of taking a screenshot in Android, I have tested all of them and picked the fastest one:

```java
private Bitmap createScreenShot(View view, int scaledViewWidth, int scaledViewHeight) {
   Bitmap localBitmap = Bitmap.createBitmap(scaledViewWidth,
                                            scaledViewHeight,
                                            Bitmap.Config.ARGB_8888);
   Canvas localCanvas = prepareCanvas(localBitmap, view.getContext());
   view.draw(localCanvas);
   return localBitmap;
}
```

Check out full [code example](https://github.com/allegro/fogger/tree/master/example) on github.

Additionally, the screenshot will be blurred anyway, so there is no reason to capture it in full resolution. Using
trial and error I have found the best scale factor, which allows for taking the screenshot faster without noticeable
quality loss.

### Epilogue
The Fogger works pretty hard under the hood and it still looks smooth and is easy to use so If you think that a nice blur effect can enhance the user experience of your application, you can try the Fogger library. If you find it useful, you can join the team and contribute to it by making pull requests.
