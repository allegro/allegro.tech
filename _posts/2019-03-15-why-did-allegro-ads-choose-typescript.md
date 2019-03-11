---
layout: post
title: Why did Allegro Ads choose TypeScript?
tags: [tech, typescript, flow, javascript]
author: pawel.grzeszczak
---

Several hundred tests, a modern look and full mobilization - this is how we created the new version of ads.allegro.pl.
Unfortunately, it did not protect us from errors.
When a simple but very annoying problem appeared on the production, the cup of bitterness poured over.
We decided to make a revolution. We analyzed Flow, but TypeScript is just adopting Allegro Ads.

## Beginning
2017 was a breakthrough year for the Allegro Ads project dealing with the advertising of Allegro's sellers' offers.
The key change was to be the new page marked with the number 2.0.
Thanks to it, users were to encounter new quality, business with quick implementations
and testers with the prospect of boredom and routine task closure. Has this happened?

The application has been launched without major problems in the MVP version.
This means that with the Agile spirit,
we gradually supplemented it with all the functionality of the previous version and added completely new features.
It definitely was not the time to open champagne, but for very hard work.

The mistakes were not great, but there were so many of them that they effectively slowed down the work,
extended the local testing process and the tasks returned from the testers over and over again.
In order to defend ourselves, we have added several hundred tests with dedicated solutions: mocha, chai, sinon and enzyme.

The effort paid off. The number of errors and warnings decreases noticeably, but it was not enough for us.
Too often problems occurred during integration with data from the test environment.
Typically, the reason was incorrect formatting or missing data.

The situation has been flooded with bitterness(Czarę goryczy przelała sytuacja to tak się pisze?), when a production error occurred,
in which the the programmer mispronounced that the string is a number.
This is due to the fact that all data returned by the backend is of the string type and our system undergoes conversion 
into Number or Date depending on what is given and the second conversion to the string when displaying
During these type conversions, we could not be sure that the right type is at every stage.
The appearance of an error in production was so severe that we decided to look at static typing.

## TypeScript, Flow?
<img alt="TypeScript, Flow" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/ts-vs-flow.png" />

There are two competitive solutions on the market: Flow and TypeScript
The first comes from Facebook,
it guarantees support for React - the main Ads library on which we based the building of the user interface.
It is not a transpiler, and its only role is to check types. It requires an additional tool eg Babel.

The second solution is TypeScript - a free and open source programming language
created by Microsoft as a superset of JavaScript. It has its own transpiler, which converts to the JavaScript code.

Both solutions are supported by popular integrated development environments, eg WebStorm, NetBeans or Eclipse.
Big companies that guarantee development develop behind them.
Also at the basic level provide similar functionalities
(data type checking, creation of a non-standard type, specification of parameters and return values).
However, TypeScript is more popular, has a larger community and better-described documentation.
In the end, it was his choice.
<img alt="Npm trends" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/npm-trends.png" />

## Migration
We have begun the process of migrating "old" to "new", and it was not a simple task.
The problem appeared at the beginning,
when in one task the file for ts was rewritten and as part of a separate task its original equivalent was changed,
which was still in js.
On the one hand, a new ts file was created, on the other hand,
the old js file was updated with new functionalities and this situation caused a conflict that is difficult to solve.
Therefore, during the interim stage, special vigilance was required.

However, we have not decided to rewrite everything.
We adopted the principle that we do not migrate all current code to TypeScript, only the main functionalities.
However, each new class is created in a new, statically typed way.
Thanks to that we managed to achieve more than half of 1500 files in ts.

<img alt="Ts files" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/ts-files.png" />

<img alt="Js files" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/js-files.png" />

## Complication of the project
TypeScript introduces a lot of new syntax elements and some of them, eg generic types, intensive ones used,
have increased the complexity of the code.
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

Looking at the above code, developers who did not have experience in this technology felt uncomfortable.
With the development of their knowledge, the above record ceased to scare
and even encouraged them to experiment and seek improvement.

## IDE support
An additional motivation is very good IDE support which will detect and notify you about any incorrect use of the code.
Webstorm recognized *.ts files provides support for completing keywords, variables and parameters.
Marks and highlights errors, suggests how to solve them. Ensures compilation of JavaScript's TypeScript on the fly.

<img alt="Ts files" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/compiling.png" />
<img alt="Js files" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/autocomplete.png" />

## Problem with Immutable.js
Before the TypeScript era, our data structures were based on the Record class from the Immutable.js library.

```javascript
export class KeywordPhrasesModel extends Record({
    additionalKeywords: List(),
    requiredPhrases: List(),
    forbiddenPhrases: List()
}) {

}
```

After switching to TypeScript, it turned out that the library does not have good support for the Record class.

<img alt="Js files" src="/img/articles/2019-03-15-why-did-allegro-ads-choose-typescript/error.png" />

We decided on a different solution based on the aforementioned Model class and the use of readonly keywords.
From now, TypeScript takes care of the non-mutability,
but this method does not work when the class is used outside of TypeScript.

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

## When to use?
* The project is large and complicated. Data goes through many layers.
* The team is familiar with TypeScript, has experience in other statically typed languages ​​or is motivated to learn.
* Other libraries suggest its use, e.g. Angular 2.

## When to avoid?
* The project is small or has no complicated structure.
* You care about the maximum capacity and size of the package.

## Summary
There were doubts whether such a great change makes sense in a situation of continuous product development.
We were wondering if the additional overhead for writing a strong typing would be profitable for us.
An additional charge for learning a new language did not arouse the enthusiasm of the Product Owner ;-).

We took a risk and it was a good decision. We are currently delighted with TypeScript.
We gained knowledge how to use it and the technology itself has improved the security of applications.
Situations in which projection errors occur are already captured at the coding stage.
Even in such a large and mature product as Allegro Ads static typing turned out to be achievable and worth investing.
