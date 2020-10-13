---
layout: post
title: BigFlow — a Python framework for data processing on GCP
author: [bartlomiej.beczkowski,bartosz.walacik]
tags: [tech, python, gcp, big data]
---

BigFlow was created by the Allegro experimentation team. We have moved our analytics to the Google Cloud Platform
two years ago, as one of the first teams. We had zero tooling for data processing on GCP. During these
two years, our analytics projects have grown and multiplied. So did our tools.

Allegro spoils their developers with an amazing internal app engine (to have some point of reference, you can image it as
something similar to Heroku). On the other hand, GCP provides a powerful, but loosely coupled set of tools for big data processing.
So we had to bind these tools in a reasonable way, to get closer to the Allegro app-engine experience. That's what BigFlow is
about.

Try BigFlow on your own, following the [documentation](https://github.com/allegro/bigflow#bigflow).

## Features

Without unification, a multi-project environment quickly becomes hard to manage. BigFlow unifies many aspects of a big
data project:

* Project structure
* Artifacts
* CI/CD process
* Project CLI
* Versioning
* Configuration
* Logging

All of these are unified for the supported technologies.

Speaking of technologies, BigFlow supports the main data processing technologies on GCP:

* Dataproc (Apache Spark)
* Dataflow (Apache Beam)
* BigQuery

The provided utils makes it easier to create processes in each technology. Of course, besides the listed technologies,
you can use anything that you can express in Python.

Flexibility is important. BigFlow allows you to start small and grow big, if needed. You can:

* Develop multiple workflows in a single project.
* Mix technologies in a single workflow, so you can use the right tool for a job.
* Keep batch and streaming in the same project.

Deployed processes start from the Docker environment. Thanks to that, you can create any environment you want. Docker
is much more stable execution environment than Airflow.

BigFlow is a framework, not a template. There is very little code generated. You can manipulate configuration to
build a custom project setup.

## Deployment

When you want to run a workflow (data processing pipeline)
on Airflow, you need to deploy it.
Let's start from describing the vanilla deployment process in Python.
How it's done when you don't have any tools but a bare Composer?
The key concept is Composer's DAGs folder.
It's a Cloud Storage bucket mounted on Airflow.
This is the place where you upload DAG files, and workflows' code.
Libraries (PIP packages) required by workflows have to be installed
manually on a Composer.

This approach seems easy, but there are four big issues.

**First**, installing requirements for *local* workflows directly on Composer is problematic
(by a local workflow I mean a workflow that is processed directly by Airflow,
for example, a workflow with a series of BigQuery SQL statemens mixed with Python).
It's tedious, manual process. Version clashes are common.
Installing a new library, forces a Composer instance to restart.
You need a better tool for that job.

**Second**, if you want to use external Big Data clusters like Dataproc or Dataflow &mdash;
you need a build tool. You can't simply copy your source files to a DAGs folder.
Both Dataproc and Dataflow have certain requirements about source code they are executing.
For example, Dataflow wants you to provide a standard Python package.
And it doesn't use libraries that are installed on Composer.

**Third**, for regular deployments you need automation tool.
A tool, that can checkout the code from your VSC and upload it on Composer.

**Fourth**, when you develop a workflow on a local machine,
you just want to run it and see what happened, not schedule it.
So you don't need Airflow at all on a local machine.

**BigFlows solves all these problems.**
It is a smart build and deploy tool for Big Data processing.
BigFlow treats Airflow as a scheduling platform and Docker (Kubernetes)
as a deployment platform. This architecture
and [workflow]() abstraction **decouples** your code from Airflow and
in fact from most infrastructural APIs. BigFlow lets you to focus on your processing logic.

What's important, BigFlow runs your workflows in stable environment,
which is dockerized on Cloud and build-less on a local machine for rapid development.
The whole development process
Read more about [deployment] and [CLI].

## Status

* production ready
* używane w produktach chi


