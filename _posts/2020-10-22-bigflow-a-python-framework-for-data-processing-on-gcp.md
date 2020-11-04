---
layout: post
title: BigFlow — a Python framework for data processing on GCP
author: [bartlomiej.beczkowski,bartosz.walacik]
tags: [tech, python, gcp, big data]
---


We are excited to announce that we have just released [BigFlow](https://github.com/allegro/bigflow) 1.0 as open source.
It’s a Python framework for big data processing on the Google Cloud Platform.

Two years ago, when we started to move data processing pipelines
of our A/B testing platform to GCP, we had neither build tools nor utils.
During these two years, our projects have grown and multiplied. So did our tools.
Finally, we decided to release our toolkit as BigFlow.

Allegro spoils its developers with an amazing internal App Engine (to have some point of reference, you can imagine it as
something similar to [Heroku](https://www.heroku.com/)). On the other hand, GCP provides a powerful, but loosely
coupled set of tools for big data processing. So we had to bind these tools reasonably, to get closer to the
Allegro App Engine experience. That's what BigFlow is about.
We created BigFlow as a side-project, but now it's a stable and mature framework.

## Features

When you create many big data projects without applying some best practices and without using common tooling, they
quickly become hard to manage. BigFlow unifies many aspects of a big data project:

* Project structure
* Deployment artifacts
* CI/CD process
* Project CLI
* Release versioning
* Configuration
* Logging
* Scaffolding

All of these aspects are managed by BigFlow in a unified way for supported technologies. BigFlow supports the main
data processing technologies on GCP:

* Dataflow (Apache Beam),
* Dataproc (Apache Spark),
* BigQuery.

The provided utils make it easier to create processes in each technology. Besides the listed technologies,
you can use anything that you can express in Python (for example [fast.ai](https://www.fast.ai/),
[PyTorch](https://pytorch.org/), [Pandas](https://pandas.pydata.org/), or any other Python tool).
BigQuery is not usually considered a data processing tool but an ad-hoc analysis and storage system. We find it to be
fast, reliable, and very easy (you need to know SQL, that's all) to use for creating data processing pipelines. With
the BigFlow utils supporting BigQuery, big data processing is reachable to anybody in hours, not days or weeks.

There are many aspects of a project, which determine what a solution should look like, for example:

* characteristics of a business case (complexity, importance, etc.),
* skills of a team,
* time available,
* toolset.

So if you create a proof-of-concept project, with a minor business impact if things go wrong, you probably want to do
things quick and dirty. On the other hand, if you create a high-impact financial system, you need to take things more
seriously.

BigFlow allows you to adapt to a situation, you can:

* Pick the right tool for a situation.
* Pick the parts of the framework that you need in a situation.
* Start small and grow if needed.
* Develop multiple workflows in a single project (workflow is a [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
 composed of data processing jobs).
* Mix technologies in a single workflow.
* Develop batch and stream processes in the same project.

BigFlow is a framework, not a scaffold. There is very little code generated. You can manipulate configuration to
build a custom project setup.

For scheduling, BigFlow uses Google Cloud Composer, which is super easy to set up version
of [Airflow](https://airflow.apache.org/), hosted on GCP. Airflow is not a part of local development though.
Let us talk about that a bit more.

## Deployment

When you want to run a workflow (data processing pipeline)
on Airflow, you need to deploy it.
Let's start by describing the vanilla deployment process in Python.
How it's done when you don't have any tools but a bare Composer?
The key concept is Composer's DAGs folder.
It's a Cloud Storage bucket mounted on Airflow.
This is the place where you upload DAG files and workflows' code.
Libraries (PIP packages) required by workflows have to be installed
manually on a Composer instance.

This approach seems easy, but there are four big issues.

**First**, managing Python dependencies on Composer is problematic
(dependencies are libraries used by the code which is processed directly by Airflow).
Installing a new library forces a Composer instance to restart.
It not only takes time but sometimes fails what forces you to spawn a new Composer instance.
Version clashes are common. You can have it on two levels: between
dependencies of two of your workflows (DAGs) and between your
dependencies and Composer's implicit dependencies (which changes from version to version).
Managing Python dependencies on Composer's instance level is really tedious
and can lead to *dependency hell*.
You need a better tool for that job.

**Second**, if you want to use external Big Data clusters like Dataproc or Dataflow &mdash;
you need a build tool. You can't simply copy your source files to a DAGs folder.
Both Dataproc and Dataflow have certain requirements about source code they are executing.
For example, Dataflow wants you to provide a standard Python package
and it doesn't use libraries that are installed on Composer.

**Third**, for regular deployments, you need an automation tool.
A tool, that can check out the code from your version control system and upload it to Composer.

**Fourth**, when you develop a workflow on a local machine,
you just want to run it fast and see what happened, not schedule it.
So you don't need Airflow at all on your local machine.
On the other hand, sometimes you need to replicate a production environment,
for example, to debug or E2E tests. In that case, you need to replicate Airflow in that
version which is currently used by Composer. It's additional work for you.

**BigFlows solves all these problems.**
It is a smart build and deploy tool for big data processing.
BigFlow treats Airflow as a scheduling platform and Docker (Kubernetes)
as a deployment platform. This architecture
and [workflow](https://github.com/allegro/bigflow/blob/master/docs/workflow-and-job.md) abstraction
**decouples** your code from Airflow and from most infrastructural APIs.
What's important, BigFlow runs your workflows in stable, dockerized environment,
without compromising rapid development on a local machine (which is build-less by default).
Thanks to dockerization, you can easily replicate a production environment wherever you need.

All project-level actions are executed via the BigFlow [command line](https://github.com/allegro/bigflow/blob/master/docs/cli.md)
(see
[run](https://github.com/allegro/bigflow/blob/master/docs/cli.md#running-workflows),
[build](https://github.com/allegro/bigflow/blob/master/docs/cli.md#building-airflow-dags), and
[deploy](https://github.com/allegro/bigflow/blob/master/docs/cli.md#deploying-to-gcp)).
Thanks to that, the whole development lifecycle can be easily automated on CI/CD servers.

Shortly speaking, BigFlow handles the infrastructure of your projects
and lets you focus on your core job, which is data processing logic.

## Status

BigFlow is production-ready, open-source project. It already powers a few big data projects inside the company. Try it on your
own, following our in-depth [documentation](https://github.com/allegro/bigflow#documentation).

There are some missing spots that we want to cover in the next versions. The big things are:

* metrics,
* monitoring,
* infrastructure management.

Right now, BigFlow works only on GCP. We might expand to Hadoop or other cloud environments if a need appears.
