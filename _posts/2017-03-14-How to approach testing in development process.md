---
layout: post
title: How to approach testing in development process?
author: wojciech.lizakowski
tags: [manual tests, tech, iOS, testing, UI testing, test automation, release process, test]
---

### Abstract

Application release process or in fact software development process (as a release is the final stage of application development) is not an easy thing. Many different approaches can be found in books and on IT websites, all have their supporters and opponents. On the one hand, there are product owners or project managers and clients who want working application as soon as possible. On the other hand we the people, representing developing and testing team, would like to release application of the best quality, which might not mean the fastest delivery time. It is hard nut to crack to bring together those opposites. Usually, both sides need to make some compromises to establish common way of working. From the development and testing team perspective that means a need to answer several questions. Which software development methodology should we choose? What people skills are needed? Should we use automation or focus on manual tests? How and where should we store our test cases and history of tests? This article tries to answer what question should be taken into consideration when organizing the project to make software development process as effective as possible in existing project conditions.  

## First of all, what testing skills are needed to deliver product of a good quality?

The answer for this question is basically also the answer for the question about what we want to achieve by testing. The most obvious response is (especially for commercial products) that we want properly working application or system, without any issues with happy end users who enjoy using the application and want to get back
to it. To achieve that, testers and QA engineers should not only think of testing in terms of verification, e.g. whether features that were implemented are working in accordance to the specified requirements. Furthermore if those features fit user needs and make application ergonomic and usable, so it may be quickly learned by new users and be easy to operate.
This is important skill as not all projects engage UX specialists. If such role is missing, this is tester’s responsibility to give feedback regarding application’s look and feel and how it may be received by end users. What is more, we should never forget about another factor that affects application perception by end users – the performance. Good looking but slow application will just irritate users, even if all functionalities are working correctly and there is no single trivial that bug was left opened after acceptance testing.
Of course, usability or performance is only one aspect. Two others equally important that should be also taken into consideration are application security and compliance. Data leaks or others security issues may not only affect company’s image, but also cause financial consequences. The same for compliance issues understood as lack of consistency with some specific policies as e.g. aviation industry, medical devices or bank regulations.  

## Waterfall or Agile. Always used as designed?

Corporations usually choose one specific framework for software development that applies to all projects within the company. However, in seldom cases, sometimes it happens that it is Customer’s requirement to use certain methodology. All in all development & test teams usually have no influence on what methodology is chosen. But it is important to remember that they can always decide how the methodology will be used. Each of software development frameworks has some rules of engagement. Unfortunately, most teams tend to use them as a set of unalterable principles, see them as something completely not flexible and thus do not even try to adapt them to the real needs of projects and the team itself. For example, what happens when our requirements or application design are often changed and the changes must be quickly implemented and tested? Waterfall methodology was not designed to react easily for frequent changes, so Agile should fit better in such situation. On the other hand, they sometimes fail due to lack of decision or decision changing too often. In such cases it is hard to find the right path to develop and release the application effectively and strictly follow methodology’s principles in the same time. So how to find the most fitting way of working? The best thing is to stay flexible and do not follow rules restrictively, but to adapt them to changing conditions in the project. This may look like agile manifesto itself, but not always agile is the best solution for project. For stable and large project with elaborated and agreed requirements Waterfall (or some modification) may be better solution. This methodology is more predictable and more reliable for projects when team does not need to release application often, and in which there is a big pressure to have very good test coverage and very low internal to external defects found ratio. The second point might be hard to achieve in agile projects where there are frequent releases of application and so not enough time for bug fixing. In such cases team very often must reconcile with more bugs found on production environment.

## Automation vs manual testing – only one or both?
The most discussed thing is how we should test application. Whether to execute only manual, repeatable and thus boring tests or rely on fast and nice automated tests? The anser is not so obvious. Surprisingly there are situation when automated tests, at first sight looking very promising, occurred to be not so easy to implement or as a very time-consuming idea. Let’s go through some common opinions on manual and automated tests.

* Automated tests

<ol>
<li>They are faster and more effective</li>

That is indeed true, but only when test setup is stable and test scripts are well designed. The initial work for set up of whole environment defines further effectiveness of tests and possibility to reuse them. If this condition is not fulfilled, testers may spend more time on solving problems with test setup than on testing itself. Of course, when environment
is stable, automated regression testing is faster than manual testing and may be often run even daily after each new build.

<li>They are cost effective</li>

At the beginning there is a high entry threshold for cost and time spent on test environment set up and test design, but if it is done properly and all works well, automated tests are indeed cheaper and faster than manual tests. In daily work writing automated tests are easily than working with not good designed setup.

<li>They are less tiresome</li>

If regression is run regularly, manual testers may quickly become frustrated and bored of doing the same things again and again, what can affect their effectiveness and mindfulness. This is main reason why testers often are more interested in developing automation tests for the regression testing than to manually execute the same set of test cases every time.

<li>They may be run continuously</li>

And this is the main advantage of automated tests. They may be run continuously on daily builds and so they are the fastest way for development team to receive feedback about latest builds. But there is still a risk that this kind of tests may become blind over time as test scenarios, if not updated, check the same paths as at the first run, when they were designed. It is possible that small change made by development team will change a lot of things in application but tests will always pass. This happens because those tests do not see UI changes or strings displayed outside the lines, they are focused only on checking if functionality itself works (but it is depends of used frameworks)
</ol>

