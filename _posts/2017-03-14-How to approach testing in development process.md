---
layout: post
title: How to approach testing in development process?
author: wojciech.lizakowski
tags: [manual tests, tech, iOS, testing, UI testing, test automation, release process, test]
---

### Abstract

Application release process, or in fact software development process, as a release is the final stage of application
development, is not an easy thing. Books and IT websites discuss many approaches and each has its supporters and
opponents. On the one hand, you have product owners, project managers and customers who want a ready-to-use application
as soon as possible. On the other hand, we developers and testers, would like to release an application of the highest
quality, which may somewhat affect the delivery time. Balancing these needs is a hard nut to crack. Usually, both
sides need to make some compromises to establish a common way of working. For developers and testers, it involves
answering several questions concerning software development methods, skills, use of manual or automated testing, and
storage of test cases and test logs. In this article I describe best practices and tips for starting a new project.
Follow them to make the software development process as effective as possible and adjusted to conditions of your project.

## First of all, what testing skills are necessary to deliver a high-quality product?

To answer this question, you need to know what you want to achieve by testing. The first thing that comes to mind is
(especially in the case of commercial products) an application or a system that is ready to use, has no bugs, and
makes its end users happy and willing to use it. To get there, testers and QA engineers should not perceive testing
in terms of simple verification, whether all features are working in accordance to the specified requirements. Their
job is to make sure that these features fit user needs, and improve application usability, so make the application
as user-friendly as possible. It is an important skill, as UX specialists are not always involved in a project.
Therefore, a tester must give feedback regarding application’s look, feel, and potential reaction of end users. What
is more, you should not forget about performance, another factor that affects the way users perceive an application.
No matter how pretty app you have, users will be irritated if it is slow, even if no single bug slipped through testing.
Naturally, usability or performance is only one aspect. The other two, equally important that should be also taken
into consideration, are application security and compliance. Data leaks or others security issues may not only affect
company’s image, but also cause financial consequences. The same for compliance issues understood as lack of
consistency with specific policies applied to e.g. aviation industry, medical devices or banking applications.  

## Waterfall or Agile. Always use as designed?

Companies usually choose one specific software development method for all of their projects. However, in seldom cases
it is a customer who wants you to apply a certain methodology. Although development and test teams usually have no
influence on the choice, they are the ones who decide how the method will be applied. Every software development
framework has some rules of engagement. Unfortunately, most teams tend to perceive them as a set of unalterable
principles, as something fixed that cannot be adapted to the real needs of a project and the team itself. For example,
what happens when requirements or application design are subject to frequent changes that must be quickly implemented
and tested? A waterfall model was not designed to deal with frequent changes, so theoretically agile should fit better
here. On the other hand, both models may fail when there is no decision or the decision is changed too often. In such
cases, it is difficult to find the right path to develop and release an application by strictly following one
methodology’s principles. So how to find the most suitable way of working? Be flexible and instead of following the
rules adjust them to the changing conditions of a project. Although it may sound as an agile manifesto, but agile
is not always the best choice. In the event of large projects not subject to changes, with complex (and approved!)
requirements, waterfall (or its variations) may be a better solution. This particular model is more predictable and
reliable when a team does not need to release new versions too often. Waterfall may also work when it is crucial to
have very good test coverage and very low internal to external defects found ratio. Obviously, the above requirements
are difficult to meet when working in an agile way, with frequent releases and not enough time for bug fixing.
Eventually, a team would have to come to terms with bugs found on production environment.

## Automation vs manual testing – only one or both?
Application testing is the most discussed topic. Should you execute only manual, repeatable, and thus boring tests or
rely on fast and convenient automated testing? The answer is not that obvious. There are cases when automated testing,
although looks very promising at the first sight, occurs to be difficult to implement or time-consuming. Let’s take a
look at some common opinions on manual and automated tests.

* Automated tests

<ol>
<li>Faster and more effective</li>

That is indeed true, but only with a stable test setup and well-designed test scripts. The initial work that involves
setting up the whole environment contributes to the effectiveness of tests and their further use. If you fail at this
stage, testers may spend more time solving test setup problems than on testing. Naturally, when the environment is
stable, automated regression testing is faster than the manual one, and may be even run for each new build on a daily basis.

<li>Cost effective</li>

Test environment setup and test design are cost- and time-consuming. However, if it is done properly, automated
testing is indeed cheaper and faster than the manual approach. Actually, it is easier to write automated tests than
deal with poorly designed setup.

<li>Less tiresome</li>

If regression testing is run on a regular basis, testers carrying out manual tests may become somewhat frustrated and
bored of doing the same things again and again, which may affect their effectiveness and mindfulness. For this reason,
testers are often more interested in developing automated tests for the regression testing purpose than to manually
execute the same set of test cases every time.

<li>You can run them at a regular basis</li>

It is the main advantage of automated tests. As you can use them to test builds on a daily basis, the development team
receives feedback almost immediately. However, there is a risk that the tests may become blind over time ¬– test
scenarios, if not updated, verify the same paths as at the first run. It may happen that a small change in the code
will remodel some of the application features, but the tests will pass anyway. How is it possible? Because these
tests do not “see” UI changes or strings displayed outside the lines. They only check if all features are working
properly (although it depends on applied frameworks).
</ol>

* Manual testing

<ol>

