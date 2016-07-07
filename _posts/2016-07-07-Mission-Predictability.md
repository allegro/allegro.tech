---
layout: post
title: Mission Predictability
author: joanna.tobola
tags: [agile, predictability, sprint, measuring]
---

A sprint start looks promising – task requirements are described and discussed. Other issues such as leave, training and additional meetings are taken into
account. Team’s velocity is well-known too. Tasks have been estimated and scope of work has been established. Will we make it? Sure we will! The Product Owner is
already happy about new features for users and a team discusses the successful planning over a coffee.

After three days some tasks are somewhat complete and you do record some progress. It seems you should rather be able to deliver what you wanted to... at least
some of it. Even burn-down chart looks promising. That is before the line goes flat instead of going down. Suddenly, control over sprint starts slipping away – a
pattern often observed in sprints longer than a week. Tasks swell and a 5 story points task becomes a 13 story points colossus. What is worse, you usually notice
it right before the review meeting, when you realize how close you were to deliver the task. One of teams working on mobile solutions decided to address this
discouraging issue. We decided to carry out an experiment and monitor work progress throughout the sprint. If you want to know the reason behind the decision, or
what was the experiment progress and outcome – just keep reading.

### Agreement
When working with various scrum teams I often observe how they underestimate the importance of delivering the agreed scope of work within established deadline.
In fact, none of these teams seemed to be somehow concerned about unsuccessful sprints. They shrugged everything off with a universal excuse – „we thought we
would make it”. Even when aware that the first plan was way too optimistic, team rarely got in touch with the Product Owner or did anything about it at all,
despite failing to fulfill the agreement. In fact, it is like not paying a loan installment, not helping a friend in need or not sending an item someone bought
from you online... It is crucial that team understands that meeting agreement provisions is part of the process, thus feels responsible for what it declares.
With the awareness comes the realization that yet another undelivered sprint means something is not working well.

Thinking about this made team investigate the circumstances behind _another almost delivered sprint_. The guys were upset, helpless and wanted to be in control
again. During a retrospective meeting, we answered some vital questions that helped us decide about next steps.

### What is our goal?
- We want to control progress in work again.
- We want to deliver tasks.
- We want to adjust to new circumstances (one of the developers left team).
- We want to know how much we can deliver per sprint.

