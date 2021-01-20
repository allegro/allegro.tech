---
layout: post
title: The power of kata
author: krzysztof.wedrowicz
tags: [craftsmanship, codekata]
---

Every day, many developers of enterprise systems have to face complex problems for which incorrect solutions often end with a loss of enormous amounts of money.
That’s why they constantly learn new paradigms, frameworks, tools, read books and broaden their knowledge in technical conferences.
It’s a lot of time and effort! All this dedication is on behalf of creating a high-quality product — but what is the result?
Obviously it depends (as every software architect would say), but too many times the result isn’t the best.
It takes a while, has got too many errors, often the code quality isn’t high…
And let’s better not mention testing. Why is all this happening then?
Everyone does their best, spends additional time on learning, so what exactly is missing?
The answer is quite straightforward - constant practicing.
Let’s say a few words about “code kata” which can make a remedy for the mentioned problems.

### The secret recipe
The term was coined by Dave Thomas (author of The Pragmatic Programmer book, DRY acronym and The Manifesto for Agile Software Development).
All this is about is an attempt at transferring practice done by artists or sportsmen into the world of software development.
The key idea is to find time for regular practice sessions that are not connected with our professional projects.
There are a few things worth remembering to make such a session worthwhile and productive:

* __Exercitation without interruptions.__
It’s hard to stay creative when something is disrupting you, so endeavor to adjust the time and place so that you can work without distraction.
* __One simple thing to try.__
You should be able to easily complete your task during one short session (30-40 minutes or so), without being forced to hurry.
* __Repeat your task.__
Iterate during subsequent sessions multiple times until you achieve a quality solution.
* __It’s OK to err.__
Remember that no money is wasted if you go wrong — thanks to it you have the possibility to stay much more open-minded.
Remember that learning in favorable conditions is easier, too!
* __Glean some opinions.__
After finishing the kata it’s worth asking for feedback on what you can do better when trying next time.
* __Don’t focus on closing out.__
The process of practicing itself is much more important than the goal of completing your task.
* __Make fun of it.__
It’s the last, but most likely the prime advice — if such a session is another duty for you, it’s a royal road to giving up very quickly.

