---
layout: post
title: BigFlow — a Python framework for data processing on GCP
author: [bartlomiej.beczkowski,bartosz.walacik]
tags: [tech, python, gcp, big data]
---

BigFlow was created by the Allegro experimentation team. We have moved our analytics to the Google Cloud Platform
two years ago, as one of the first teams. We had zero tooling for data processing on GCP. During these
two years, our analytics projects have grown and multiplied. So did our tools. Allegro spoils their developers with
an amazing internal app engine (to have some point of reference, you can image it as
something similar to Heroku). On the other hand, GCP provides a powerful, but loosely coupled set of tools for big data processing.
So we had to bind these tools in a reasonable way, to get closer to the Allegro app-engine experience. That's what BigFlow is
about.

## Features

The first BigFlow feature is **unification**, which applies to:

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

And anything you can express in the Python language

The unification applies to all the supported technologies.

The second thing is elasticity. BigFlow supports multi-workflow project

## Airflow as a deployment platform

* przygody z composerem
* dockeryzacja
* zmniejszenie progu wejścia
* podstawy pod coś więcej (np. data engine)

## Status

* production ready
* używane w produktach chi


