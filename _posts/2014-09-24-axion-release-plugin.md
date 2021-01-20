---
layout: post
title: "Allegro OpenSource: axion-release-plugin"
author: adam.dubiel
tags: [build, gradle, release, open source]
---

In the good old days of Maven releasing projects was straightforward. Everyone knew and used
[maven-release-plugin](http://maven.apache.org/maven-release/maven-release-plugin/),
a plugin that behind simple facade did huge amounts of work. In Gradle times things started to get complicated. In
exchange for greater flexibility we gave up good old, maybe a bit rusty tools that were part of our developer kits
for years. Now we try to find new ones. Most of teams in Allegro have decided to migrate their projects from Maven to Gradle
and we, too, are searching for perfect tools to do our job (and builds).

First tool that we have created and would like to share with the community is **axion-release-plugin**.
**axion-release-plugin** is Gradle release and version management plugin.

## Version management & release together?

It may seem a bit odd at first. Why mix release and version management? Aren't these two separate concepts?

### Where version comes from

Let's discuss where application's *version* really comes from. Instinctively, most of us would say that *version* resides
inside GAV (group-artifact-version) descriptor in **pom.xml**:

```xml
<group>...</group>
<artifactId>...</artifactId>
<version>1.0.0</version>
```

Is it really though? If one received a ZIP file `application-1.0.0.zip` containing ready-to-deploy application,
would she believe the version stated in file name? Or would she rather confront changelog or `git log` to know what
features are shipped and what the history of given application release is.

While most software engineers would probably not believe the file name, they would believe in the version string written in build
file. We have to trust something, right? It is perfectly acceptable as long as the file is versioned in VCS.

### VCS as source of truth

This brings us to the concept of VCS (Version Control System, e.g. git, subversion, mercurial..) as the source of truth about project version. We already
use them as *time machines* and auditing tools for our code. This new approach to *version* couples project versioning
with source code versioning.

Part of good practice when releasing a new version of a project is to create a new tag in VCS to take a snapshot of exact
source code that is being deployed. Version tags are:

* immutable by definition
* point to concrete places in commit history
* most often contain version numbers

Thanks to these attributes, version tags are perfect candidates for **reliable** source of truth about current
project version.

This brings us back to the original question. If we agree version tags are source of truth, it seems natural to link version
management with release process as they both operate on the same entity. Version management reads tags while release
process creates new ones.

## How does it work in practice?

The flow of **axion-release-plugin** is simple. Each time you start a build it looks for the version tag closest to current commit
and extracts the version number from it. If you happen to be on a tagged commit, you operate on release version. If not, patch version is
increased and SNAPSHOT suffix is appended.

```sh
$ git tag
project-1.0.0

$ ./gradlew currentVersion
1.0.0

$ git add . && git commit -m "I've just changed something"

$ ./gradlew currentVersion
1.0.1-SNAPSHOT

$ ./gradlew release

$ git tag
project-1.0.0 project-1.0.1

$ ./gradlew cV # gradle magic - currentVersion
1.0.1
```

**axion-release-plugin** is highly configurable. In [README.md](https://github.com/allegro/axion-release-plugin/blob/master/README.md) you can find examples how to:

* define custom serializer/deserializer to interpret version tag
* define custom version creators to, for example, include branch name in version
* define custom version creators per branch (using RegExp matching)
* use it in Continuous Integration environment
* use it with signing and publishing

## And nobody did that before?

There are a few plugins that follow a similar path and that we drew inspiration from when creating **axion-release-plugin**. None
of them, though, gave us full set of features, including easy integration with Continuous Deployment flow.

* [build-version-plugin](https://github.com/GeoNet/gradle-build-version-plugin) : keeps track of current version depending
  on position in VCS - main inspiration, lacks any release process
* [ari gradle-release-plugin](https://github.com/ari/gradle-release-plugin) : contains release process and is able to read
  version based on position in VCS
* [townsfolk gradle-release](https://github.com/townsfolk/gradle-release) : more maven-release-plugin type, oldschool versioning

Feel free to decide which option is best from you (althogh we encourage you to try **axion-release-plugin** first!).

## Where can i find it?

**axion-release-plugin** is published at [Allegro Github page](https://github.com/allegro/) along with the other Allegro
OpenSource projects. To find out more about the usage, read README.md in
[axion-release-plugin repository](https://github.com/allegro/axion-release-plugin).
