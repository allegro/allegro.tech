---
layout: post
title: Understanding accessibility
author: [rafal.guzniczak, katarzyna.malecka]
tags: [tech, accessibility]
---

The group that you could help is huge. [The Polish Association of the Blind](https://pzn.org.pl/) reports that there are more 
than 3 million people in Poland with visual impairment and 42 thousand with complete blindness (based on official, national 
statistical data of 2016 - not so fresh; still, it is not better in 2020, so...). These numbers do not include people with other problems, 
for example, those resulting from severe sickness, with movement disabilities, or with learning problems, older or just foreigners,
who are not fluent with the language. All of them, and many more, are not able to use digital products the way people without disabilities do. 

And still, with that massive group of possible users (and potential customers), there are not many digital products — websites, 
mobile apps — that could be used without the struggle. Just imagine: these people want to surf, to buy online, to listen to something, 
or just to get news, that they use the software even if it almost hurts. It is like using a website 
with twenty pop-ups coming up before you can click order... Oh wait, something like this actually happened when the GDPR became law :)
It was not pleasant to use, right? Think now about disabled people and their every day. And also, know this: it is not THAT hard 
to improve the software to be accessible. It is just a matter of some amount of work and empathy.

For those who would like to get to know more about the accessibility of digital products, there is ready-to-go documentation: [WCAG](https://www.w3.org/TR/WCAG21/). 
It is crucial to remember, though:
- it is not a brand new, fancy guide what technology is the best and more accessible or how exactly to implement improvements. 
It is a guide but filled with examples shown in a general way. You can use it no matter what technology you use. 
It is an advantage, and disadvantage of this documentation, as it is not full of ready-to-use solutions;
- it is official documentation (and ISO norm also), so you bet it is not so easy to get through all examples and descriptions. 
As with all formal documentation, sometimes while reading, you could feel a huge desire to just run away from it. 
Be brave (and read further this article, as Rafał prepared excellent instruction on how to use WCAG in your everyday work - check the text below);

Just try it and go improve your code to be accessible!

## The four layers of guidance (WCAG)

WCAG documentation can be overwhelming and hard to read from cover to cover. If it’s your first approach take a look at the table of contents in WCAG 2.1 first. 
This should help you to get to know the documentation better and how it is structured. You probably noticed that the top level of WCAG 2 
consists of four principles. Each contains one or more guidelines which then delve into the criteria of success. Let’s take a closer look at each.

### Four key principles (POUR)

The four guiding principles of accessibility in WCAG 2 are that your site should be:
- Perceivable - information and user interfaces must be presentable to users in ways they can perceive, 
- Operable - the user must be able to navigate the content and be able to make use of all its features, 
- Understandable - the content must be understandable to its users but also functionality of web content must be understandable as well. 
- Robust - the content must be accessible by a wide variety of user agents. It should keep up with new technologies and new methods 
of access for example shift from PC to mobile devices.

Those principles not only organize guidelines in groups but they also allow you to better understand them. 
Each policy addresses one or more types of disability. Take a look at the picture below (there is also 
alternative text according to guideline [1.1 Text Alternatives](https://www.w3.org/TR/WCAG21/#text-alternatives) 🙂).

<img alt="Illustration shows the association of four principles with types of disabilities" aria-describedby="pour-description" src="/img/articles/2020-01-21-understanding-accessibility/pour.png">
<span id="pour-description" style="clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px;">
    Hand drawn computer illustration. At the top there are four icons symbolizing dysfunctions with captions: vision,
    hearing, motor and cognitation. Four principles are listed below: perceivable, operable, understable and robust. 
    Each of them are connected to the dysfunction it addresses with arrows. Perceivable is pointing to vision and hearing. 
    Operable is pointing to motor. Understable is pointing to cognition and robust principle is pointing to motor and cognition disfunction. 
    The content of the illustration is on an orange background.
</span>
*Illustration by Katarzyna Małecka*

Take a look how this picture looks in code. I used `aria-describedby` to associate the image with its description and also provided alternative text in the `alt` attribute to shortly describe what the picture shows. Last but not least, styles. They are responsible for hiding this element visually but still it remains visible to screen readers. 
You can read more about hiding content on [Scott's blog](https://www.scottohara.me/blog/2017/04/14/inclusively-hidden.html).
```html
<img alt="Illustration shows the association of four principles with types of disabilities" aria-describedby="pour-description" src="pour.png">
<span id="pour-description" style="clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px;">
    Hand drawn computer illustration. At the top there are four icons symbolizing dysfunctions with captions: vision,
    hearing, motor and cognitation. Four principles are listed below: perceivable, operable, understable and robust. 
    Each of them are connected to the dysfunction it addresses with arrows. Perceivable is pointing to vision and hearing. 
    Operable is pointing to motor. Understable is pointing to cognition and robust principle is pointing to motor and cognition disfunction. 
    The content of the illustration is on an orange background.
</span>
```

### Guidelines (1.1 to 4.1)

Following only 4 principles may not be enough to make our content accessible or at least it can be really difficult because they are too general. 
That's why there are further 12 guidelines which describe what to do to make content accessible by as many people as possible. 
Some of them speak for themselves like guidelines [2.1 Keyboard Accessible](https://www.w3.org/TR/WCAG21/#keyboard-accessible) or [2.4 Navigable](https://www.w3.org/TR/WCAG21/#navigable). 
For others, we need to look deeper into success criteria. 

### Success criteria (levels A to AAA)

Under each guideline there are rules that describe specifically what we have to do in order to meet the requirements. 
So if you are not sure what the guidelines are saying just dive into their success criteria - it will certainly brighten the matter. 
They are written as testable criteria so you can easily check if your content satisfies them. 
To conform to WCAG 2.1 you need to satisfy all success criteria which means there should be no content violating any of them. 

#### Conformance levels

In WCAG 2 there are three levels of conformance for success criteria: A, AA and AAA. However, it should be noted, 
that they are all important, none are just “nice-to-have”. You can think about levels as the ratio of value 
(for the users) to effort (implementation).
Let’s see what each level means:
- **Level A** are usually the easiest to implement and they have the highest impact for a wide group of users. 
Those success criteria are fundamental so if they aren’t met your content will not be accessible for people using assistive technology at all. 
For example success criterion [2.1.1 Keyboard](https://www.w3.org/TR/WCAG21/#keyboard) which requires content to be operable through the keyboard in addition to the mouse.
- **Level AA** impact a smaller group of users but they bring a lot of value to them. Some of AA criteria may be trickier to implement but this is not a rule. 
For instance, success criterion [2.4.6 Headings and Labels](https://www.w3.org/TR/WCAG21/#headings-and-labels) shouldn’t be that hard to conform to, right? 
AA level can also affect the design of the content and presentation (contrast, text spacing, visible focus etc.). If you are not sure where to start with accessibility, AA should be your baseline.
- **Level AAA** is focused on very specific user populations and it can be difficult and expensive to implement. 
Also, it isn't applicable to all web content. For example in order to comply with [1.2.6 Sign Language](https://www.w3.org/TR/WCAG21/#sign-language-prerecorded) you should provide a sign language interpretation for audio content.

To be compliant with a specific conformance level you must meet the requirements of that level and all levels below it. 

#### Understanding success criteria

Success criteria are sometimes very short and additional context could be useful. No worries! 
Each criterion is provided with an accompanying link to understand it. On the page it leads to you can find success criterion’s intent, 
who will benefit from this change and how the success criterion can be met, links to related resources, examples of uses and techniques. 
An example can be found at [Understanding Success Criterion 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html). 

### Summary

You should remember that these are only guidelines that should not be applied thoughtlessly, just to adapt to the standard. 
On the other hand, the recipient of our activities is a human being, so it's also good to be guided by empathy and common sense in implementing WCAG. 
Give yourself time to learn WCAG documentation. It may take a while but we can say - it's totally worth all the effort!

WCAG documentation is not the only source of knowledge on this topic.
There are plenty of blogs on the web that raise this matter or online courses which will help you gain the required knowledge 
about accessibility, like [Introduction to Web Accessibility](https://www.edx.org/course/web-accessibility-introduction) by W3Cx. You should definitely take a look.

#### Sources
We also recommend further reading. :)
- [Details about blindness and vision impairment by WHO](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment)
- [Accessible Website Design Information](https://www.disabled-world.com/disability/accessibility/websitedesign/)
- [Vision Disability: Types, News and Information](https://www.disabled-world.com/disability/types/vision/)
- [How apple cares about accessibility](https://www.apple.com/lae/accessibility/)

### Note
This article was written in cooperation between Allegro and iTaxi. The IT team shared case studies and tips & tricks regarding 
accessibility issues and how to solve problems to simplify the experience for blind users.

#### About iTaxi
iTaxi is a platform that connects passengers and cab drivers (like FreeNow, Lyft, Uber or Bolt). 
It is based in Poland and has a significant market share. The mobile application for passengers was 
redesigned in January of 2018, and then at the end of 2019 - regarding the user experience and accessibility improvements, 
as well as launching new services. The team of user experience designers, developers, testers prepared some tips
on the topic of accessibility of the software together with the Allegro team.

#### About Allegro
Allegro is the #1 online shopping destination in Poland and the #6 eTail business in Europe. Started in 1999, today it is one of the most recognised brands in Poland. 
You can read more about our tech stack on our [About Us page](https://allegro.tech/about-us/).