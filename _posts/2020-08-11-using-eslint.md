---
layout: post
title: Using ESLint to improve your app’s performance
author: [pawel.wolak]
tags: [eslint, performance, webperf, javascript, frontend]
---

Let me start with a story. Once upon a time I stumbled upon an excellent
[article by Philip Walton](https://philipwalton.com/articles/idle-until-urgent/) where he describes how expensive
script evaluations could (and should!) be deferred until the browser is idle or they are actually needed. One of the
examples that awakened my interest was creating an instance of the `Intl.DateTimeFormat` object, as I was using this
great API quite often but never thought it can cause real performance problems. Turns out it can, especially if
[used inside loops](https://github.com/formatjs/formatjs/issues/27#issuecomment-61148808). Apart from the technique
described in Philip’s article, another solution is to simply reuse `Intl.DateTimeFormat` instances instead of creating
them every time.

And that’s what I always did out of force of habit — if I need something again, why not keep a reference to it instead
of adding garbage collector more work? But my curiosity told me to search through our git repository and as a result I
discovered multiple usages of `Intl.DateTimeFormat` without caching, some of which were inside loops, possibly leading
to performance problems. After I informed responsible teams and shared my discovery on our company-wide frontend chat,
one of my colleagues suggested that we should prevent similar issues in the future by writing an ESLint rule. I have
never done that so I eagerly took this opportunity to learn something new.

For those who don’t know, ESLint is a very popular Javascript linter (a tool used to enforce certain code style), with
various applications: mainly error prevention and consistent formatting. Although sometimes it can be annoying
(imagine doing a quick fix and finding out that the line you have changed exceeds maximum length), it adds great value
to every Javascript application. One of its key features is the possibility of writing additional rules, which thanks
to the open source culture led to many useful projects like
[eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react) or
[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint).

At Allegro we have our own sets of rules, one of which is enabled by default in every
[Opbox component]({% post_url 2016-03-12-Managing-Frontend-in-the-microservices-architecture %}). It contains
mostly performance-oriented suggestions like:
* avoid bloated libraries (eg. [lodash](https://lodash.com/), [moment](https://momentjs.com/)) and use lighter
alternatives (eg. [nanoutils](https://nanoutils.github.io/), [date-fns](https://date-fns.org/)),
* when using optional chaining consider its
[impact on bundle size]({% post_url 2019-11-08-performance-of-javascript-optional-chaining %}).

My task was to extend this set of rules to prevent calling `format(...)` method on `Intl.DateTimeFormat` instance
immediately after creating it:

```javascript
// good
const formatter = new Intl.DateTimeFormat('en-US');
formatter.format(new Date());

// bad
new Intl.DateTimeFormat('en-US').format(new Date());
```

In short, ESlint works by traversing an AST (abstract syntax tree) representation of the code and applying given rules
whenever it matches their pattern (and by the way
[this is also how Babel works](https://www.youtube.com/watch?v=fntd0sPMOtQ)). In order to create a rule we need to
take a look at
[bad code’s AST](https://astexplorer.net/#/gist/743d094bf4fb23aed76b86e9e5864bd4/07819291b22601e99c31420a5df4858873faaf9b)
and try to make a pattern out of it:

```json
{
  "type": "Program",
  "start": 0,
  "end": 52,
  "body": [
    {
      "type": "ExpressionStatement",
      "start": 0,
      "end": 52,
      "expression": {
        "type": "CallExpression",
        "start": 0,
        "end": 51,
        "callee": {
          "type": "MemberExpression",
          "start": 0,
          "end": 39,
          "object": {
            "type": "NewExpression",
            "start": 0,
            "end": 32,
            "callee": {
              "type": "MemberExpression",
              "start": 4,
              "end": 23,
              "object": {
                "type": "Identifier",
                "start": 4,
                "end": 8,
                "name": "Intl"
              },
              "property": {
                "type": "Identifier",
                "start": 9,
                "end": 23,
                "name": "DateTimeFormat"
              },
              "computed": false
            },
            "arguments": [
              {
                "type": "Literal",
                "start": 24,
                "end": 31,
                "value": "en-US",
                "raw": "'en-US'"
              }
            ]
          },
          "property": {
            "type": "Identifier",
            "start": 33,
            "end": 39,
            "name": "format"
          },
          "computed": false
        },
        "arguments": [
          {
            "type": "NewExpression",
            "start": 40,
            "end": 50,
            "callee": {
              "type": "Identifier",
              "start": 44,
              "end": 48,
              "name": "Date"
            },
            "arguments": []
          }
        ]
      }
    }
  ],
  "sourceType": "module"
}
```

After looking at more examples of usage, we can deduct that we are looking for a node:
* of type `MemberExpression` (because we want to prevent directly accessing members of a new instance),
* with `object.type` equal `NewExpression` and `object.callee.object.name` equal `Intl` (because we want to apply our
rule only to new instances of Intl members)

We could be more specific about the second point but we want to also cover other `Intl` utilities like
`Intl.NumberFormat`, `Intl.Collator` and so on.

Using [pathEq](https://nanoutils.github.io/docs/methods.html#patheq) from nanoutils for null-safety the complete code
looks like this:

```javascript
const { pathEq } = require('nanoutils');

// does node.object.callee.object.name equal 'Intl'?
function isIntlApi(node) {
  return pathEq(['object', 'callee', 'object', 'name'], 'Intl', node);
}

// does node.object.type equal 'NewExpression'?
function isInstanceCreation(node) {
  return pathEq(['object', 'type'], 'NewExpression', node);
}

module.exports = {
  create(context) {
    return {
      // we are looking only for MemberExpressions
      MemberExpression: (node) => {
        if (isIntlApi(node) && isInstanceCreation(node)) {
          context.report(node, 'Intl object instances are expensive, consider reusing them.');
        }
      },
    };
  },
};
```

Finally, we should add some tests to verify that we didn’t miss any cases. Then we can include the rule in our eslint
config and we are ready to go! I hope this post will encourage you to play a little bit with ESLint/Babel and AST.
