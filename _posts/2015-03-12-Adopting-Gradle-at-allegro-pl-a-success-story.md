---
layout: post
title: Adopting Gradle at Allegro — a success story
author: [piotr.betkier, bartosz.walacik]
tags: [java, gradle, maven]
---

The story begins two years ago during an excellent TDD training given by
[Szczepan Faber](https://twitter.com/szczepiq)
and [Tomek Kaczanowski](https://twitter.com/tkaczanowski)
for a bunch of Allegro developers. Surprisingly, it was a trigger to revolutionize our builds at Allegro.

We already knew Szczepan as the Polish rock-star developer and the
founder of [Mockito](https://github.com/mockito/mockito). We also knew Tomek as the author of a book on TDD
(see [practicalunittesting.com](http://practicalunittesting.com/)) and the conference speaker.

## Gradle — what’s the big deal

At the end of the training, Szczepan had some interesting news for us about his current job.
It turned out that he worked full-time as a Gradle core committer.

But back then, few of us had heard about [Gradle](http://gradle.org/).
What we knew was barely that Gradle had a good-looking website and that it was a new and cool build tool for Java.

Well, if Szczepan Faber is doing Gradle, that must be a project that matters…
To add more to our curiosity, he said:

“It’s not a question if you move to Gradle, the question is when.”

Holy cow! Of course we like bleeding edge technologies,
but at the time we didn’t see any obvious reason to change good-old [Maven](http://maven.apache.org/) to something completely new…

Each of our Java developers knew Maven quite well.
All our projects, IDEs, Continuous Integration plans and Continuous Delivery pipelines were backed by Maven.
At that time, Maven was The Build Tool. We didn’t like it much but we had gotten used to it.

## Gradle — first blood
Shortly after that TDD training, a few of us started to experiment with Gradle.
No one liked the idea of rewriting our existing Maven projects to Gradle.

Fortunately, as we are into microservices architecture, we have a lot of greenfield projects.
They offer a perfect opportunity to start playing with a new technology.

We like the moment when, before launching a new greenfield, we gather at the whiteboard and throw
some crazy ideas about The New Stack.

At first, Gradle was chosen for toy projects like proofs of concept,
small projects created to run a training and so on.

When it turned out that Gradle gives us a kick, a few bravest teams adopted it for
production projects. Then we asked [Gradleware](http://www.gradleware.com) to run a training for us and
we think it was money well invested. Other teams started to follow.

## Where we are now
To make the long story short, at Allegro Gradle is The Build Tool now.
Most projects are built with Gradle. Of course, since we have 30+ Scrum teams, there are some Maven
conservatives. Some of them stick to Maven claiming it’s faster than Gradle,
others say that Gradle is a step back into the dark ages of Ant.

We think that quite the opposite is true:
Gradle is a big evolutionary step in build automation and it’s fast.
Gradle puts good-old Maven in the place where it belongs — legacy projects.

Now we are going to show you why.

## Gradle advantages over Maven

The following list is just our subjective point of view,
derived from our hands-on experience. It’s not a complete list of Gradle features.

So, let’s go on.

### Great documentation
Every now and then, when you try to find out how to add a non-trivial feature to your `pom.xml` file,
you may end up desperately copy-pasting some XML code snippets.
Maven has always been missing a Big Picture documentation.
Gradle is far better here.

There are two areas of documentation (and also a Javadoc)
which could be a bit confusing for Gradle newbies.
So let us explain.

On the highest level of abstraction is the [User Guide](http://gradle.org/docs/current/userguide/userguide.html).
It could be compared to the comprehensive, book-like Spring Reference.
Unlike Maven, Gradle also covers its built-in plugins here.

On the lower level is the [DSL Reference](http://gradle.org/docs/current/dsl/).
It’s simply the reference for the Gradle language.
Why do they call it [DSL](http://en.wikipedia.org/wiki/Domain-specific_language), isn’t it just Groovy?
Well, it makes sense when you take a look at the syntax.
For example, to add some plugin to your build,
type the following statement in a `build.gradle` file:

```
    apply plugin: 'axion-release'
```

Looks almost like natural language, doesn’t it?
Of course, it’s a dedicated, technical language but still
far more readable than XML (although some would disagree).
That’s the way modern tools communicate with their end-users, by Domain Specific Language.
In this case, the language domain is *build automation*.

There is also a conventional [Javadoc](http://www.gradle.org/docs/current/javadoc/),
but it contains the same content as the DSL Reference.

### Plugins — one way to rule them all
Gradle team maintains a rich set of plugins and provides them in the standard Gradle distribution.
They call them 'standard plugins', which include *maven plugin* or *groovy plugin*,
you can see the [full list](https://www.gradle.org/docs/current/userguide/standard_plugins.html).

It means that you can do most of the build tasks without configuring plugin dependencies, which was usually the case with Maven.

Of course, there is a [community plugins repository](http://plugins.gradle.org/)
hosted by Gradle.
A plugin created by our colleague, [Adam Dubiel](http://allegrotech.io/authors/adam.dubiel/),
is also [there](http://plugins.gradle.org/plugin/pl.allegro.tech.build.axion-release)
(read more about `axion-release-plugin` in [this blog post](/axion-release-plugin.html)).

### Multi-module projects
In our opinion it’s one of Gradle’s killer features: Gradle truly supports multi-module projects, or multi-project builds as they call them.

First, let’s wrap up what it looks like in Maven. Not so bad, you can say.
Maven has the *parent pom* concept, which was designed to allow configuration inheritance.
So a subproject can inherit from its parent project.
Unfortunately, the implementation is ill-conceived. You can inherit many things from a parent,
except for one: `project.version`.
It has to be hardcoded in each subproject pom file.

This leads to massive code repetition and makes your live harder
when releasing. There are plugins, we know. But think about how many times you launched
Find and Replace tool to replace `1.0.2` with `1.0.3-SNAPSHOT` in all your project pom files?

In Gradle you can define the project version in one place, e.g. in the main `build.gradle` file.

```groovy
// gradle magic!
allprojects {
    project.version = '1.0.0'
}
```

We encourage you to use `axion-release-plugin`
(see [this blog post](/axion-release-plugin.html)).
With this plugin you can discover project version from Git tags and forget about anemic *release commits*.

Defining internal dependencies between two subprojects is surprisingly concise.
For example if you have two modules: `bluewhale-core` and `bluewhale-repository`
you can define a dependency in `bluewhale-repository/build.gradle` as follows:

```groovy
dependencies {
    compile project(':bluewhale-core')
}
```

Another Gradle feature is the ability to refer to subproject tasks using their paths
in the project tree. For example:

```
./gradlew bluewhale-core:dependencies
```

means: print the dependency tree for `bluewhale-core` subproject. Below, we explain why use `./gradlew` instead of global `gradle` command.

### Community
People behind Gradle focus on building the community around it. They accept pull requests on
[their github](https://github.com/gradle/gradle) — they have 140 contributors already — and are very active
on their mailing group. That’s why it’s easy to find advice on solving your specific case. Project’s ownership is
clear, [Gradleware](www.gradleware.com) company, so you know who to speak with in case standard support channels are not enough. Just
like the community, Gradle itself is very much alive, with releases every couple of months containing numerous
new features and enhancements.

### Flexibility
One of the many things hurting you when using Maven are its limits. First of all, since you
work with a configuration in XML, a markup language, you are limited by what the plugins’
authors provided for you. Gradle allows you to
perform simple modifications to the build process with just a few lines of Groovy code.
When you do need plugins, you configure them with Groovy code as well, so you can achieve
things like configuring the parameters conditionally or computing them in runtime very easily.

Maven imposes its idea for the build lifecycle that you cannot alter (or which is cumbersome
to do, depending on which Maven version you use). So, unless your desired
behaviour fits into this pre-defined flow, there’s not much you can do, even with plugins.
Gradle, on the other hand, allows you to shape the build process the way you want.

### Custom plugins
Another Gradle’s advantage over Maven is an excellent support for developing plugins.

This comes from Gradle’s design. At its core, Gradle is just a tool for defining tasks and dependencies
between them, it’s the built-in plugins that make it a build system. Since Gradle is so
plugin-oriented, you will find it easy to extend it with your own custom plugins. As we discussed earlier, the flexibility
that it gives you in altering the build and hooking your own logic is much greater than in Maven.

But flexiblity is not all you get. It’s just very straightforward to write a plugin. You can start by
prototyping the code in your `build.gradle` or in a separate Groovy script and move the code to a separate
plugin project once you’ve learned what you want to achieve. Unit testing your plugin is also much easier
than it was in Maven. Also, throughout the whole process of creating your custom plugin you will get support
from a friendly documentation.

### Integration with Maven repositories
Gradle team took a smart decision to make Gradle
backward compatible with Maven. Thanks to that, you can move from Maven to Gradle smoothly.

Gradle uses well established Maven source folder structure (`/src/main/...`, `/src/test/...`) by default.

Moreover, Gradle supports Maven repositories. Add this statement to your `build.gradle` to configure
Maven Central repository:

```groovy
repositories {
    mavenCentral()
}
```

Dependencies are defined with a very concise syntax, for example:

```groovy
dependencies {
   testCompile 'junit:junit:4.11'
   testCompile 'org.codehaus.groovy:groovy-all:2.3.3'
   ...
}
```

To deploy your artifacts to Maven repository, use the
[maven-publish](https://gradle.org/docs/current/userguide/publishing_maven.html) plugin:

```groovy
apply plugin: 'maven-publish'

publishing {
    publications {
        maven(MavenPublication) {
            from components.java //means: publish all artifacts from java build
        }
    }
}
```

Then, you can publish all artifacts to selected repository:

```
./gradlew publishToMavenCentral
```

Publishing everything to all defined repositories is even simpler:

```
./gradlew publish
```

You can always take a look at available tasks by running `./gradlew tasks` command and looking up *Publishing tasks*
section.

You can also use Maven local repository, just add `mavenLocal()` to the repository list.
But think twice before doing this.
Gradle guys claim that local repository is a spoiled concept.
Your build is less portable when depending on some repository which exists only on your local machine. Although it’s useful when you’re working on a library and want to test it locally.

Instead of the local repository, Gradle uses a local cache.
It works pretty much like ordinary cache.
It sits between your build and remote repositories and it can’t be referenced
directly from your `build.gradle`.

### Gradle Wrapper
Another nice Gradle feature is Wrapper. It serves two purposes. Firstly, Wrapper unifies Gradle version on all environments
for a given project.
When using Wrapper, you are sure that all developers and CI tools use the same Gradle version, defined in your project `gradle-wrapper.properties`.
How many times did your Maven build fail due to different Maven versions on dev and CI environments?
With Gradle Wrapper, it’s no longer an issue.

Secondly, Wrapper frees you from installing Gradle on your CI server.
In fact, it’s kind of a smart installer. Every time you run `./gradlew` it does the following:

* Checks the Gradle version number defined in your project’s `gradle/wrapper/gradle-wrapper.properties`.
* If selected gradle distribution has been already downloaded and cached in `~/.gradle` dir, Wrapper runs it.
* If no, Wrapper downloads the right Gradle version and puts it in `~/.gradle` dir.

So get into the habit of running `./gradlew` instead of `gradle`.

### Gradle Daemon
Gradle comes with a feature called the Gradle daemon, which reduces the startup and execution time of your tasks.
When enabled, Gradle process will remain running after the tasks finished and will be reused the next time your call Gradle.
This way you save the time on spawning a new JVM instance, a couple of seconds, which is relatively long for
short-running tasks. There are plans to develop the daemon even more,
 e.g. make it do some work in the background preemptively, and
 make the builds much faster as a result.

## The pitfalls
Here are some of the pitfalls we've encountered when migrating to Gradle.

### Magic scripts
You can extend Gradle by applying custom Groovy scripts in your `build.gradle` apart from applying custom plugins.
This is convenient for a start, but becomes hard to work with once they grow or once you start sharing them between
different projects. You need to discover such situations early and transform the scripts into independent plugins
published to some artifact repository. We made the mistake of discovering it too late and had to refactor the build scripts
in many projects.

### Missing plugins
Right after we migrated from Maven we missed some of its plugins that didn’t have their alternatives in the Gradle world.
In some cases we had to fill the gap by ourselves by creating our own plugins, as we did with
[axion-release-plugin](https://github.com/allegro/axion-release-plugin), but in some cases we discovered that it’s
not necessary. Gradle’s Groovy build files are so expressive that sometimes a few lines of extra configuration are
enough to achieve what used to be a full-blown Maven plugin.

### Early adopters pain
Most of the Allegro teams migrated to Gradle around version 1.11 and there were some early adopters starting much earlier.
Gradle was not fully polished back then and we encountered some issues like bugs or weak support in the tools that we used. It was a bit painful, but our desire
to drop Maven once we saw Gradle was even stronger. Right now there’s nothing to complain about.
The bugs that bothered us got fixed in subsequent releases. Also, our IDEs got much better at supporting
Gradle — we’re satisfied with what the newest versions of plugins for IntelliJ and NetBeans
have to offer.

### Not all developers like Groovy to configure builds
As is the case with any new technology, some people are not comfortable dropping their old habits.
We’ve observed teams rejecting Gradle’s idea of configuring the build using Groovy, prefering XML after years of
using Ant and Maven. Our opinion is that they will eventually migrate to Gradle anyway, as late adopters.

## Conclusion
This is our success story of migrating to Gradle. We liked the promises that Gradle made and decided to give it a try.
One by one, our teams started dropping Maven and eventually Gradle became the standard build tool in the company.
Although we faced some minor problems and fell into some traps during the process, it all went smoothly overall.
What matters is that adopting Gradle turned out to be a perfect decision for us and we cannot imagine going back to the Maven world.

![confitura](img/qrcode_confi.png)
