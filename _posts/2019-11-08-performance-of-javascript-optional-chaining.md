---
layout: post
title: Performance of JavaScript optional chaining
author: [eryk.napierala]
tags: [performance, webperf, perfmatters, javascript, typescript, frontend]
---

One of the coolest features added in [just announced TypeScript
3.7](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7/) is optional chaining syntax. It promises a
much shorter and more readable code for dealing with deeply nested data structures. How may this nice new feature affect
the performance of your project?

At first sight, optional chaining syntax can make the codebase significantly smaller. Instead of writing monstrous code
like this one:

```javascript
foo && foo.bar && foo.bar.baz && foo.bar.baz.qux
```

you can write this

```ts
foo?.bar?.baz?.qux;
```

19 characters instead of 48. Quite concise!

## Bundle size

The thing is, it's very unlikely that you'll ship the new syntax to the end-user. At the time of writing the post, the
only browser supporting it is [Chrome 80](https://www.chromestatus.com/feature/5668249494618112). So, at least for now
the transpilation is must-have.

How does the expression above look in [plain old
JavaScript](https://www.typescriptlang.org/play/index.html?ssl=1&ssc=1&pln=1&pc=20#code/GYexH4DoCMEMCcpwF5QI4FcAeBuIA)?

```js
var _a, _b, _c;
(_c = (_b = (_a = foo) === null || _a === void 0 ? void 0 : _a.bar) === null || _b === void 0 ? void 0 : _b.baz) === null || _c === void 0 ? void 0 : _c.qux;
```

That's, well, far more than 19 characters, even more than 48 you could have before. To be precise, it's 172 characters!
Minification decreases this number, but it's still 128 - 6 times more when compared with the source code.

```js
var _a,_b,_c;null===(_c=null===(_b=null===(_a=foo)||void 0===_a?void 0:_a.bar)||void 0===_b?void 0:_b.baz)||void 0===_c||_c.qux;
```

Fortunately, the TypeScript compiler isn't the only option we have. [Babel provides support for optional
chaining](https://babeljs.io/docs/en/babel-plugin-proposal-optional-chaining) as well.

Let's check [how it deals with the new
syntax](https://babeljs.io/repl#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=GYexH4DoCMEMCcpwF5QI4FcAeBuIA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=false&presets=&prettier=false&targets=&version=7.7.1&externalPlugins=%40babel%2Fplugin-proposal-optional-chaining%407.6.0%2Cbabel-plugin-syntax-optional-chaining%407.0.0-alpha.13).
Is it any better than TypeScript? It doesn't look like! 244 characters.

```js
var _foo, _foo$bar, _foo$bar$baz;

(_foo = foo) === null || _foo === void 0 ? void 0 : (_foo$bar = _foo.bar) === null || _foo$bar === void 0 ? void 0 : (_foo$bar$baz = _foo$bar.baz) === null || _foo$bar$baz === void 0 ? void 0 : _foo$bar$baz.qux;
```

However, after running Terser on the code, the code is smaller than minified TypeScript output - 82 characters.

```js
var l,n;null==u||null===(l=u.bar)||void 0===l||null===(n=l.baz)||void 0===n||n.qux
```

So in the best scenario, we're getting around 4 characters in the final bundle for each one of the source code. How many
times could you use optional chaining in a medium-sized project? 100 times? If you'd migrate to the new syntax in such a
case, you've just added 3,5 kB to the final bundle. That sucks.

## Alternatives

Let's take a step back. Optional chaining isn't a new idea at all. Solutions for the `incredibly && long && double &&
ampersands && chains` problem have already existed in the so-called userspace for quite some time. Jason Miller's
[`dlv`](https://github.com/developit/dlv) is only one among many.


```js
dlv(foo, 'bar.baz.qux');
```

Besides this approach isn't as good as the new syntax, because it's not type-safe, it requires slightly more code on the
call site - 25 characters. Plus, you must import the function from the library. But, how the code looks in the final
bundle?


```js
d(u,'bar.baz.qux');
```

What a surprise! 19 characters, that's as concise as optional chaining syntax itself.

If you feel uncomfortable with strings, you can pass an array of strings to the function. Although it's more characters
in both source and the final code, it may be worth to do it. You will see later why.


```js
dlv(foo, ['bar', 'baz', 'qux']);
```

Implementation of the function itself takes only 101 characters after minification.


```js
function d(n,t,o,i,l){for(t=t.split?t.split("."):t,i=0;i<t.length;i++)n=n?n[t[i]]:l;return n===l?o:n}
```

It means it's enough to use optional chaining transpiled with Babel two times and you'll get more code than with `dlv`.
So, is the new syntax no-go?

## Parsing time

The amount of the code affects not only downloading a file but also the time of parsing it. With
[estimo](https://www.npmjs.com/package/estimo) we can estimate (😉) that value. Here are the median results of running
the tool around 1000 times for all variants, each containing 100 equal optional chainings.

[![code parsing
time](/img/articles/2019-11-08-performance-of-javascript-optional-chaining/jdgt6978sx3gnc7i63sj-1.png)](https://docs.google.com/spreadsheets/d/17xD1LgKWQSoOYLRq-ZoMQr9s6LzwmF2i4_H39UquKAo/edit?usp=sharing)

It seems that parsing time depends not only on the size of the code but also on used syntax. Relatively big "old spice"
variant gets significantly lower time than all the rest, even the smallest one (native optional chaining).

But that's only a curiosity. As you can see, at this scale differences are negligible. All variants are parsed in time
below 2 ms. It happens at most once per page load, so in practice that's free operation. If your project contains much
more optional chaining occurrences, like ten thousand, or you run the code on very slow devices - it might matter.
Otherwise, well, it's probably not worth to bother.

## Runtime performance

Performance is not only about the bundle size, though! How fast is optional chaining when it goes to execution? The
answer is: it's incredibly fast. Using the new syntax, even transpiled to ES5 code, may give 30x (!) speedup comparing
to `dlv`. If you use an array instead of a string, though, it's only 6x.

![jsPerf results](/img/articles/2019-11-08-performance-of-javascript-optional-chaining/wge5ljra79fxi6kr9i4w-1.png)

No matter if [accessing empty object](https://jsperf.com/optional-chaining-empty-object), [full
one](https://jsperf.com/optional-chaining-full-path) or [one with null
inside](https://jsperf.com/optional-chaining-null-inside), approaches not employing accessor function are far more
performant.

## Conclusion

So, is it optional chaining fast or slow? The answer is clear and not surprising: it depends. Do you need 150 M
operations per second in your app, or 25 M is enough? Could the slower implementation decrease FPS below 60? Does it
make sense to fight against these few kilobytes coming from transpilation? Is it possible the loading time of the app
increases significantly because of them?

You have all the data now, you can decide.
