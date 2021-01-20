---
layout: post
title: The Agile Testing Days Conference - Potsdam 2016
author: michal.duleba
tags: [conference, testing, QA, agile]
---

Last year [Agile Testing Days Conference](https://agiletestingdays.com/) was held between 6th and 8th December in Potsdam, Germany. 
According to statistics provided by organizers there were around 600 attendants and about 30 speakers in keynotes / workshops. 
During the whole event around 22 different workshops took place, 9 keynotes
and around 30 other speeches / presentations divided into 7 parallel tracks. 
I had the opportunity to attend the first two days of the conference and in
this article I’d like to share with you a short review of the most
interesting sessions and my impressions about the event.

### Lectures

The first keynote of the conference was *"Pushing the edge on what’s possible"* conducted by Abby Fichtner. 
Abby says about herself that she is *"a software developer by trade, my roots
are a mixture of developing bleeding-edge technology for startups and coaching
teams on how to develop software better"*. 
From my point of view this keynote was an ideal kick-off of the conference -
Abby told us about how in early days she became a hacker in the meaning of
someone who *"…thinks outside of the box, someone that thinks differently than most people do"*. 
Presentation was focused on encouraging the audience to face their fears, to become
more creative and innovative by leaving their comfort zones - all that can help to become a hacker in her opinion. 

Another interesting presentation was *"Continuous Delivery Anti-Patterns"* by
Jeff Morgan - chief technology officer and cofounder of the
[LeanDog](https://www.leandog.com/) initiative.
In this talk Jeff, based on his experience, pointed out several Continuous
Delivery anti-patterns: 

- code branches and merging
- not focused on quality
- no or little test automation
- developers and testers not working together
- defects are acceptable
- working in projects that can limit flexibility

If you are interested, here is a [link](https://www.youtube.com/watch?v=ru1-CYouPjg) to this talk. 

Next lecture I found very interesting was the keynote *"NoEstimates"* by
Vasco Duarte. Vasco as he describes himself is: a Product Manager, a Scrum Master,
a Project Manager, a Director, an Agile Coach working in the software industry since
1997, and an Agile practitioner since 2004.

First thing is that the idea of not having estimates when running software
projects could be shocking for someone who had to estimate a lot during his
career. In the presentation we could find several crisis examples and statistics that
in my opinion prove that agile projects can be easily destroyed by estimating. 
Vasco stated that estimates don’t really work in software industry and could
ruin all value that agile projects should deliver, especially to customers.
Going further, estimations can be actively harmful for the project and even in
many cases for the whole organization. 

Just after the keynote I registered for a free copy of Vasco’s eBook titled "*No
Estimates*" which is available here: [link](http://noestimatesbook.com).  
Below are some of my impressions after reading that book that I hope will encourage you to dig into it.

The book can be treated as a guide which can help us when we want to reduce
uncertainty in software projects or learn how to define, plan and run projects without estimates, what are the best ways for focusing on customers’ values and
finally how the *noestimates* approach can help to manage a project in crisis. 
Vasco gives definitions of terms such as: forecasting, prioritization,
successful project, management of uncertainty, true progress of software
delivery project and if there is a difference between estimates and guessing. 
I can imagine that for many people, even from software industry, allegations like
*"estimates don’t really work"* can be shocking, but reading the book I found
a couple forceful proofs and Laws which I totally agree with. 
Let me cite below two of them:

*"Hofstadler’s Law: It always takes longer than you expect, even when you take
into account Hofstadler’s Law."*

Maybe it sounds funny, but when I think about that statement taking my software development experience into account it is hard not to agree. 
And second, Parkinson’s Law: 

*"Work expands so as to fill the time available for its completion."*,

which is also something what I experienced many times.

The book is dedicated for people who
play different roles in agile or any other projects and find it difficult
to define the level of estimations needed for managing it successfully. 
Vasco proposes the following steps to help them: 

- *Move to story points*: eliminating terms such as "hours" or "days" can give many benefits in his opinion.
- *Stop estimating tasks* and for progress reporting try rather to ask your team about Story progress and if they can finish the task today.
- *Limit the calendar duration of Features and Stories*: you should give one or maximum two days of calendar duration to finish each Story. 
- *Remove so called "planning poker" card options if you use one*. Try to decrease the number of options that you give to your team while giving story points. The goal of this step is to finally ask the simple question: "*Can we get this Story done by tomorrow if we start working on it today?*".
- *Build histograms* which for example can help you keep track of the average duration for Features or Stories.
- *Use the average cycle times for Stories* of different size which can be useful in providing Story-based forecasting.
- *Work with Stories as if they all had the same duration* and count the number of Stories and measure project progress based of how many of them where delivered in the past.

The conclusion that Vasco provides about given above steps is that some steps
will be easy to implement, but when you find some step impossible to implement
you should ask yourself the question "why?". 
In my opinion in many cases these exercises can really help to find hidden
project impediments. If you want to find more useful advice, dig into Vasco’s
book.

Next event I attended to was *"Story and Example Mapping Mashup"*, a workshop conducted by Lisa Crispin and Joellen Carter. 
The main idea of story and example mapping is to map for ea. complicated
software features into a set of right-sized and understood stories. 
From my perspective the main advantages of this technique were: scrum team
members’ engagement in a process and easy identification of the first minimum
valuable product release. 

The last keynote of the first day was *"From Waterfall to Agile, the advantage is clear"* by Grammy awarded Michael "The Wanz" Wansley, author of *"Thrift
Shop"* song. For me it was a pretty stunning presentation, especially because of how
original and a great speaker Michael is. Here is a
[link](https://www.youtube.com/watch?v=5egKHp17LcY) to this keynote. 

Second day of the conference started with the keynote *"Liftoff: Start and Sustain
Successful Agile Teams"* given by [Diana
Larsen](https://futureworksconsulting.com/about/diana-larsen). In her presentation
Diana showed the process of launching the agile team (called "lift off") divided into
three phases: 

- answering the question: "are we ready for launching the agile team?" - it is important to make sure that all expectations toward the team are clarified
- setting learning conditions of team members
- defining a set of attributes that will fit your team's lift off, like: zero sprint, training sessions or retrospective meetings 

One of the Diana’s final conclusion was that *"...an effective liftoff
achieves alignment - a shared understanding about the work and why it matters to the organisation as a whole"*. 

Next talk titled *"Test properly – test properties!"* was held by Vagif
Abilov. His presentation was based on code written in *F#* using *FsCheck* library, but generally the main points apply to various languages and
platforms. 
The idea of testing properties according to Vagif was to shift focus from
treating tests as validating software towards describing behaviors and rules
of tested components. 
Let’s take as an example a function in program code - the approach is to
focus on the properties of this function - attributes that are true of any
correct implementation of it. 
To find more information about this approach please visit: [link](https://fsharpforfunandprofit.com/posts/property-based-testing/). 

The second workshop I took part in was *"Agile Leadership for All"* held by Selena
Delasie. 
According to Selena, the *Agile Leadership* is not about managers or supervisors as
we know, but that every agile team member could be a leader. 
During this interactive workshop the participants worked on 7 leadership traits
defined by Selena: *Class*, *Curiosity*, *Clarity*, *Connection*,
*Creativity*, *Commitment* and *Communication*. This exercise showed how
these traits can be implemented in agile practices. 

The final keynote of the second day was: *"Lessons Learned in (Selling)
Software Testing"* by Keith Klain, who for the last 20 years has built
software quality management and testing teams for global financial services
and IT companies in the US, UK and Asia. 
In this presentation Keith talked about his lessons learned in applying
context-driven testing principles to viable commercial approach. I found it
really interesting, especially the practical aspects of managing test processes in
commercial organizations. 
This presentation is available [here](https://youtu.be/da7bbn4USxE). 

### Conclusions

In my opinion the conference was well organized, both logistically and in terms of
its solid content. 
During the meeting participants could find more events than just lectures and
workshops, such as: *Lean Coffee* sessions, *Opening Sessions*, *Award
Ceremony for the Software Testing European Champions*, *Lightning Talks* or
even private *Christmas Market*! The conference content was well balanced -
equally divided into agile and testing subjects. 
I suppose that some participants could look for more technical aspects like
testing mobile applications, stress testing or some newest frameworks. 
On the other hand, I think that the main goal that promoters of the event had
was to create *"a festival for the agile community"* rather than a purely
technical meeting for developers. 
At this point I have to agree that "Agile Testing Days" is a great place to
meet open-minded and willing to help people from the European tester community and
to share with them knowledge and experience.