The subject of the task doesn’t really matter:
you can invent your own challenge each time or use plenty of ready concepts from the Internet — to name only a few sources:
* [codekata](http://codekata.com/) by Dave Thomas,
* [codewars](https://www.codewars.com/),
* [guvi](https://www.guvi.in/code-kata).

### Find Your Why
Personally, I think that learning from real-life cases is quite a reliable and convincing way of verifying a statement.
Let me introduce you to one of my practicing experiences and a few benefits I achieved from regularly doing code kata.

The concept of kata is not new to me but I’ve had a long break from coding exercises I used to do in the past.
Life abhors a vacuum — finding half an hour for concentration is not so easy for me now.
However: some time ago my team was integrating a big external platform with Allegro.
Lots of designing, refinements, meetings… All this in order to connect two disparate worlds.
Such complexity often causes concerns about making mistakes in convoluted processes which would be hard to debug in the future.
To avoid them the workflow is often slowed, which makes me feel unproductive and unsatisfied with the quality of my work.

One day I came up with the idea of going back to regular code kata sessions.
Because I’m a dad of a toddler who takes almost all of my time after work I decided to focus on sessions as soon as he falls asleep.
The first few days were hard, but now I use to practice around 3-4 times a week.
For now, I mostly pick some ideas from http://codekata.com/ in order to save time on thinking about what can be done today.

Thanks to total freedom of choosing what to train, I chose different issues each day. Once I decided to compare JVM test frameworks for Kotlin (jUnit, Spek, Kotest, Spock) —
each following day my choice fell on binary search in a different way using another testing framework.
Another day I tried to implement Bloom filters using different approaches and to find out which one was the fastest.
I was quite certain that the approach based on bit operators would win and was really surprised when it occurred to me it was the slowest one.
After a moment of investigation I found out that this result came from a mistake in algorithm design.
I used one BigInteger variable to store the whole Bloom filter and forgot about BigInteger’s immutability:
in each operation, I created one or more new objects — a curse of immutability in terms of performance.
Yet another day I found a task concerning the calculation of LOC metric for Java files.
Below you can see the sources from first and second attempt.
As you see they are completely different — I believe that it's the point of doing the same kata during multiple sessions.
The exercise itself (when you experiment and learn new things) is much more important than result details.

Day 1:
```kotlin
package me.wedrowicz.codekata.countingcodelines.day1

import java.net.URL

fun countLinesOfCode(url: URL): Int {
    val text = url.readText()
    var loc = 0
    var countedCharsInThisLine = 0
    var quotes = false
    var i = 0

    val whitespaces = listOf(' ')

    while (i < text.length) {
        if (text[i] == '"') {
            quotes = !quotes
            i++
            continue
        }

        if (text[i] == '/' && text[i + 1] == '*' && !quotes) {
            i += 2
            while (!(text[i] == '*' && text[i + 1] == '/')) {
                i++
            }
            i += 2
            continue
        }

        if (text[i] == '/' && text[i + 1] == '/' && !quotes) {
            while (text[i] != '\n') {
                i++
            }
            continue
        }

        if (text[i] == '\n') {
            if (countedCharsInThisLine > 0) {
                loc++
                countedCharsInThisLine = 0
            }
            i++
            continue
        }

        if (!whitespaces.contains(text[i])) {
            countedCharsInThisLine++
        }
        i++
    }

    return loc
}
```

Day 2:
```kotlin
package me.wedrowicz.codekata.countingcodelines.day2

import java.net.URL
import kotlin.text.RegexOption.DOT_MATCHES_ALL

fun countLinesOfCode(url: URL): Int = url.readText().trimComments().trimEmptyLines().countLines()

private fun String.trimComments() = """//[^\n]*|/\*.*?\*/|(".*?")""".toRegex(DOT_MATCHES_ALL).replace(this, "$1")
private fun String.trimEmptyLines() = """\n\s*\n""".toRegex().replace(this, "\n").trim()
private fun String.countLines() = this.count { it == '\n' } + 1
```
In this challenge, I learned a lot about regex when earlier I never had enough time and/or motivation to dive deep into this subject.
Be honest with yourself: have you ever studied regex groups, capturing or flags rather than searching the Internet for the complete solution?
It gave me lots of satisfaction when I finally understood it after all these years of coding.
And last but not least — you can try many different puzzles just to have fun from creating compelling things from very basic concepts.
As an example, here you can find a kata concerning a book generator based on a few titles already written.
Perhaps you think it’s quite tough (in fact when you delve in, it really is) but you can start from really simple concepts that can give you rewarding results even at the very beginning.
For example, using trigrams (sequences of three words) you can prepare a map where the first two words are a key and the last goes to the list of values.
You can randomly choose the first two words from any text, e.g. the content of your favorite books — and that’s everything you need to start generating a new title using mapped trigrams.
And it’s only the beginning of good text generation.
It’s already enough to create a whole new book, some parts of which really have semantic sense!

Having fun, learning new things and making different experiences have really big value on their own but what really rocks, is the automation of work and thinking.
Introducing katas helped me to change the mindset from treating a particular problem as complicated to just starting the work on it
(as TDD rule follows: unit tests -> development -> integration tests) without overthinking the problem.
This way not only increases my productivity, but furthermore the whole work goes faster with overall better quality.
Just to sum up, as you can see, this is another case showing that in software development practice is the key to success.
Solving katas in a favorable environment helps you craft much better software in the enterprise world.
Reserving 30 minutes per day can be hard, but if you are not convinced that this self-sacrifice is worth it, just give it a few days and decide.
At worst, you risk losing a few hours of your spare time — otherwise, maybe your work satisfaction will skyrocket. Fingers crossed!

### Conclusion
The whole article considers katas in Dave Thomas’s perspective.
But, in my view, the benefits would be very similar independently of the form of practicing.
I would love to hear from you if you have ever tried some kind of small coding challenges or what your concept of daily exercising your developer skills is.
Please share in the comments below and help others to stay inspired to take their skills to a higher level!

