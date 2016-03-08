---
layout: post
title: Integrating Android project with Codecov
author: artur.stepniewski
tags: [android, code coverage, codecov, continuous integration, tech]
---

If you always search for ways to increase code quality and would like to encourage everyone in your
project to keep high test code coverage all the time, then [Codecov](https://codecov.io) may be another
step in your journey.

You can think of it as an automated code reviewer which constantly reminds you what you can
do to improve your test code coverage. It can be set up to perform build-failing checks on your code
changes if they would degrade code coverage or even suggest which files need to be covered by tests.

This article shows how to set up an open source Android project integration with Codecov as a part
of a Continuous Integration process with [GitHub](https://github.com) as a repository host and
[Travis CI](https://travis-ci.org) as a build server.

## Generating code coverage reports

In order to get code coverage reports you have to gather test execution data first. This process may
differ between a Java module, an Android library project or an actual Android application project.
Following paragraphs describe the necessary configuration based on [Gradle](http://gradle.org) build
system.

### Unit tests

To generate unit tests’ code coverage reports for an Android application or library
project some additional work may be needed. Currently,
[Android Plugin for Gradle](http://developer.android.com/tools/building/plugin-for-gradle.html)
does not generate Gradle report tasks out of the box. One solution is to configure them manually or to use
[jacoco-android-gradle-plugin](http://github.com/arturdm/jacoco-android-gradle-plugin)
that configures code coverage report tasks automatically:

```groovy
buildscript {
  dependencies {
    classpath 'com.dicedmelon.gradle:jacoco-android:0.1.1'
  }
}

apply plugin: 'jacoco-android'
```

To generate code coverage reports for all variants of an application or library you just run
`jacocoTestReport` Gradle task:

```bash
$ gradle jacocoTestReport
```

Now, you can browse to `build/reports/jacoco/<variant_name>` directory and see some nicely generated
HTML reports. By default, the plugin also provides an XML output which will be used by Codecov later
on.

The plugin also contains some predefined exclusion filters for generated classes so they do not end
up in code coverage reports. If there is still a need to provide some additional exclusion filters
it is possible to add them in the plugin extension block:

```groovy
jacocoAndroidUnitTestReport {
  jacocoExcludes += [ '**/AutoValue*.class' ]
}
```

### Instrumentation tests

Apart from testing on a local JVM, Android supports running tests on a real device or an emulator using
[Instrumentation](http://developer.android.com/tools/testing/testing_android.html#TestStructure).
In case of instrumentation tests it is a little bit less hassle. You do not need to create code
coverage report tasks manually. They are already created by the Android Gradle plugin. All you have
to do is set `testCoverageEnabled` to `true` in your build type configuration, e.g.:

```groovy
android {
  buildTypes {
    debug {
      testCoverageEnabled true
    }
  }
}
```

Running UI tests and generating their code coverage reports can be done by running `connectedCheck`
Gradle task.

There is just a slight problem if you want to gather code coverage execution data on a real device
as there are some devices which do not allow that out of the box. Still, if you are using an emulated
environment it works rather well.

### Unit tests in pure Java project

Fortunately, in case of a pure Java project close to no configuration is required in order to get
code coverage reports. You just apply the `jacoco` plugin with XML output enabled:

```groovy
apply plugin: 'jacoco'

jacocoTestReport {
  reports {
    xml.enabled true
  }
}
```

and you are ready to launch `test` and `jacocoTestReport` tasks.

## Pushing reports to Codecov as a CI process step

The real power of integrating code coverage reports with Codecov comes from setting it as a
part of the CI process. This section describes such integration with an open source project
hosted at GitHub and built by Travis CI.

Whenever developers make a pull request to the project it would be great for them to see reports
on how merging their changes may affect the code coverage.

To achieve this with Travis CI a proper `.travis.yml` located in the project root sets the
environment to build an Android project.

```yaml
language: android
jdk: oraclejdk8
env:
  global:
    - ANDROID_TARGET=android-15
    - ANDROID_ABI=armeabi-v7a
android:
  components:
  - tools
  - platform-tools
  - build-tools-23.0.2
  - android-23
  - extra-android-m2repository
  - sys-img-${ANDROID_ABI}-${ANDROID_TARGET}
script:
  - ./gradlew build jacocoTestReport assembleAndroidTest
  - echo no | android create avd --force -n test -t $ANDROID_TARGET --abi $ANDROID_ABI
  - emulator -avd test -no-skin -no-audio -no-window &
  - android-wait-for-emulator
  - adb shell setprop dalvik.vm.dexopt-flags v=n,o=v
  - ./gradlew connectedCheck
after_success:
  - bash <(curl -s https://codecov.io/bash)
```

The actual report upload is done by the `bash <(curl -s https://codecov.io/bash)` command.
Note that this configuration handles both regular unit tests run on the host machine and also
instrumentation tests run on the emulator. You should also remember to adjust the Android SDK,
build tools and emulator SDK version settings to suit your project’s configuration.

You should also go to your [Travis profile page](https://travis-ci.org/profile) to enable
the trigger for the project’s repository so Travis builds it whenever a code change is introduced.

Now, creating a pull request at the project GitHub page should trigger a build. When it succeeds,
the `codecov-io` bot leaves a comment on the pull request with the code coverage information and
a link to the project page at Codecov for more details.

Fortunately, Codecov supports uploading multiple report files without the hassle of merging them
into one beforehand. If you have a multi-module project or a multi-variant Android project you do
not have to take any additional steps here.

## Summary

There are other solutions that can be used to analyze code coverage reports, provide suggestions
and perform checks if the change would degrade the project quality.

[Coveralls](https://coveralls.io) for example offers similar functionality. Currently, the available
[coveralls-gradle-plugin](https://github.com/kt3k/coveralls-gradle-plugin) expects the user to merge
test coverage reports into a single report in a multi-module Gradle project before publishing them
to Coveralls.

Probably, the most feature-rich solution is [SonarQube™](http://sonarqube.org) as it performs
static code analysis alongside code coverage reports. It is also possible to feed it with integration
test results separately from unit test so it is easier to distinguish them in the end report.
The only downside is that it requires self-hosting.

In case of open source and cloud-hosted projects using Codecov may be the most elegant solution
at the time of writing this article. If you want to enhance your CI process to get the most out
of the code coverage reports then integrating with Codecov may probably be the way to go.

Feel free to comment and ask questions. I will be more than happy to answer them.

You can also find a fully working and up-to-date example on Codecov’s GitHub:
[https://github.com/codecov/example-android](https://github.com/codecov/example-android).

Thanks for reading!

