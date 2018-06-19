---
layout: post
title: Scrum-ban applied
author: marcin.konkel
tags: [agile, scrum, kanban, scrum-ban, scrum master, coach]
---

This is a story about a Team working in Scrum that wanted to turn to Kanban and ended up, deliberately, working in something resembling
Scrum-ban. Scrum-ban basics can be found in [Wikipedia](http://en.wikipedia.org/wiki/Scrumban). We did not follow all of them.

The story started when a project with a fixed deadline lasting a few months was given to the Team. After a few months of
working in Scrum and having more and more technical user stories to complete, Product Owner suggested that we switch
to Kanban as we were not able to deliver working software in the subsequent iterations and that we concentrate on delivering more
stuff — compared to the previous setup.

### The deal

And so we did. We started with getting to know what [Kanban](http://en.wikipedia.org/wiki/Kanban) meant to each of us so we could establish a mutual
understanding. Some of the thoughts were: higher flexibility in terms of our approach to work, Work In Progress (WIP)
limitations on Kanban board, delivering value faster for the Client, focusing on tasks rather than time-boxes or
scope and, last but not least, Kanban being a perfect complement to Scrum. WIPs are limiting the maximum user stories that
can be in a particular state like “In testing”, “In Review” and so on.

Secondly, we discussed why we wanted to move to Kanban. Team’s answers were: we don’t have to think how much we have
to burn, increasing our velocity (hypothesis), reducing overhead, less time spent for a task in a particular state
(thanks to “work in progress” limits), increased flexibility. Having said that, the penultimate step was to create
rules based on which we were going to operate.

We did not want to give up some of the events that were present in Scrum hence our rules of engagement were:

* Continuing on daily Refinement (45'), Daily Scrum (15') and weekly Retrospective (45') events.
* Developer who changed the story status to “Deployed” makes contact with stakeholders asking for feedback — instead
of doing it during the review. Verifying certain tasks with stakeholders / final software users and tasks whose results were not
directly accessible to end users (e.g. technical changes, deployment) with Product Owner.
* If feedback is positive (meaning no bugs were detected) — story is moved to “Done”. In case one or more bugs were found
they were fixed on the spot without much delay.
* Setting WIP limits to tasks in each status. One thing we’ve changed was to set a limit to two stories (not tasks) in
“To Deploy” as there is no sense to deploy them one by one but as a bulk (in this case-a story).

Many of the above points were already happening when using Scrum. What changed for us was setting up WIP limits, the way of contacting
stakeholders right after completing a particular task and asking for verification. As you can
see we abandoned Planning and Review. Stakeholders were to be contacted after completion of each task and PO was to
prioritise backlog elements so that we could take those that are highest in the backlog. The Team has amended its DoD ([Definition of Done](http://guide.agilealliance.org/guide/definition-of-done.html)) with the requirement that each story should be accepted by one of
our stakeholders. All of the above has led us to Scrum-ban kind of approach.

The last step was establishing the acceptance criteria for this experiment:

* **Increased velocity** in comparison to average velocity from last three sprints.
* **Positive feedback** from our stakeholders about the new way of working.
* Subjective “**happiness**” of Team members.

These rules were in conjunction with one another meaning that all must happen together  for us to consider this experiment a success.
Additionally, we agreed on checkpoints, being part of retrospective, happening at the end of each week so we could quickly
verify if something had gone bad. The experiment was to last two weeks — same length as our previous Scrum sprints.

### First two weeks

We established that we were going to verify how we are doing after a week and to decide according to our criteria if we were to
continue after two weeks time. After inspecting our process for the first time (after a week), not much had happened. The
Team has taken two larger tasks and was working on them since the beginning. It was hard to assess the velocity as not much
had happened yet. We agreed to continue.

In two weeks, the moment we’d all been waiting for (sort of) happened. We were to answer the question “Where are we
going with this?” thus we started checking:

* **Happiness** — the Team preferred to work that way, there was a bit looser atmosphere and less time spent on planning (PO was
organising and prioritising the backlog so it reflected what was to be done) and trying to complete an increment in a given time.
The Team felt it could come up with a better value for money, a more tweaked version of the task.
* **Feedback** — our stakeholders were pleased with the changes. The Team was more responsive and had more time to answer all queries
faster. Stakeholders were saying that they could test what was done on a regular basis and provide comments right away as opposed to
waiting for a Review.
* **Velocity** — we burned zero story points. This was according to Jira which was not up to date so the flow on our physical
board was saying one thing and Jira was saying something else. After a few calculations we ended up with a value being half of
what we were ‘burning’ earlier. Bummer you might think.
This was a hard choice due to the fact that the two first criteria were met really well. Still the velocity was down. After
many discussions and listing all the problems we decided to give it a try for another two weeks but with some amendments
to our flow keeping the same success criteria. The major issues we noticed were concerning **context switching** or some **flow
disturbances** relating to discrepancies between our physical kanban board and Jira. We tackled both with **pair programming
for tasks >1day** and conducting **daily meetings in front Jira** instead of the board.

Our third conclusion was **lack of commitment when the work is going to be done**. This was one of the differences between true
Scrum-ban and our approach. Where possible we agreed that we should **commit to when we estimate the task is going to be
complete**. We wanted to avoid too loose working atmosphere and to turn up the velocity a bit. Additionally, we placed
emphasis on informing each other about wrong estimates or delays (doh!) when working on them.

### Second two weeks — so now what?

We met on our retrospective meeting, after a month-long experiment, summing up the work and for inspect & adapt.

![burndown](/img/articles/2015-08-scrum-ban-applied/scrum-ban-applied-burndown.png)

The above burn-down chart symbolises Team’s performance from the beginning of the experiment. First two weeks were not great.
There was a lot of context switching, people going on holidays and one large story (13sp) that we were doing for almost the
whole time. We burned 18 story points (sp) in total for that period. Last two weeks were much better, we managed to complete what we'd
started and completed a few other, smaller tasks ending with tasks completed that accounted for 54 sp.

As for our problems that we indicated during second checkpoint there were no delays or wrong estimates and we did not
commit for each story undertaken on the sprint. Product Owner was fine with that as he asked questions during daily, if necessary,
or when he saw that a particular task was crucial for stakeholders. We did start to work in Jira only abandoning our physical
Scrum board for the time being. Pair programming for tasks longer than 1 day did not happen as well — too many team members were
on holidays so it did not make sense. We are keeping this technique for future reference to use it when it becomes easier to
make some conclusions.

Up till our final day of experiment we burned 72 story points — most of them in the second, two-week iteration. This gives an
average of 18 storypoints (sp) per week or 36 sp per two weeks. Below you can see our previous Scrum-only sprints.

![story points](/img/articles/2015-08-scrum-ban-applied/scrum-ban-applied-storypoints.png)

As can be seen above, stories were burned quite irregularly. Average from last three sprints was 18.67 sp and 22 from
last six sprints that happened over 3 months prior to the experiment.

Taking this into consideration, as well as our happiness and feedback from our stakeholders we decided to continue on
daily basis up till our formal deadline.

### What we've learned

We agreed that the experiment with our mix of Scrum and Kanban was successful. We inspected & adapted along
the way and learned new stuff. There were also things we should do but didn’t and some elements we need to pay
attention to in the future. We are also continuing to work this way till the end of the project.

One of the things we should do but didn’t was to **inform stakeholders earlier** and ask if they are ready for such a change.
Here the switchover was simple and enhanced their experience. Nevertheless, there might be something we missed thus
the importance of an earlier dialogue. Also a regular “**checkpoint newsletter**”, right from the start, would be convenient
for them to catch-up with our work and see the results within the timebox. Our Product Owner is going to undertake
this from now on. Additionally, we plan to hold a **review** for our stakeholders to recap the work from last month and make
further decisions about product clear.

Another risk, not directly connected with Scrum-ban, was **larger stories** (for us 13 sp and above). They were often completed
within one sprint (2 weeks) and in Scrum-ban it could take even longer as there was no fixed review date. We decided to split
them to smaller pieces of 8 sp or less. As we don’t want to give up on stories carrying business value for our end user
we are going to search for an optimal solution during next refinement when a 13 sp story will be groomed and come up with
several variants on how to complete it.

**A thing or two to reflect upon in the long run** are: how the work fits in a larger picture of what we’re doing? How about the
architecture? Do we know where are we heading? How do we want to work with our backlog if there is no planning event? How can
the team contribute to the work and plans being made? What about our own ideas?

These questions are what we will need to work with when the project comes to an end. Answers to them are found in Scrum but not
necessarily in our version of Scrum-ban.

We hope the conclusions from our experiment can be helpful for others, too. It would be great if you can share your thoughts or
any other experiments of your own with Scrum-ban.
