---
layout: post
title: Understanding accessibility
author: [rafal.guzniczak, katarzyna.malecka]
tags: [tech, accessibility]
---

##  Why accessibility is important? 

The group that you could help is huge. [The Polish Association of the Blind](https://pzn.org.pl/) reports that there are more 
than 3 million people in Poland with visual impairment and 42 thousand with complete blindness (based on official, national 
statistical data of 2016 - not so fresh; still, it is not better in 2020, so...). These numbers do not include people with other problems, 
for example, the ones after severe sickness, with movement disabilities, or with learning problems, older or just foreigners,
that are not fluent with the language. All of them, and many more, are not able to use digital products the way people without disabilities. 
And still, with that massive group of possible users (and potential customers), there is not a lot of digital products - websites, 
mobile apps - that could be used without the struggle. Just imagine: these people that much want to surf, to buy online, 
to listen to something, or just to get news, that they use the software even if it almost hurts. It is like using a website
with twenty pop-ups coming up before you can click order... Oh wait, there was something like that when RODO came to power :) 
It was not pleasant to use, right? Think now about disabled people and their every day. And also, know this: it is not THAT hard
to improve the software to be accessible. It is just a matter of some amount of work and empathy.

For those who would like to get to know more about the accessibility of digital products, there is ready-to-go documentation: WCAG. 
It is crucial to remember, though:
- it is not a brand new, fancy guide what technology is the best and more accessible or how exactly to implement improvements. 
It is a guide but filled with examples showed in a general way. You can use it no matter in what technology you programming. 
It is an advantage, and disadvantage of this documentation, as it is not full of copy and paste solutions;
- it is official documentation (and ISO norm also), so you bet it is not so easy to get through all examples and descriptions. 
As all formal documentation, sometimes while reading, you could feel a huge desire to just run away from it. 
Be brave (and read further this article, as Rafał prepared excellent instruction on how to use WCAG in your everyday work);

Just try it and go improve your code to be accessible!

## The four layers of guidance (WCAG)

WCAG documentation can be overwhelming and hard to read from cover to cover. If it’s your first approach take a first look at the table of contents on WCAG 2.1. 
This should help to get to know documentation better and how it is structured. You probably noticed that the top level of WCAG 2 
consists of four principles. Each contains one or more guidelines which then delve into the criteria of success. Let's take a closer look at each.

### Four key principles (POUR)

The four guiding principles of accessibility in WCAG 2 are:
- Perceivable - information and user interfaces must be presentable to users in ways they can perceive, 
- Operable - the user must be able to navigate the content and be able to make use of all its features, 
- Understable - the content must be understandable to its users but also functionality of web content must be understandable as well. 
- Robust - the content must be accessible by a wide variety of user agents. It should keep up with new technologies and new methods 
of access for example shift from PC to mobile devices.

Those principles not only organize guidelines in groups but also they allow you to better understand them. 
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

### Guidelines (1.1 to 4.1)

Following only 4 principles may not be enough to make our content accessible or at least it can be really difficult because they are too general. 
That's why there are 12 guidelines which describe what to do to make content accessible by as many people as possible. 
Some of them speak for themselves like guidelines [2.1 Keyboard Accessible](https://www.w3.org/TR/WCAG21/#keyboard-accessible) or [2.4 Navigable](https://www.w3.org/TR/WCAG21/#navigable). 
For others we need to look deeper into success criteria. 

### Success criteria (levels A to AAA)

Under each guideline there are rules that describe specifically what we have to do to meet the requirements. 
So if you are not sure what guidelines are saying just dive in its success criteria - it will certainly brighten the matter. 
They are written as testable criteria so you can easily check if your content satisfies them. 
To conform to WCAG 2.1 you need to satisfy the success criteria which means there is no content which violates any of them. 

#### Conformance levels

In WCAG 2 there are three levels of conformance for success criteria: A, AA and AAA. However, it should be noted, 
that they are all important, there are no “nice-to-have”. You can think about levels as the ratio of value 
(for the users) to effort (implementation).
Let’s see what each level means:
- **Level A** are usually the easiest to implement and they have the highest impact for a wide group of users. 
Those success criteria are fundamental so if they aren’t met your content will not be accessible for people using assistive technology at all. 
For example success criterion 2.1.1 Keyboard which require content to be operable through keyboard in addition to the mouse.
- **Level AA** impact smaller group of users but they bring a lot of value to them. Some of AA criteria may be trickier to implement but this is not a rule. 
For instance success criterion 2.4.6 Headings and Labels shouldn’t be that hard to conform, right? 
AA levels can also affect the design of the content and presentation (contrast, text spacing, visible focus etc.). If you are not sure where to start with accessibility, AA should be your baseline.
- **Level AAA** are focused on very specific user population and they can be difficult and expensive to implement. 
Also, they are not applicable to all web content for example to compliant with 1.2.6 Sign Language you should provide sign language interpretation for audio content.

To be compliant with a specific conformance level you must meet the requirements of that level and all levels below it. 

#### Understanding success criteria

Success criteria are sometimes very short and an additional context could be useful. No worries! 
Each criterion is provided with an accompanying link to understand it. On this page you can find success criterion’s intent, 
who will benefit from this change and how the success criterion can be met, links to related resources, examples of uses and techniques. 
An example can be found on [Understanding Success Criterion 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html). 

### To sum up

It should be remembered that these are only guidelines that should not be applied thoughtlessly, just to adapt to the standard. 
On the other side, the recipient of our activities is a human being, so it's also good to be guided by empathy and common sense in implementing WCAG. 
Give yourself time to learn WCAG documentation. It may take a while but we can say - it's totally worth all the effort!

WCAG documentation is not only one source of knowledge on this topic.
There are plenty of blogs on the web that raise this matter or online courses which will help you gain the required knowledge
about accessibility like Introduction to Web Accessibility by W3Cx, you should definitely take a look. 
We also recommend further reading. :) Links you can find in the Sources section below. 

#### Sources
https://www.w3.org/WAI/standards-guidelines/wcag/

https://www.apple.com/lae/accessibility/

https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment

https://www.disabled-world.com/disability/accessibility/websitedesign/

https://www.disabled-world.com/disability/types/vision/

### Note
The article was written in cooperation with iTaxi. The IT team shared case studies and tips & tricks regarding 
accessibility issues and how to solve problems to simplify the experience for blind users.

#### About iTaxi:
iTaxi is a platform that connects passengers and cab drivers (like FreeNow, Lyft, Uber or Bolt). 
It is a company that is based in Poland and has a significant market share. The mobile application for passengers was 
redesigned in January of 2018, and then at the end of 2019 - regarding the user experience and accessibility improvements, 
as well as launching new services. The team of user experience designers, developers, testers prepared some tips
on the topic of accessibility of the software together with the Allegro team.