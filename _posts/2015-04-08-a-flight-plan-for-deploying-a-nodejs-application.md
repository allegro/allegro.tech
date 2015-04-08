---
layout: post
title: A flight plan for deploying a Node.js application
author: krzysztof.kwiatkowski
tags: [node.js, deployment, javascript]
---

So you have created a brand new and shiny [Node.js](https://nodejs.org/) based app. And now, how would you like it
deployed? How to pack it and deliver to a production environment? In this post we’ll describe this process (we
assume some familiarity with the concepts of Node.js and [npm](https://www.npmjs.com/)).

There are many different approaches to the problem: some of them are as simple and straightforward as checking-out from
[VCS](http://en.wikipedia.org/wiki/Revision_control) on a production servers, others are as sophisticated as shipping
apps within [Docker](https://www.docker.com/) containers. It’s crucial to pick the approach that fits you the best and
isn’t an overkill. And it’s always wise to start with specifying what you need. And so we did once. Now we want to share
our experience in that field.

### Our requirements

We wanted:

*   Our delivery flow to be immune to public npm registry downtimes — when you cannot run you app on a server because of
any external registry failure it’s not only annoying, it’s clearly unacceptable.
*   Deployments to be fast — checking out source code on a machine and then running all the installs/builds takes ages.
Ain’t nobody got time for that.
*   To have versioned, binary-like artifacts — exactly the same package should be deployable on dev/test/prod
environments.
*   To utilise existing tools — we already had tools that we can make use of: [Nexus](http://www.sonatype.com/nexus)
(a repository manager designed for Java, but its also capable of storing and versioning arbitrary data) and
[Bamboo](https://www.atlassian.com/software/bamboo) (CI server).


### Recipe for an artifact

On a CI server we made a plan, that was triggered on every push to the repository. That plans plan was to:

*   download all the sources,
*   run npm install,
*   run tests and a build (grunt/gulp/npm scripts, whatever).

It’s all trivial. The next, non-trivial part involved packing the whole thing (including node_modules/ directory, where
all dependencies lives) and uploading it to Nexus. We chose a handy
[grunt-nexus-deployer](https://www.npmjs.com/package/grunt-nexus-deployer) package to do the heavy lifting.

### Deployment

When the artifact is ready, we can start placing it on a target server. For an automation of the process we used
[Flightplan ✈](https://github.com/pstadler/flightplan). It’s a very helpful tool that allows to operate on a multiple
target hosts and has a high level API for copying files over the network. If you’re familiar with
[Fabric](http://www.fabfile.org/), you can think of Flightplan as a Javascript clone of it.

The steps that are required to be taken for deployment are:

*   to fetch an artifact in a given version,
*   put downloaded artifact into target machines,
*   unarchive its content,
*   run npm rebuild eventually (to ensure binary extensions works regardless OS architecture differences),
*   stop an app that is currently running,
*   replace/relink app’s files with previously unarchived ones,
*   and finally start the app.

In our environment, the whole process takes about 15 seconds to complete and the app downtime itself lasts for less that
1 second. Pretty neat.

### Summary

Presented formula for deploying Node.js based apps is fast and dead simple, reuses our existing infrastructure, protects
us from npm failures and enables fast rollbacks, because of the artifact versioning. It works for us.

What are the patterns that you are using for deploying your apps? Please, feel free to leave any comments, criticism or
feedback below in the comments.

