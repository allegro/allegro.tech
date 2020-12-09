---
layout: post
title: Speeding up iOS builds with Bazel
author: [kamil.pyc]
tags: [tech, ios, bazel]
---

When we developed our Allegro iOS app adding new features and with more people contributing to the codebase, we noticed
that build times began to grow. In order to have precise metrics, we started to track clean build time as well as the
amount of code we had. Do these two metrics grow at the same pace?

### Slowing down

![Build time chart](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/build_time_chart.png)

Our measurements started in May 2019 with combined 300k lines of Objective-C and Swift code that took around
~177 seconds to compile. One year later we increased code size by 33% but compilation time grew by 50%.
It’s worth noting that this time is measured on our CI machine which is more powerful than a laptop machine —
build times are about 50% slower on our work Macbooks. To put it into perspective - on average developers do 8
clean builds each day and they will now take about 40 minutes of their work. As we have 25 developers contributing
to the project, this will add up to 16 hours each day and over 300 hours monthly!
We had to make some changes in order to not spend most of our time waiting for the app to compile.
Even if we have split application into smaller projects it all needs to be built into one single application.
Since it's a monolith that needs to be linked together, one "service" cannot be changed in a running app as you would
in microservice backend infrastructure.

![Build details](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/build_details.png)

At first we tried to speed things up with building our 3rd party dependencies with Carthage. However, this was not very
efficient being only a small fraction of our code base. Any improvement was quickly eaten up by adding new code that
needed time to compile. The direction of not compiling the same code over and over was what we were aiming for.

### Bazel

Before we started looking for a solution we outlined what was important for us:

* Ideally it should be transparent to our developers - they should only notice an increase in speed
* It should work with modules that mix Obj-C and Swift
* It should be easy to turn off and switch to standard building Xcode if something goes sideways

Basically, this meant we wanted to keep our current setup while adding a mechanism letting us to share compiled
artifacts(preferably without any special developer integration). Our eyes turned to the open source build
systems - [Bazel](https://bazel.build) and [Buck](https://buck.build). Comparing these two, we chose Bazel since it
provides better support for custom actions
with its Starlak language and it’s more popular in the iOS community.

Bazel is Google's build system that supports C++, Android, iOS, Go and a wide variety of other
language platforms on Windows, macOS, and Linux. One of its key features is its caching mechanism - both local and
remote.

![Bazel logo](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/bazel_logo.png)

Bazel already provides sets of Apple rules that can build a complete application but it didn’t meet our requirements
since mixing Swift and Obj-C is not possible. Another problem is that we would need to do the whole transition at once
since you cannot simply migrate only a part of the project. We decided to create a custom rule that would use
xcodebuild to build frameworks - this means we would use the same build system we currently use in everyday development
and we wouldn't have to change our current project.

Custom rules can be written in Starlak language. In our case we needed to wrap
`xcodebuild` into a `sh_binary` action:

```python
sh_binary(
    name = "xcodebuild",
    srcs = ["/usr/bin/xcodebuild"],
    visibility = ["//visibility:public"]
)
```

Then, we can create a rule that will call `xcodebuild` and produce `target.framework`:

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

Thanks to Bazel, build will only be performed once and rebuild only when any of the target files change.
Once we point to a remote cache with --remote_http_cache we can share this artefact in a shared remote cache.
It’s amazing how easy it is to set up a remote cache.

How can we use Bazel from Xcode, though? Unfortunately, Xcode is not known for great support of external build systems
and there is no way of doing it ourselves since it’s closed source. The only way of extending it are plugins whose 
capabilities are very limited. Fortunately, there is a way: we can use Build Phases that are run each time a project is
built. It's a simple Run Script phase that invokes Bazel and copies created frameworks to BUILT_PRODUCTS_DIR.
When developers are not working on a given module, we use our special tool that will generate a workspace without it
and this target will be built with Bazel in this Build Phase. Thanks to shared remote cache, most of the time instead
of compiling it we would just download precompiled frameworks.

After migrating all of our modules to Bazel we were able to significantly reduce our clean build time. It dropped over
threefold, going from 260s to just 85s. Developers experience improved as well, because Xcode is a lot more responsive
than before because of reducing the number of projects included in the workspace.

It’s worth noting that if any of our scripts or build artefacts contain e.g. local paths they will cause misses in
our cache. To prevent this we monitor our local and CI builds times and cache hits to detect such situations.

### Tests

A couple years ago we moved all of our iOS projects to a single monorepo.
This has drastically simplified development since we don’t have to maintain a pyramid of hundreds of dependencies
between dozens of repositories anymore. One downside is that all projects combined produce over 15.000 unit tests that
take over an hour to build and run. We didn’t want to wait that long in each PR, so we decided to run only a selected
portion of tests affected by introduced changes. To achieve this we had to maintain a list of dependencies between
different projects and that was obviously very error prone.
The chart below shows just a small portion of our dependency tree (generated in Bazel).

![Dependency graph](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/dependency_graph.png)

After the migration to Bazel we can query our dependency graph to get a list of targets that a given file affects
and run unit tests for that target. That improved our experience since we used to manually maintain list of
dependencies beetwen our module which was error prone and time consuming.

![Sample query](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/query.png)

Build results can be cached the same way as build artifacts.
This has dramatically reduced test times of our master branch test plan, as we can run `bazel test //...` and only test
targets that have not been run previously. Take a look at the below chart to see how good our result are:

![Tests time chart](/img/articles/2020-11-25-speeding-up-ios-builds-with-bazel/tests_time_chart.png)

### Conclusion

Integrating Bazel into an iOS project requires some effort, but in our opinion it’s worth it, especially in large scale
projects. We observe more and more companies struggling with fast and scalable builds. Some of the key tech players,
including Lyft, Pinterest and LinkedIn, switched to Bazel for building iOS apps as well. It’s worth watching Keith
Smiley & Dave Lee [talk](https://www.youtube.com/watch?v=NAPeWoimGx8) from Bazel Conf about migration of Lyft app to
Bazel.

We still have the main app target with a large amount of source code that always needs to be compiled.
Currently we are working on splitting the app target into modules, so we can cache this code as well and reduce build
time even further. In the future we will try to make the same Bazel migration with our Android application to achieve
the same build speed improvement and have single build tool for both platforms. We will also try out try another
promising feature, called Remote Execution - so we can use remote workers to perform remote builds. We estimate that
after completion of these plans, we can further reduce our build times to about 10 seconds.