* Manual testing

<ol>

<li>It is closer to what the end user does</li>
Automated tests are basically only working robots. They do not reflect fully the real user world. Frameworks go through by application with specific design. User may use application in a completely different and unexpected way than it's designed to be checked by automated tests. Testers have something calls intuition but robots haven't got it yet. It very important skill for exploratory testing. Also in manual tests QA may check more specific things like joint action with whole operating system. Of course frameworks for user host functionality are available but are not so flexible for automated scripts as for QA who can check them manually.

<li>It is easy to start</li>
Main advantages of manual testing is a low entry threshold for new team members. When test cases are well defined in a test management tool (like `TestLink`, `HP Quality Center`, etc.), new person in a team may learn them easily and be able to start test execution very fast. Also creating new test cases is easy for beginners.

<li>It is faster and more effective in case of rapidly changing application</li>
When application changes from release to release and it's not a small change, QA team may fall behind the changed with creating new automated tests. Manual testing in this case is faster and more effective as more flexible, but this situation should not prevent creating automated tests in wider perspective.
</ol>

It is now easy to find perfect solution for project. When testers or QA's decide what they should propose they way of working, they should keep in mind this factors. The best approach may be find in the given situation but it depends of QA's knowledge and experience.

## Testing tools – are we need it? What to choose?

Beginners very often ask about tools which are used in testing. The main tool for every tester is a test management tool and this is absolutely must-have if any requirements-to-test cases coverage needs to be kept and bug-to-test cases tracking. On the market a lot of paid and free tools may be found as Test Link or HP Quality Center already mentioned earlier or free Polish tool Test Arena. The decision which tool to choose should be well thought out in terms of ROI (return of investment) as further transfer of test cases
between different tools after change of decision might be time-consuming and sometimes hard to execute. The same relates to defect tracking tools – the most popular one is probably Jira developed by Atlassian. It’s big advantage is Jira Agile add-on (recently incorporated in standard Jira version) that allows also to manage user stories and connected test cases, so in Agile project can be used as the only one test management tool. All in all, Excel is never enough for test management.  
Another topic is choosing tool for automation tests execution and design, but here everything depends on type of developed application/system (e.g. web app or mobile) and technology used in project. The popular tools for websites is `Selenium`, for Android there is `Espresso` and for iOS `XCUITest`, but you may find your own framework
fitting better for your project as well.


## So how to release application? Live example

Last paragraphs describe advantages and disadvantages of different testing approaches and developing methodologies. It shows that there is no one perfect way to successfully release stable application. When we start new project for iOS Allegro application for Germany we must find the best solution for us. Here I would like to describe how we adapt Agile methodology to the needs and conditions in our project for more effective QA work. The problem was that we couldn’t receive final mock-ups and user stories as they were continuously changing. So as QA we decided to create our design based on those few rare requirements that were already agreed and can be considered stable. We start writing manual tests cases in our test managed tool. This occurred to be a good idea as a lot of questions appeared about different states of application, its behavior, edge cases, etc. It was added value for development process and so at the end of development phase there were fewer bugs implemented than it is usually done due to unstable and not clear requirements. When TCs were finished, we involved developers, UX and PO's in review process of our test cases. They pointed out cases we did not notice and also cleared some information in TCs. That helped all to understand well the way how the application should work and additionally gave us a great documentation of the project. In general in our project we create manual test cases. They are our base for regression testing, when release is coming. But first we use them for normal functional testing of newly implemented features after developers finish their work. Then we include those test cases for new features to new regression test set and we run it one more time when release candidate is ready. It may seem that in this way, as number of regression test cases is increasing, time for executing regression tests is growing in each release. This is not true as for each release specific regression test cases are chosen based on our knowledge about which application areas were affected by changes during ongoing release. After new features were tested in specific release and in the next one no changes were implemented in that area, there is no need to run all designed test cases for that feature. It is enough to run only main test scenarios. So as you see, regression test set is not always the same. This allows us to perform regression tests in predictable time. And what happen when we find new bugs during execution of regression test cases? In such situation Product owner, QA, UX and developer meet together and discuss the importance of found bugs. Such defect triage allow us to decide which of them may by fixed in next releases and which are considered critical and must be fixed  in current release. Then developers prepare new build with all necessary fixes and we start second test run with less test cases to check areas where code was changed and verify core functionalities. When some another new critical issue is found, we repeat all process one more time. But fixes are always checked on separate branches, so often fix is completed on latest build.

You may ask where is the automation in this process? We have one set of automated sanity tests, which is used for smoke testes on new builds. It covers main functionalities in the application and it is run on every branch, so developers have quick feedback for their builds. Also we used it as basic check for regression tests. When number of automated tests increases, we use them to replace manual tests in regression. But it does not mean that in the course of time all regression manual tests cases will be automated. In the very beginning of the project, before we developed process described above, no automated tests were created as it was considered too time consuming due to the fact that some implemented functionalities were known to be part-time solution and meant to be changed in the nearest future. That means we would spend a lot of time on test environment setting and test design and those tests would be executed only few times, so the ROI would be very low. In such situation it was better to focus more on manual testing.  


## Summary
There is no one ideal methodology that would fit for testing process in every project and QA engineers should decide how the testing process should look depending on the character of starting project. Few factors need to be taken into consideration. So how to find the happy medium? Keep maximum flexibility and adapt the methodology or some of it parts to
fit the best for the specific conditions of the project.