### Experiment
Some time ago I read an article on [measuring sprint progress](https://www.scrumalliance.org/community/articles/2011/may/measuring-sprint-progress) written
by Martin Alaimo. It is a very inspiring piece that gave me an idea. I asked team to estimate the work that still needs to be done during each daily 
stand-up meeting.

### Thesis 
By estimating the amount of work necessary to complete each story (estimate-to-complete value – ETC), we will be able to monitor sprint progress and improve
predictability. Where:

Predictability = sum of story points delivered during a sprint divided by the sum of story points planned per sprint

Such information is crucial for the Product Owner who can plan the release date and provide users with frequent updates. And all of this translates into
increasing work satisfaction experienced by team and stakeholders.

### What are the success criteria?
- Increase in average team predictability throughout a quarter with base level being 70% (we did not define any “satisfying” end level, although it is worth
declaring whether it should be 80% or 99%. I was aiming at 80-85%);
- Work satisfaction expressed during each sprint retrospective meeting;

### Course
The first sprint involved making a board for saving daily ETC values. Take some foil, marker, print tasks on a piece of paper and your
[MVP](http://allegro.tech/2016/03/Minimum-Viable-Product-already-a-cliche-or-a-misunderstood-concept.html) board is ready.

![Board](/img/articles/2016-07-07-mission-predictability/sprint_table.jpg)

Scrum Master's observations (sprint 1)| Event     
-------- | --------
Scrum Master is encouraging team members to update the ETC values during each daily stand-up meeting for three consecutive days. |*Team estimates the ETC values.*
Scrum Master does not attend one daily stand-up meeting.  | *Team estimates the ETC values.*
Team suggests indicating an ETC guard – a team member responsible for updating the board during daily stand-up meetings.  | *Team indicates the ETC guard.*
A new task is added. | *Team estimates the task (which did not used to be a routine procedure).*
In the mid-sprint, one of the developers wants to take some extra task during a daily stand-up meeting. | *Team looks at the board and says „Hey, there is an 8 story points task. Let’s take it instead of extra task, to make sure we deliver it!”.*
The board is updated daily. | 
Next daily stand-up meeting: “Perhaps we could add one more thing to this task...”, which means changing the scope of work. | *Team reacts: „Hey, do not change anything, because we are increasing the risk. We will deal with it next time and deliver what we are supposed to.”;*

### Retrospective meeting:
- „Hurray, we made it!”
- „Awesome! Finally, we had the control over the process.”
- „Thanks to ETC value update we did not take too much and did not go beyond the
scope.”
- „We knew what to focus on.”
- „We should continue with this approach.”, “Let’s do the same next time.”
- „The board is ok.”
- „Let’s keep the ETC guard because it played well.”
<br />  

Scrum Master's observations (consecutive sprints)| Event     
-------- | --------
Team insists on updating the board. |
Scrum Master is wondering whether the ETC value update is well-considered or is it done mechanically after completing some parts of a task.| *One of team members suggests not presenting the ETC values saved the previous day (eventually the idea did not work well and was abandoned).*
A bug exceeding the scope is found and estimated. Team looks at the board and sees a task that requires as much work as the bug.| *Team negotiates the scope with the Product Owner: „let’s remove the task and add this bug instead (team used to add new tasks without analyzing the impact on the sprint).*
3 days before the sprint end team analyzes the board to realize that there is not much work left and the sprint will be delivered. | *Team decides to add one more task (the one that was removed because of a bug).*
Team discovers that a 5 story points task is much more complicated. Despite noticing it, team does nothing and continues the sprint. | *Eventually, the sprint was delivered and team managed to exceed the limit of declared 40 story points. However, that fact was not refleected anywhere. As a result, team at the retrospective meeting decided to inform the Product Owner whenever a task turns out to be more complex and renegotiate the scope of work.*
The board is updated at the end of the daily stand-up meeting. | *When updating the board, team often mentions details that were not discussed. It seems that the board triggers additional discussions.*
When reviewing the board, team focuses on tasks that are almost done. |*Team decides to close tasks that require the least work before starting any new ones.*
Paper copy of the board is difficult to manage and store. |*Team switches to an [online board](https://docs.google.com/spreadsheets/d/1aWZHsnISyLNC1cR_GgJj7ngI-ODkEaQWRfqqHhjY-54/edit#gid=976578755) that includes additional data.*

### Moment of truth
We measured our predictability after each sprint and monitored the change in number of tasks delivered. For more information click 
[here](https://docs.google.com/spreadsheets/d/1aWZHsnISyLNC1cR_GgJj7ngI-ODkEaQWRfqqHhjY-54/edit#gid=0). Team’s predictability exceeded 93% during the first
quarter of the experiment. It means that team delivered 93% of what is was supposed to deliver within 6 sprints. Let me remind you that it used to be 70% before
the changes.

After those three months, we started to wonder whether higher predictability was the only thing we wanted to achieve as the recent sprints witnessed a boost in
commitment and effectiveness. Besides, improved communication resulted in more discussions about potential risks. Numerous decisions were thoroughly talked over
and the control over sprint was reclaimed. Team was able to estimate the work progress at any time and take suitable steps in case of increasing risk. As a
result, the Product Owner could plan application releases, and arrange with e.g. marketing department promotional campaigns concerning the corresponding features.
Team’s self-esteem was restored, and the guys were again proud of their work. Perhaps there is no exaggeration in saying that a satisfied team translates into a
satisfied user, but we do not have any tools to measure it. However, what we can measure is the number of positive comments posted by users appreciating frequent
updates and I am convinced it is the outcome of improved predictability.

### From experiment to habit
It has been almost a year since the experiment. The ETC value update is now a routine element of our work. The board triggers complex discussions and helps team
plan their work better. In the meantime, a few other Allegro teams learned about our experiment – three of them decided to try the board out and one of them is
still using it. Does it mean that the operation was successful? I think the mission never stops. Predictability is something one must always take care of.