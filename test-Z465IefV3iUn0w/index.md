---
layout: default
title: tests
redirect_from:
- /2021/01/redirect-test.html
- /blog/2021/01/redirect-test.html
---
## Header
Basic *formatting*

Links using file paths rather than URLs (native Jekyll syntax, improved only in 4.0):
* [Post - Tradukisto]({% post_url 2015-04-03-tradukisto %})
* [Page - about us]({% link about-us/index.html %})

Links using file paths rather than URLs (jekyll-relative-links) - **seems to not work correctly**:
* [Post - Tradukisto](_posts/2015-04-03-tradukisto.md)
* [Page - about us](/about-us/index.html)
