---
layout: post
title: Post-mortem report on 23-24, October 2014 failure
tags: [allegro, post-mortem, failure]
author: julian.szulc
---
On 23rd and 24th October, the Allegro platform suffered a failure of a subsystem
responsible for asynchronous distributed task processing. The subsystem consists
of several daemon processes, [Gearman job server](http://gearman.org),
[Redis](http://redis.io) and Oracle databases. The problem affected many areas,
e.g. features such as purchasing numerous offers via cart and bulk offer editing
(including price list editing) did not work at all.
Moreover, it partially failed to send daily newsletter with new offers.
Also some parts of internal administration panel were affected.

## What happened?

On 23rd October, at 4:19 AM a wrong server was restarted by mistake. In fact, it
was the wrong "half" of a blade server running in the active datacentre and
hosting important components of the task processing system: Gearman server,
Redis servers and daemons retrieving tasks from a database and adding them to a
queue. After re-launching daemons, the system did not start automatically, due
to loss of settings.

## How did we respond?

Because the mechanism was poorly monitored, we had no idea about the problem
until 8:40 AM. At 9:20 AM, we managed to start processing queued tasks. However,
we could not retrieve any new tasks from a database. For reasons unknown, the
panel with statistics and settings of daemons retrieving tasks was unavailable.
At 10:04 AM, task retrieving was working, but we found another problem – several
million tasks waiting to be processed, which would take roughly 84 hours.
Naturally, when the oldest tasks are transferred first, such a situation is
unacceptable. As a result, one of offered features, i.e. the cart with numerous
offers had no chance to work at all.

The Site Reliability Engineering Team was working on minimising the damage and
solving problems. We started with increasing the efficiency of task processing.
As a result, we were able to establish new efficiency limits of the system,
which are now about twice as high. In order to prevent further delay and
decrease the number of tasks to be processed, we decided to cancel the release
scheduled on 23rd October as well as subscribed offer alerts that were supposed
to be sent on the night of 23rd October.
Besides, we wanted to reduce the number of tasks waiting to be retrieved. We
decided to remove those that could not be processed, i.e. cart purchases and
overdue subscription.

The third thing we needed to do, was finding the cause of this enormous number
of tasks. For reasons which we still do not understand, after rebooting, daemons
started to retrieve tasks dated 11th September 2014. When we noticed it, we set
the task counter to the first task submitted on 23rd October 2014. As a result,
the queue displayed only most recent tasks waiting to be processed. Moreover,
this modification also fixed the administration panel of task retrieving
daemons. The processing delay ended on 24th October about 7:00 PM.

## Consequences of failure

The failure caused several hours of delay in task processing. Some tasks that
were submitted after 11th September 2014, but for some reason had not been
correctly re-processed, were finally executed. In certain cases, invalid task
may not correctly indicate its execution status. Nevertheless, such tasks were
processed again.

## Prevention?

It is necessary to monitor the task processing subsystem. Currently, we do not
notice most of the system problems. Each restart of any Allegro Platform server
must be supervised by an on-duty service specialist who can verify whether
everything works as it should. Still, it is absolutely unacceptable when a
reboot or failure of one machine affects the site. Unfortunately, the mentioned
system includes a [SPOF](http://www.wikiwand.com/en/Single_point_of_failure). We
need to take necessary steps to increase the reliability and resilience to
failures of system components. Moreover, old tasks will be removed from the
database automatically.
We do not know what triggered the switch of task counter. We think it was a code
bug or error in database connection configuration. It could explain why the task
retrieving daemon, which was running continuously for several months, did not
save the counter. After the restart, the counter is saved properly.
