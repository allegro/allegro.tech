---
layout: post
title: Speeding up iOS builds with Bazel
author: [kamil.pyc]
tags: [tech, ios, bazel]
---

As we develop our Allegro iOS app adding new features and more people contributing to the codebase we notice that build
times start to grow. To have precise metrics we begin to track clean build time as well as how much code we have. 
Do these two metrics grow at the same pace? 

### Slowing down

![Build time chart](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/build_time_chart.png)

Our measurements started in May 2019 with a combined 300k lines of Objective-C and Swift code which took around 
~177 seconds to compile. One year later we increased code by 33% but compilation time increased by 50%. 
It’s worth noting that this time is measured on our CI machine that is more powerful than a laptop machine -
build times are about 50% slower on our work Macbooks. To put it into perspective - on average developers do 8
clean builds each day and they will now take about 40 minutes of their work. We have 25 developers contributing
to the project so this will sum up to 16 hours each day and over 300 hours monthly!
We had to make some changes in order to not spend most of our time waiting for the app to compile. 
If you don’t know application development is a little bit different than, let say, backend development.
Even if we have split application into smaller projects it all needs to be built into one single application.
It’s a monolith that needs to be linked together, we cannot change one “service” 
in a running app like it’s possible with microservice backend infrastructure.

![Build details](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/build_details.png)

At first we tried to speed things up with building our 3rd party dependencies with Carthage but this was not very
efficient since it's only a small fraction of our code base. Any improvement was quickly eaten up by adding 
new code that needed time to compile. But the direction of not compiling the same code over and over was what we 
were aiming for.

### Bazel

Before we started looking for solution we outlined what was important for us:
* Ideally it should be transparent to our developers - they should only notice speed increase 
* Works with modules that mixes Obj-C and Swift
* Should be easy to turn off and switch to standard building Xcode if something goes sideways 

Basically that means we would like to keep our current setup but add a mechanism that will make it possible to 
share compiled artifacts and do it without any special developer integration. Our eyes turned to the open source build 
systems - Bazel and Buck. Comparing those two we choose Bazel since it provides better support for custom actions 
with its Starlak language and it’s more popular in the iOS community. 

