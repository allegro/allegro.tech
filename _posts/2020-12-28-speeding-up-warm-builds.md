---
layout: post
title: Speeding up warm builds in Xcode
author: maciej.piotrowski
tags: [tech, ios, xcode, swift, objectivec]
---

Programmers who have ever developed software for Apple platforms in the early days of **Swift** language might remember ridiculous
times it took to compile the whole project. For large and complicated codebase times used to range from 10 up to 40 minutes.
Over the years our toolset has improved alongside with compilation times, but slow build times of source code can still be a nightmare.

When we wait a few minutes for a build, we navigate ourselves towards different activities and start e.g. watching funny animal pictures or
YouTube videos, easily **loosing context** of the task at hand. What becomes annoying for us is **slow feedback** of code correctness.

In the [past issue](https://allegro.tech/2020/12/speeding-up-ios-builds-with-bazel.html) my colleague has written about a solution
to slow **clean** builds.In this post I will focus on **warm** builds improvement.

## Clean and incremental builds

There are two terms used in the realm of [Xcode](https://developer.apple.com/xcode/) when it comes to distinguishing types of
compilation: **clean** and **incremental** build. The first refers to the time it takes to build a project from scratch. The latter is the time
it takes to build only whatever changed since the last build and to integrate the changes into a build product.

You might also be familiar with the term **warm** build. It's used interchangeably with **incremental** build term, but for the sake of this
post I will be using it to refer to *the time it takes to build a product since the last clean build without introducing any source code
changes*.

## Why and what for

Why bothering with improving **warm** build times? Well, for a small projects built on super fast workstations it might take a fraction of a
second to do a warm build, but as projects grow and multiple *Build Phases* get added to a target so grow the build times. These times
are noticeable especially when one builds the target without an introduction of changes to the source code.

Before we started improving the warm build of the Allegro app for iOS platform it took 18 seconds to perform the build on our
Continuous Integration (CI) servers (Mac Mini, 6-Core 3.2 GHz CPU, 32 GB Ram).

Is 18 seconds too much? When you put it into a perspective of 1 year:

> 18 seconds × 6 builds per hour × 8 hours per day × 20 days per month × 12 months per year = 207360 seconds = 3456 minutes = 57
> hours 36 minutes

It means that on average a programmer spends around 57 hours 36 minutes yearly to wait for a feedback if their code is correct. Is it
much? I leave the answer to you, but it definitely hinders developer's experience and distracts the developer from their job.

To make the developer's experience better, we, the iOS Mobile Core Team at Allegro, have set the goal to minimize the time developers
spend between hitting the build button and getting the feedback on their code as quickly as possible.

How could the goal be achieved? Well, before I answer that, let's put some light onto how to actually measure build times.

## Measurements

Developers building software for Apple platforms use the [Xcode](https://developer.apple.com/xcode/) application which has a command
line interface called `xcodebuild`. The Xcode has an option to output times for build phases from the menu
`Product > Perform Action > Build With Timing Summary` (doesn't seem to work on Xcode 12.2 at the time of writing this
blog post). To get build times with `xcodebuild` for our Allegro app for each build phase of the main target the following command
can be used:

```sh
xcodebuild -workspace 'Allegro/Allegro.xcworkspace' \
-scheme 'Allegro' \
-configuration 'Debug' \
-sdk 'iphonesimulator' \
-arch 'x86_64' \
-showBuildTimingSummary \
build \
| sed -n -e '/Build Timing Summary/,$p'
```

In the case of the Allegro app it outputs the following lines when I do a **clean** build with Xcode 12.2's `xcodebuild`
(Mac Book Pro 2.2 GHz 6-Core Intel Core i7 CPU, 32 GB RAM):

```sh
Build Timing Summary

CompileC (49 tasks) | 174.459 seconds

CompileSwiftSources (3 tasks) | 31.747 seconds

CompileStoryboard (6 tasks) | 29.057 seconds

PhaseScriptExecution (8 tasks) | 22.320 seconds

Ditto (21 tasks) | 22.282 seconds

Ld (3 tasks) | 13.432 seconds

CompileAssetCatalog (1 task) | 6.620 seconds

ValidateEmbeddedBinary (2 tasks) | 6.528 seconds

CompileXIB (1 task) | 5.000 seconds

CodeSign (3 tasks) | 1.419 seconds

CopyPNGFile (3 tasks) | 1.236 seconds

Touch (4 tasks) | 0.318 seconds

Libtool (1 task) | 0.241 seconds

LinkStoryboards (2 tasks) | 0.108 seconds
```

There's a lot of tasks. When it comes to source code compilation process, we can lower down build times by splitting the source code
into modular frameworks, using binary caching techniques and adding explicit types for expressions in Swift.

In the case of a **warm build** the only phases listed are:

```sh
Build Timing Summary

PhaseScriptExecution (6 tasks) | 23.350 seconds

ValidateEmbeddedBinary (2 tasks) | 2.424 seconds

** BUILD SUCCEEDED ** [27.238 sec]
```

Thanks to performing the **warm build** it can be easily noticed that there's a room for improvement when it comes to
`PhaseScriptExecution` part of the build process. This is actually the part over which we have the control of. Let's see, what we can
do in order to speed up the build time by playing with what and how scripts get executed.

## Cleaning up run scripts

First thing we did with for our iOS application target was selecting scripts which can be run only for Release builds. There's an easy way
in Xcode to mark them as runnable for such builds only - just select `For install builds only` checkbox.

![Run script: For install builds only - checkbox in Xcode]({{site.baseurl}}{% link /img/articles/2020-12-28-speeding-up-warm-builds/xcode-run-for-release.png %})

What jobs are great for running only for Release builds? We selected a few:

- uploading debug symbols to 3rd party monitoring services
- setting endpoints or enabling Apple Transport Security (ATS) for Debug/Release builds
- selecting proper `.plist` files for Debug/Release builds

Not all tasks can be selected as Release - only. Some of them need to be run for Debug and Release builds, but they don't have to be
run for every build. Xcode 12 introduced a neat feature - running the script based on dependency analysis.

![Run script: Based on dependency analysis - checkbox in Xcode]({{site.baseurl}}{% link /img/articles/2020-12-28-speeding-up-warm-builds/xcode-dependency-analysis.png %})

Selecting the checkbox isn't enough to benefit from dependency analysis. Xcode analyses dependencies of a script, i.e. it verifies if the
inputs of the script have changed since the last run and if the outputs of the script exist. The potential problem occurred for scripts in our
project - they didn't have explicit inputs and outputs defined so we couldn't tap into the brand new feature of Xcode.

## Defining inputs and outputs for scripts

One of the scripts in our project which is time-consuming copies bundles with resources of each module. Our Xcode workspace consists
of multiple projects. The main project contains the application target which depends on modules built by other projects. The projects
contain static frameworks with resources. The resources for each framework are wrapped in `.bundle` wrapper and are embedded in
the framework. All frameworks are linked statically to the application and their bundles are copied by the script to the application
wrapper (`.app`).

The list with `.bundle` files to be copied became an input to our script. We also created a list with paths to which bundles are copied.
Xcode uses a `.xcfilelist` format for such lists, but it's just a file with newline-separated values. The
`copy-bundles-input.xcfilelist` input to our script looks as such:

```sh
$(BUILT_PRODUCTS_DIR)/ModuleX.framework/ModuleX.bundle
$(BUILT_PRODUCTS_DIR)/ModuleY.framework/ModuleY.bundle
$(BUILT_PRODUCTS_DIR)/ModuleZ.framework/ModuleZ.bundle
```

and the `copy-bundles-output.xcfilelist` output:

```sh
$(TARGET_BUILD_DIR)/$(EXECUTABLE_FOLDER_PATH)/ModuleX.bundle
$(TARGET_BUILD_DIR)/$(EXECUTABLE_FOLDER_PATH)/ModuleY.bundle
$(TARGET_BUILD_DIR)/$(EXECUTABLE_FOLDER_PATH)/ModuleZ.bundle
```

File lists can be accessed in a script through environment variables. Each script can have many of them and they are indexed from 0:

- `SCRIPT_INPUT_FILE_LIST_0`
- ...
- `SCRIPT_INPUT_FILE_LIST_1024`
- `SCRIPT_OUTPUT_FILE_LIST_0`
- ...
- `SCRIPT_OUTPUT_FILE_LIST_1024`

There is also a possibility to use input and output files instead of a list (not shown on the screens):

- `SCRIPT_INPUT_FILE_0`
- ...
- `SCRIPT_INPUT_FILE_1024`
- `SCRIPT_OUTPUT_FILE_0`
- ...
- `SCRIPT_OUTPUT_FILE_1024`
- and additionally the `SCRIPT_INPUT_FILE_COUNT` and `SCRIPT_OUTPUT_FILE_COUNT` can be used

We based our script copying resource bundles only on file lists and it's actually quite simple - it just copies files from the
input file list to the destination which is the path to the executable.

```sh
destination="${TARGET_BUILD_DIR}/${EXECUTABLE_FOLDER_PATH}"
grep -v '^ *#' < "${SCRIPT_INPUT_FILE_LIST_0}" | while IFS= read -r bundle_path
do
    if [ -d "$bundle_path" ]; then
        rsync -auv "${bundle_path}" "${destination}" || exit 1
    fi
done
```

In the end we tapped into using Xcode's dependency analysis for a few run scripts and it allowed us to improve warm build time.

```sh
Build Timing Summary

PhaseScriptExecution (6 tasks) | 3.666 seconds

ValidateEmbeddedBinary (2 tasks) | 2.314 seconds

** BUILD SUCCEEDED ** [7.500 sec]
```

![Allegro iOS - graph depicting Warm Build Time change over months]({{site.baseurl}}{% link /img/articles/2020-12-28-speeding-up-warm-builds/warm-build-graph.png %})

At the time of writing the **warm build time** on our CI machines takes **4 seconds**. The overall goal of speeding up builds is so that
the **clean build** time becomes equal to **warm build**.

## Links

Some useful links related to improving compilation times for Xcode projects:

- [Xcode Build Time Optimization - Part 1](https://www.onswiftwings.com/posts/build-time-optimization-part1/)
- [Xcode Build Time Optimization - Part 2](https://www.onswiftwings.com/posts/build-time-optimization-part2/)
- [Disabling code signing for Debug builds](https://eisel.me/signing)
