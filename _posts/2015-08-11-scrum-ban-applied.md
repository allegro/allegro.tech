---
layout: post
title: Scrum-ban applied
author: marcin.konkel
tags: [scrum, kanban, scrum-ban, agile, scrum master]
---

A story about a Team working in Scrum that wanted to turn to Kanban and ended up, deliberately, working in (somewhat)
Scrum-ban. Scrum-ban basics can be found on [Wikipedia](https://en.wikipedia.org/wiki/Scrumban). We did not follow all of them.

The story started when a project with a fixed deadline lasting a few months was given to the Team. After a few months of
working in Scrum and having more and more technical user stories to complete Product Owner had suggested that we switch
to Kanban as we are not able to deliver working software in the subsequent iterations and concentrate on delivering more
stuff — compared to the previous setup.

###The deal

And so we did. We’ve started from getting to know what Kanban means to each of us so we could establish a mutual
understanding. Some of the thoughts were: higher flexibility in terms of our approach to work, Work In Progress
limitations on Kanban board, delivering value faster for the Client, focusing on tasks rather than time-boxes or
scope and, last but not least, Kanban being a perfect complement to Scrum.

Secondly, we discussed why we want to move to Kanban. Team’s answers were: we don’t have to think how much we have
to burn, increasing our velocity (hypothesis), reducing overhead, less time spent for a task in a particular state
(thanks to “work in progress” limits), increased flexibility. Having said that, the penultimate step was to create
rules based on which we’re going to operate.

We did not want to resign from some of the events that were present in Scrum thus our rules of engagement were:
— Continuing daily Refinement (45'), Daily (15') , weekly Retrospective (45') events.
— Developer who changed the story status to “Deployed” makes contact with stakeholders asking for feedback — instead 
of doing it on review. Verifying certain tasks with stakeholders / final software users and the other ones with Product 
Owner (mainly technical tasks).
— If feedback is positive (meaning no bugs were detected) — story is moved to “Done”. In case one or more bugs were found 
they were fixed on the spot without much delay.
— Setting WIP limits to tasks in each status. One thing we’ve changed was to set a limit to two stories (not tasks) in 
“To Deploy” as there is no sense to deploy them one by one but as a bulk (in this case-a story).

Many of the above points were already happening when using Scrum. What has changed for us was the way of contacting with 
stakeholders right after completing a particular task and asking for verification and setting up WIP limits. As you can 
see we’ve resigned from Planning and Review. Stakeholders were to be contacted after completion of each task and PO was to 
prioritise backlog elements so that we can take those that are highest in the backlog. The Team has amended it’s DoD with 
the requirement that each story should be accepted by one of our stakeholders. All of the above has led us to Scrum-ban 
kind of approach.

The last step was establishing the acceptance criteria for this experiment:

— **Increased velocity** in comparison to average velocity from last three sprints.
— **Positive feedback** from our stakeholders about the new way of working.
— Subjective “**happiness**” of Team members.

These rules were in conjunction with one another meaning that all must happen together for us to pass this experiment. 
Additionally, we’ve agreed on checkpoints, being part of retrospective, happening at the end of each week so we can quickly 
verify if something has gone bad. The experiment was to last two weeks — same length as our previous Scrum sprints.

###First two weeks

We established that we are going to verify how we are doing after a week and decide according to our criteria if we are to 
continue after two weeks time. After inspecting our process for the first time (after a week), not much has happened. The 
Team has taken two larger tasks and was working with them since the beginning. It was hard to assess the velocity as not much 
has happened yet. We agreed to continue.

In a fortnight, the moment we’ve all been waiting for (sort of) happened. We were to answer for the question “Where are we 
going with this?” thus we started checking:

* **Happiness** — the Team prefers to work that way, there is a bit looser atmosphere and less time spent on planning (PO has 
organised and prioritised the backlog so it reflects what is to be done) and trying to complete an increment in a given time. 
The Team feels it can come up with a better value for money, a more tweaked version of the task.
* **Feedback** — our stakeholders are pleased with the changes. The Team is more responsive and has more time to answer all queries 
faster. Stakeholders are saying that they can test what has been done on a regular basis and provide comments contrary to 
waiting for a Review.
* **Velocity** — we’ve burned zero story points. This is according to Jira which was not up to date thus the flow on our physical 
board is saying one thing and Jira is saying something else. After a few calculations we ended up with a value being half of 
what we were ‘burning’ earlier. Bummer you might think.
This was a hard choice due to the fact that the two first criteria were met really good. Still the velocity was down. After 
many discussions and listing all the problems we decided to give it a try for another two weeks but with some amendments 
to our flow keeping the same success criteria. The major issues we noticed were concerning **context switching** or some **flow 
disturbances** relating to discrepancies between our physical kanban board and Jira. We’ve tackled both with **pair programming 
for tasks >1day** and conducting **daily on Jira** instead of the board.

Our third conclusion was **lack of commitment when the work is going to be done**. This was one of the differences between true 
Scrum-ban and our approach. Where possible we agreed that we should **commit to when we estimate the task is going to be 
complete**. We wanted to avoid too loose working atmosphere and turn up the velocity a bit. Additionally, we would place 
emphasis on informing each other about wrong estimates or delays (doh!) when working on them.

###Second fortnight — so now what?

We’ve met on our retro, after a month-long experiment, summing up the work and for inspect & adapt.

![alt text](/img/articles/2015-08-Scrum-ban-applied/2015-08-Scrum-ban-applied-burndown.jpg)

The above burn-down chart symbolises Team’s performance from the beginning of the experiment. First two weeks were not great. 
There was a lot of context switching, people going on holidays and one large story (13sp) that we were doing for almost the 
whole time. We’ve burned 18 sp in total for that fortnight. Last two weeks were much better, we managed to complete what we’ve 
started and completed few other, smaller tasks ending with tasks completed that accounted for 54 sp.

As for our problems that we’ve indicated during second checkpoint there were no delays or wrong estimates and we did not 
commit for each story taken on the sprint. Product Owner was fine with that as we asked questions during daily, if necessary, 
or when he saw that a particular task was crucial for stakeholders. We did start to work on Jira only abandoning our physical 
Scrum board for the time being. Pair programming for tasks longer than 1d did not happen as well — too many team members were 
on holidays so it did not make sense. We are keeping this technique for future reference to use it when it will be easier to 
make some conclusions.

Up till our final day of experiment we’ve burned 72 story points — most of them in the second fortnight. This gives an 
avarage of 18 storypoints (sp) per week or 36 sp per two weeks. Below you can see our previous Scrum-only sprints.

![alt text](/img/articles/2015-08-Scrum-ban-applied/2015-08-Scrum-ban-applied-storypoints.jpg)

As can be seen above, stories were burned quite irregularly. Average from last three sprints was 18,67 sp and 22 from 
last six sprints that happended over 3 months prior to the experiment.

Taking this into consideration, as well as our happiness and feedback from our stakeholders we decided to continue on 
daily basis up till our formal deadline.

###What we've learned

We have agreed that the experiment with our mix of Scrum and Kanban was successful. We’ve inspected & adapted along 
the way and learned new stuff. There were also things we should do but didn’t and some elements we need to pay 
attention to in the future. We are also continuing to work this way till the end of the project.

One of the things we should do but didn’t was to **inform stakeholders earlier** and ask if they are ready for such a change. 
Here the switchover was simple and enhanced their experience. Nevertheless, there might be something we were missing thus 
the importance of an earlier dialogue. Also a regular “**checkpoint newesletter**”, right from the start, would be convenient 
for them to catch-up with our work and see the results within a given time-span. Our Product Owner is going to undertake 
this from now on. Additionally, we plan to hold a **review** for our stakeholders to recap the work from last month and make 
the further decisions about product clear.

Another risk, not directly connected with Scrum-ban, are **larger stories** (for us 13 sp and above). They were often completed 
within one sprint (2 weeks) and in Scrum-ban it could take even longer as there was no fixed review date. We decided to split 
them to smaller pieces of 8 sp or less. As we don’t want to resing from stories carrying business value for our end user 
we are going to search for an optimal solution during next refinement when a 13 sp story will be groomed and come up with 
few variants on how to complete it.

**A thing or two to reflect upon in the long run** are: how the work fits in a larger picture of what we’re doing? How about the 
architecture? Do we know where are we heading? How do we want to work with our backlog if there is no planning event? How can 
the team contribute to the work and plans being made? What about our own ideas?

These questions are what we will need to work with when the project comes to an end. Answers to them are found in Scrum but not 
necessairly in our version of Scrum-ban.

We hope you’ve learned something valuable from our experiment and it would be great if you can share your thoughts or any other 
experiments of your own with Scrum-ban.