<li>It simulates what the end user does</li>
As automated tests are basically robots, they do not reflect the real user’s world in 100%. Testing frameworks operate
by following a fixed pattern, while users may use an application in a completely different way, not covered by
automated tests. Testers, unlike robots, have intuition, which is a substantial skill in the case of exploratory
testing. Besides, manual tests allow QA engineers to check more specific things such as cooperation with an operating
system. Naturally, there are frameworks that may test it, but they are not as flexible as QA engineers checking
certain features manually.

<li>Easy to start with</li>
A low entry threshold for new team members is the main advantage of manual testing. Well-designed test cases saved in
a test management tool (such as ‘TestLink’, ‘HP Quality Center’, etc.) are easy to follow, so new team members can
start the test execution on their own. Besides, as creating new test cases is not complicated even beginners can handle it.

<li>Faster and more effective in the case of applications undergoing frequent changes</li>
When an application undergoes changes, the QA team may not keep up with creating new automated tests. So in this
particular case, manual testing is faster and more effective due to its flexibility. Anyway, it does not mean that
automated tests are unnecessary.
</ol>

After reading the previous paragraphs, finding the best solution should be easier. Testers or QA engineers should
consider their choice well and include all the factors mentioned above. Eventually, the best choice depends on
knowledge and experience of QA engineers.

## Testing tools – do you need them? Which should you choose?

Less experienced engineers often ask about testing tools. An absolute must-have is a test management tool to keep
any requirements-to-test cases coverage and track bug-to-test cases. The market offers a lot of commercial and free
tools such as `Test Link` or `HP Quality Center` mentioned above or a free Polish tool – `Test Arena`. A decision
concerning the choice of a tool should be carefully considered in terms of ROI (return of investment). Any potential
migration of test cases between different tools following a change of decision may be time-consuming and sometimes
difficult to execute. The same rule applies to defect tracking tools, with `JIRA` developed by Atlassian being
probably the most popular one. Its main advantage is a `JIRA` Agile add-on (recently incorporated in a standard `JIRA`
  version) that allows users to manage user stories and linked test cases. Therefore, it can be used in an agile
  project as the only test management tool. All in all, `Excel` spreadsheets are insufficient to do the job.  
Next thing is choosing a tool for designing and execution of automation tests, which depends on a type of developed
application/system (e.g. web or mobile app) and applied technology. If you are dealing with websites, try `Selenium`.
In the case of Android apps, try `Espresso`, and for iOS – `XCUITest`. Nonetheless, test other frameworks to select
the one that suits your project best.

## Application release. Case study

I discussed advantages and disadvantages of various testing approaches and software development methods in previous
paragraphs. Nevertheless, it turns out that releasing a reliable application is not easy. When we started a new
project, a German version of Allegro iOS app, we had to find the best solution. We decided to adjust an agile model to
the needs and conditions of our project for more effective QA work. The problem was that we couldn’t receive final
mock-ups and user stories, as they were continuously modified. So we decided to base on those few requirements that
were already agreed on and could be considered stable. We started writing manual tests cases using our test management
tool. It was a good idea, as we had a lot of questions about different states of an application, its behavior, edge
cases, etc. Eventually, it resulted in fewer bugs at the end of a development stage. When TCs were ready, we asked
developers, UX engineers and a product owner to review our tests. They pointed out cases we did not think of and
cleared some information in TCs. It gave us better insight into how the application should work, and gave us great
project documentation. We created manual test cases being a base for regression testing. But first, we used them for
regular functional testing of new features. Then we included test cases created for new features to a new regression
test set, and ran it one more time when a release candidate was ready. Although it may seem that with an increasing
number of regression test cases it took more time to execute the regression tests with each release, it did not.
For each release specific regression test, cases were chosen based on areas subject to changes. After testing new
features for a specific release, there was no need to run all test cases for that feature if nothing was changed.
It was sufficient to run the main test scenarios only. As a result, the set for regression testing were always
different. Therefore, we knew how much time testing might take. And what happened when we found new bugs when running
regression tests? In such situation, a product owner, QA engineers, UX specialists and developers discussed the bugs
criticality. Such defect triage allowed us to decide what to fix in next releases, and what had to be fixed
immediately. When developers created a new build with all necessary fixes, we ran the test once again, but we used
less test cases just to check areas with modified code and verify core functionalities. After finding a new critical
issue, we repeated the process one more time. Fixes are always checked using separate branches, so quite often a fix
is developed based on the latest build.

You may wonder where is the automation in this process? We have one set of automated sanity tests for new builds. It
covers main functionalities of an application and is run on all branches, so feedback concerning builds is quick. We
also use the set as a basic check for regression tests. When a number of automated tests is increasing, we replace
manual tests with them in regression testing. But it does not mean that eventually all regression manual tests will
be automated. At the very beginning of a project, before we developed the process described above, no automated tests
were created. We considered it too time-consuming as some implemented functionalities were only a temporary solution
and meant to be changed in the nearest future. In other words, we would spend a lot of time on test environment setup
and test design to create tests to be executed only a few times, so the ROI would be very low. Therefore, it was
better to focus more on manual testing.

## Summary
As there is no perfect model that would fit every project, QA engineers should decide about the testing process by
taking into account project features. A few factors need to be taken into consideration as well. So, how to find the
happy medium? Be flexible and adjust the model, or some of it parts, that suits the specific conditions of your project.
