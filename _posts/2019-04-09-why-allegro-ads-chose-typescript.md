---
layout: post
title: Why Allegro Ads chose TypeScript
tags: [tech, typescript, flow, javascript]
author: pawel.grzeszczak
---

A modern look and fully mobile-friendly design — this is how we created the new version of [ads.allegro.pl](https://ads.allegro.pl).
Unfortunately, several hundred tests did not protect us from errors.
The last straw was when a simple but very annoying problem appeared in production.
We decided to start a revolution. We considered [Flow](https://flow.org/), but ended up adopting [TypeScript](https://www.typescriptlang.org/)
for Allegro Ads.

## The Beginning
The Allegro Ads project goal is to enable sellers at [Allegro](https://allegro.tech/about-us/) to advertise their offers. 2017 was a breakthrough year for it.
The key change was to be the new web page, denoted “version 2.0”.
It was to deliver a new quality to users, quick implementation to business,
and the prospect of boredom to testers. Has this happened?

The application was launched without any major problems in the [MVP](https://en.wikipedia.org/wiki/Minimum_viable_product) version.
In keeping with the Agile spirit,
we gradually supplemented it with all the functionality of the previous version and added completely new features.

It was certainly not time to celebrate yet, but rather time for more hard work.
We had no major errors, but their sheer number was slowing us down, lengthening tests as the tasks kept coming back to developers for fixing.
In order to protect ourselves from this, we added several hundred tests using dedicated testing solutions:
[mocha](https://mochajs.org/), [chai](https://www.chaijs.com/), [sinon](https://sinonjs.org/) and [enzyme](https://airbnb.io/enzyme/).

The effort paid off. The number of errors and warnings decreased noticeably, but that was not enough for us.
All too often, problems occurred during integration with data from the test environment.
Usually, the reason was incorrectly formatted or missing data.

The straw that broke the camel’s back was a production error, caused by a programmer incorrectly assuming that a string was a number.
This was due to the fact that all data returned by the backend is of a string type and is only converted to a number or a date
in our system depending on each field’s meaning, then converted back to a string for display.
During these type conversions, we could not be sure that the type was right at every stage.
An error appearing in production was such a bad thing that we decided to take a look at static typing.

## TypeScript, Flow?
<img alt="TypeScript, Flow" src="/img/articles/2019-04-09-why-allegro-ads-chose-typescript/ts-vs-flow.png" />

There are two competing solutions on the market: Flow and TypeScript. The first one comes from Facebook and
guarantees support for React — the main Ads library on which we based the user interface.
It is not a transpiler, and its only role is to check types so unlike TypeScript, it requires an additional tool to work, e.g. [Babel](https://babeljs.io/).

The other solution is TypeScript — a free and open-source programming language
created by Microsoft as a superset of JavaScript. It has its own transpiler which converts code to JavaScript.

Both solutions are supported by popular integrated development environments, e.g. WebStorm, NetBeans and Eclipse.
These big companies behind them ensure continued development.
Both also provide similar basic features
(data type checking, creation of non-standard types, specification of parameters and return values).
However, TypeScript is more popular, has a larger community and better documentation.
It became our choice in the end.

<img alt="npm trends" src="/img/articles/2019-04-09-why-allegro-ads-chose-typescript/npm-trends.png" />

## Migration
We started migrating “old” to “new”, but it was not a simple task.
Already in the beginning, a problem appeared
when in one task a file was rewritten in TypeScript (TS) and as a part of another task, its original version,
still written in JavaScript (JS), was modified.
On the one hand, a new TS file was created, on the other,
the old JS file was updated with new features and this situation caused a conflict that was difficult to resolve.
Therefore, during the interim stage, special caution was required.

We decided to not rewrite everything, but we adopted the principle that we would not migrate all current code to TypeScript, only the main features.
However, each new class would be created in the new, statically typed way.
Thanks to this, we managed to convert more than half of the 1500 files to TS.

<img alt="TypeScript files" src="/img/articles/2019-04-09-why-allegro-ads-chose-typescript/files-comparison.png" />

## The project grows in complexity
TypeScript introduces a lot of new syntax elements and some of them, e.g. generic types, increased the complexity of code
when used intensively.
We had to spend extra time mastering new techniques.

```typescript
export class Model<T> {
    public copy(props: Partial<T>): T {
        const copy = Object.create(this.constructor.prototype);
        Object.assign(copy, this, props);
        return copy;
    }

    public set<K extends ExcludeOwnProperties<T>>(property: K, value: T[K]): T {
        return this.copy({
            [property]: value
        });
    }

    public has(property: string): property is keyof Model<T> {
        return property in this;
    }
}

type ExcludeOwnProperties<T> = Exclude<keyof T, keyof Model<unknown>>;

export function modelBuilder<T extends Model<T>>(constructor: {new(): T; }, props: Partial<T>) {
    return new constructor().copy(props);
}
```

Looking at the above code made developers who had no experience with this technology feel uneasy.
As their knowledge developed, the above notation ceased to scare,
and even encouraged them to experiment and to look for improvements.

## IDE support
An additional motivation for using TypeScript is very good IDE support, which detects and notifies you of any incorrect syntax.
Webstorm recognizes `*.ts` files and provides support for completing keywords, variables and parameters.
It marks and highlights errors, suggesting how to solve them. It also provides on-the-fly compilation of JavaScript to TypeScript.

<img alt="Compilation" src="/img/articles/2019-04-09-why-allegro-ads-chose-typescript/compiling.png" />
<img alt="Autocomplete" src="/img/articles/2019-04-09-why-allegro-ads-chose-typescript/autocomplete.png" />

## The problem with Immutable.js
Before the TypeScript era, our data structures were based on the `Record` class from [Immutable.js](https://github.com/immutable-js/immutable-js/) library.

```javascript
export class KeywordPhrasesModel extends Record({
    additionalKeywords: List(),
    requiredPhrases: List(),
    forbiddenPhrases: List()
}) {

}
```

After switching to TypeScript, it turned out that the library did not have good support for the `Record` class.

<img alt="Record class from Immutable.js error" src="/img/articles/2019-04-09-why-allegro-ads-chose-typescript/error.png" />

We decided on a different solution based on the aforementioned `Model` class and the use of `readonly` keyword.
From now on, TypeScript takes care of the immutability, but this fails to work when the class is used outside of TypeScript.

```typescript
export class KeywordPhrasesModel extends Model<KeywordPhrasesModel> {
    public constructor(
       readonly additionalKeywords: List<string> = List(),
       readonly requiredPhrases: List<string> = List(),
       readonly forbiddenPhrases: List<string> = List()
    ) {
        super();
    }
}
```

## When to use it?
* The project has data passing through different layers.
* The team is familiar with TypeScript, has experience in other statically-typed languages ​​or is motivated to learn.
* Other libraries suggest its use, e.g. Angular 2.

## When to avoid it?
* The project is small or has no complex structure.
* You care about getting maximum performance and minimum package size.

## Summary
There were doubts whether such a great change made sense in a situation of continuous product development.
We were wondering if the overhead of writing strongly-typed code would pay off.
The overhead of learning a new language did not make the Product Owner too happy, either ;-)

We took the risk and it turned out it was the right decision. We are currently delighted with TypeScript.
We gained knowledge how to use it and the technology itself has improved the security of our applications.
Situations in which casting errors occur are detected already at the coding stage.
Even in a product as large and mature as Allegro Ads, static typing turned out to be achievable and worth investing in.
