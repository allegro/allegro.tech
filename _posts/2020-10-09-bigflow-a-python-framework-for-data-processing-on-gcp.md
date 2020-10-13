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


## Airflow as a deployment platform

* przygody z composerem
* dockeryzacja
* zmniejszenie progu wejścia
* podstawy pod coś więcej (np. data engine)

## Status

* production ready
* używane w produktach chi