[Bazel](https://bazel.build) is Google's build system that supports C++, Android, iOS, Go and a wide variety of other
language platforms on Windows, macOS, and Linux. One of its key features is its caching mechanism - both local and 
remote.

![Bazel logo](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/bazel_logo.png)

Bazel already provides sets of Apple rules that can build whole application but it didn’t meet our requirements since
mixing Swift and Obj-C is not possible, another problem is that we would need to do the whole transition at once since
it is not possible to migrate only part of the project. We decided to create a custom rule that would use xcodebuild to
build frameworks - this means we would use the same build system we currently use in everyday development 
and we don’t have to change our current project.

Custom rules can be written in Starlak language, for us we would like to wrap 
`xcodebuild` into a `sh_binary` action:

```python
sh_binary(
    name = "xcodebuild",
    srcs = ["/usr/bin/xcodebuild"],
    visibility = ["//visibility:public"]
)
```

Then we can create rule that will call `xcodebuild` and produce `target.framework`:

```python
def _impl(ctx):
  name = ctx.label.name
  pbxProj = ctx.file.project
  output_config = "CONFIGURATION_BUILD_DIR=../%s" % ctx.outputs.framework.dirname

  ctx.actions.run(
        inputs = [pbxProj] + ctx.files.srcs,
        outputs = [ctx.outputs.framework],
        arguments = ["build", "-project", pbxProj.path, "-scheme", name, output_config],
        progress_message = "Building framework %s" % name,
        executable = ctx.executable.xcodebuild,
    )

framework = rule(
    implementation = _impl,
    attrs = {
        "srcs": attr.label_list(allow_files = True),
        "project": attr.label(
            allow_single_file = True,
            mandatory = True,
        ),
        "xcodebuild": attr.label(
            executable = True,
            cfg = "host",
            allow_files = True,
            default = Label("//bazel/xcodebuild")
        ),
      },
      outputs = {"framework": "%{name}.framework"},
)
```

With that we can now build any project we want to, in this case AFNetworking library:

```python

load("//bazel:xcodebuild.bzl", "framework")

framework(
   name = "AFNetworking",
   project = "Pods/AFNetworking.xcodeproj",
   srcs = glob(["Pods/AFNetworking/**/*"]),
)

```

Then we can call:

```shell
./bazel/bazelisk build //:AFNetworking
```

and this should be given as an output:

```shell
** BUILD SUCCEEDED ** [11.279 sec]

Target //:AFNetworking:
  bazel-bin/AFNetworking.framework
INFO: Elapsed time: 12.427s, Critical Path: 12.28s
INFO: 1 process: 1 local.
INFO: Build completed successfully, 2 total actions`
```

Thanks to Bazel, build will be only performed once and only rebuild when any of the target files changes.
When we point to remote cache with --remote_http_cache we can share this artefact in a shared remote cache.
It’s amazing how easy it is to set up remote cache. 

But how can we use Bazel from Xcode? Unfortunately Xcode is not known for great support of external build systems and
there is no way of doing it ourselves since it’s closed source and only way of extending it are plugins but their 
capabilities are very limited. Fortunately there is a way - we can use Build Phases - they are run each time a project
is built - it's a simple Run Script phase that is invoking Bazel and copying created frameworks to BUILT_PRODUCTS_DIR. 
When developers are not working on a given module we use our special tool that will generate workspace without it and 
this target will be built with Bazel in this Build Phase. Thanks to shared remote cache most of the time instead of 
compiling it we would just download precompiled frameworks. 

After migrating all of our modules to Bazel we were able to significantly reduce our clean build time - it’s now ⅓ of
what it used to be - build time dropped significantly from 260s to 85s. Developers experience is also better because
Xcode is a lot more responsive than before because of reducing the amount of projects included in the workspace.

It’s worth noting that if any of our scripts or build artefacts will contain e.g. local paths it will cause misses with
our cache. To prevent that we monitor our local and CI builds times and cache hits to detect such situations. 

### Tests

It’s worth noting that a couple years ago we moved all of our iOS projects to single monorepo.
That’s drastically simplified development since we now wouldn’t have to maintain a pyramid of hundreds dependencies 
between dozens of repositories. One downside is that all projects combine into over 15.000 unit tests that take over 
an hour to build and run - we didn’t want to wait that long in each PR, so we decided to run only a selected portion
of tests affected by introduced changes. To achieve this we had to maintain a list of dependencies between different
projects and of course that was very error prone. 
Chart below it's only small portion of our dependency tree (generated in Bazel).

![Dependency graph](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/dependency_graph.png)

After the migration to Bazel we can query our dependency graph to get a list of targets that a given file affects
and runs unit tests for that target. That improved our experience since we used to manually maintain which was error
prone and time consuming. 

![Sample query](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/query.png)

Build results can be cached the same way as build artifacts. 
That has dramatically reduced tests times of our master branch test plan, we can run `bazel test //...` and only test
targets that have not been run previously are running. We can see how much this reduced test time on chart below:

![Tests time chart](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/tests_time_chart.png)

### Conclusion

Integrating Bazel into an iOS project requires some effort but in our opinion it’s worth it, especially in large scale
projects. We see that more and more companies struggle with fast and scalable builds - companies like Lyft, Pinterest 
and LinkedIn switched to Bazel for building iOS apps as well. It’s worth watching Keith Smiley & Dave Lee
[talk](https://www.youtube.com/watch?v=NAPeWoimGx8) from Bazel Conf about migration of Lyft app to Bazel.

We still have the main app target with a large amount of source code that always needs to be compiled.
Currently we are working on splitting the app target into modules so we can cache this code as well and reduce build
time even further. In the future we will try to make the same Bazel migration with our Android application to achieve
the same build speed improvement and have the same build tool for both platforms. Also we will try another promising 
feature Remote Execution - so we can use remote workers to perform remote builds.