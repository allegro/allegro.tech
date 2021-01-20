---
layout: post
title: Evolution of our platform architecture
author: bartlomiej.ignasiak
tags: [architecture, strategy, refactoring]
---

Allegro was founded in 1999. As you can imagine, technology was quite different at that time.
Small startup of three developers wrote first version of the platform. There was no problem with scalability as there
 were only hundreds of users. We didn’t even used any sql database. All data were stored in the files. This first few
years of Allegro are all almost mythical for current developers as no code or data schema is preserved from these
times. Over all those years we have grown up – a small company hiring a few programmers has changed into a
corporation with dozens of teams and hundreds of programmers. Everything was much easier back then when people were,
literally, working together. But with the growing number of programmers, we faced problems that soon turned into
blockers. Our code and its complexity grew along with the company. After some time, we realized that such uncontrolled
growth would block us one day. Application maintenance would become expensive, and any change of the system
behaviour would be risky. That is why we decided to act and our today’s architecture is the result of that decision.
Here is the story of our transition.

### Start of scalability adventure

Around 2005 expotential growth of our platform started to become visible. We spread our traffic to multiple web
servers (soon there were more than one hundred of them). We switched our database to Oracle which offered more
scalability options at that time. Also we wrote multiple cache layers in C to lessen the load on database. These
were quite advanced C/C++ applications that nowadays you simply take from open source world (such as
[ElasticSearch](http://www.elasticsearch.org/) or any [NoSQL](http://en.wikipedia.org/wiki/NoSQL) databases). These
actions offered us a few years of reprieve from scalability monster.

**Pros:**

* quick results at relatively low development costs – there was no sudden revolution at the platform. Scalability
changes appeared when there was need to scale in particular functionality. This way,
we were able to simultaneously develop new features on the platform. We both grew in size and in richness of our
platform.
* independence of enterprise solutions – our platform for a long time stayed independent of enterprise solutions. Our
only such dependency was an Oracle database. That means our platform as whole costed less and our own solutions were
tailored to our exact needs. It was very simple to solve needs of our business when certain features were not
available on the cache layer or search engine. We simply implemented them.

**Cons:**

* ignored open source – we have built almost everything by ourselves. Either we couldn't find right solution to fit
exact our needs, the solutions were full of bloat, or there were issues with stability of the solution. We have built
 whole cache layer, database pooling and our own search engine. It took a lot of time and knowledge to do it right.
 That time could have been used for features development and refactoring.
* we did not shared with the world – we have built multiple applications that are impressive to this day. Our C
daemon that does database connection pooling to Oracle for our PHP application works flawlessly and efficiently for
almost decade now. We could have shared it with open source community. Unfortunately there was always something else
to do.

### Switching from structural code to something quite similar

There were almost no PHP frameworks in 1999. For example [Zend Framework](http://framework.zend.com/) was released in
 late 2005. Besides, you cannot compare today’s support for OOP in PHP with the one in the past. Not to mention that
 the OOP idea in the PHP world is far more popular than it used to be. That’s why in 2008/2009,
we had a big codebase (counted in millions LOC) written almost only in the structural way. At that time we decided to
move our code to a “home-grown” framework. We created a new directory called “framework” within our project, where we
started to write new features. Besides, we rewrote some old ones there too.
But still there was just one project in our repository.

**Pros:**

* quick results – we were able to rewrite some code quickly. Infrastructure did not change,
so we did not need to configure any new machines, or create any new release system, etc.
* we were still in the game – some of you have probably heard the
[netscape story](http://www.joelonsoftware.com/articles/fog0000000069.html). Netscape was developing a new
version of their browser for over three years. By the time it was ready, the company was already a minor player on the
market. We were able to continuously deliver new features for users, while refactoring our system.
* we could still use the “old code”, thus balance between the technical and business profits. Sometimes,
we even used some old function in the new code, when we needed a quick solution.
Back then, I did not realize it was not a good idea.

**Cons:**

* we were able to use the “old code” – we quickly realized that some pieces of the code were actually new on the
top, but under the hood they used a lot of old functions and as a result, the whole logic was old.
* old code affected the new one – it turned out that despite our effort, sometimes we just had to “hack” something to
make the old and new code work together, e.g. the
[autoloading class](http://www.shayanderson.com/php/simple-php-class-autoloading-function-and-tutorial.htm),
which was not compatible with the old one. Moreover, we noticed the
[“broken window”](http://en.wikipedia.org/wiki/Broken_windows_theory) effect – when one person used some old function
 within a class, everyone else felt justified to use another one…
* just one little feature more – this approach was definitely easier for developers: “this feature is just a few lines
 long, so let’s add it to the old system, as it is faster that way”.
* two systems in one – double systems were becoming standard, e.g. we had two mailing systems (new and old one),
etc. Except maintenance cost, there was another problem: without having a deep look at the code,
developers could not estimate the exact time they would need for developing a feature because they didn’t know if
code is new or old “I need a day to write it if it is the new code or 2 weeks if it is the old one”.
* monolith – we had one application and a lot of developers working on it. The framework had some modules,
but after some time there were a lot of connections between them. There was actually nothing that would stop people
from mixing modules with each other. As a result, any system modification was still risky and developers
experienced a lot of problems while merging their code.

### Switching from the old platform to the new one

Of all previously mentioned disadvantages, the fact that we were still working with a monolith was the most disturbing.
As I have written, it was difficult to check if a single modification would not crash any other feature.
It made the development process longer and we were not able to react fast to real-world changes.
Finally, we decided to take the SOA path, which resulted in creating the “new platform”.
We were still writing in PHP and decided to use [Symfony2](http://symfony.com) as a framework. We created a frontend
application (with HTML views, JS, service clients, etc.) and a backend one (with services).
We had all the services in one application, but their code was separated, so we actually could split them into
autonomic instances at any time. How did we do it? We created a team which was working on technical elements of this
new platform. They were responsible for creating complete concepts, conventions, release scripts, etc.
When significant parts of infrastructure were ready, other teams joined in one by one.

**Pros:**

* clear line between new and old code – it was impossible to use an old function in the new code. Therefore,
the old code could not affect the new one. The only way to use an old function was through an
[Anti-Corruptions Layer]({% post_url 2015-01-21-working-with-legacy-architecture %}),
an abstract layer on the top of the old function that “processes” queries submitted to other services.
* new data structures – our services own their data, so they did not have to ensure backward compatibility and
could create new, better structures.
* clear responsibility for services – a developer who wants to change something in the logon process can easily find a
 suitable service and does not have to worry about crashing other parts of a system.
* simplified business logic — when starting from scratch and being unable to use old functions,
we had to rewrite large portions of code from scratch, so we paid attention to which business logic was really used
and which was just legacy code no longer in use. This allowed us to simplify the code and remove many special cases
which were no longer needed, reducing the number of complex if-expressions.
* ease of using new technologies – we were not limited by old technologies and we could easily use whatever we wanted.
 At least in the beginning.

**Cons:**

* waiting for results – while one team was developing the “new platform”, several others were developing in the “old
one” (with a framework). Obviously, later some other teams joined the first one, but to be honest,
it took us so much time that not all teams managed to ever do it.
* being dependent on the team working on the new platform – as there was only one team developing the new platform,
others were unfamiliar with their work. Moreover, the new platform team was unable to support all new teams that
switched to this new solution.
* common frontend meant dependencies (and problems) while releasing new version – although services were separated,
they had common frontend. Moreover, our header, JS and CSS were common for the new and old platform.
That caused a lot of dependencies and as a result, we had to synchronize the release of both platform.
* dependencies – after some time there were dependencies between modules in backend application as well.
* distributed and fuzzy responsibility for maintaining technical aspects of the platform – when a couple of teams
finally started working on the new platform, the business logic was divided between them,
but technical aspects such as background processes or caching system, etc. were not divided and nobody was in fact
responsible for them. It was the result a of previous decision of keeping “so far” all backend services in one backend
application.

### Rubikon

We were much more experienced with
[Service-oriented architecture](http://en.wikipedia.org/wiki/Service-oriented_architecture) after the “new platform”
project. We knew what we had done wrong, and what was OK. We were ready to start the revolution and divide the whole
platform into business domains and business context (according to strategic
[Domain-Driven Design](http://www.infoq.com/presentations/strategic-design-evans) approach). Teams became responsible
 for particular context and started to work on separate services. Those services communicate via an event bus or
 point to point (discovery service). Naturally, we have some commons libraries, but it is up to teams which library
 they need, and when they update it. Moreover, we decided to move into JVM technologies – to Java mostly. There were
 a lot of reasons why we did it – from performance or checking for correct syntax to abundance of tools and
libraries, which PHP is sometimes missing. I am not going to explain why PHP is not always the best available solution,
as you can find online [numerous articles](http://eev.ee/blog/2012/04/09/php-a-fractal-of-bad-design/) about it. We
think this approach is a good one. I would need a separate post to fully describe our current architecture, so
I will give you a brief list of new features:

* no monolith structure – now all services are separated from each other and they are as loosely coupled as possible.
To see the whole platform, you have to look at all the services.
* no common frontend – now each context, e.g. “password reminder” has its own frontend (if it needs any). We have our
own common style bootstrap (similar to e.g. as e.g. [twitter bootstrap](http://getbootstrap.com/2.3.2/)),
which allows teams to keep all buttons, links, forms, etc. coherent. Sometimes,
one single page is built using several [ESI](http://en.wikipedia.org/wiki/Edge_Side_Includes) tags from different
contexts.
* independent release cycle – we can release a service and its frontend whenever we want.
* technological independency – each service can be written in a different language, but we usually use Java,
if there is no reason to use another language.
* services communicate through an event bus if it is possible (to decrease coupling).
* in some situations we agree to have data duplication to keep services decoupled.
* this approach is adopted by all our teams; additionally we have technical teams that deal with issues such as event
bus, discovery service, common libraries, etc.
* if we are not able to rewrite the whole functionality at once, we create
[Anti-Corruptions Layers]({% post_url 2015-01-21-working-with-legacy-architecture %}) to make sure that
the old code structure will not affect the new one.

Such a big transformation would not be possible without understanding and support from business side. Architects
together with Products Owners selected most important domains which were to be rewritten first. They took in to
consider such a criteria as rapidity of change in given domain, flexibility/condition of current solutions,
opportunities to improve behavior of solution, influence on our business, technical importance, etc.
To be honest – we are still rewriting some of those domains.

**Pros:**

* impressive results – with all teams working on code refactoring, we managed to remove over 1,000,000 lines of old
code within one year (some of the lines were deleted, while others were rewritten).
* technological leap – without a centralized application our programmers can try new things. They can choose
the “right tool for the job”. They started to use a whole bunch of new technologies. Some tried
[Kafka](http://kafka.apache.org) as an event bus, while others used [Vert.x](http://vertx.io) for web sockets or
[Spock](https://code.google.com/p/spock/) in Groovy to write tests. Moreover, we are not limited to one database only
. So now depending on the situation we use [Cassandra](http://cassandra.apache.org),
[Mongo](http://www.mongodb.org), [MySQL](http://www.mysql.com), [Oracle](http://www.oracle.com/pl/index.html) etc.
* increase in product involvement – when all teams own a piece of the platform, they become more involved in its
development. They improve it in both business and technical terms.
* clear and easy to understand – we created a lot of really small services that are easy to understand. Even a new
developer can work on an existing service. Such a service is easy to maintain, change,
and rewrite. Its borders are clear.
* independent releases – because services have separated frontends, there is no need to synchronize the release.
* all SOA advantages – I should copy-paste here some articles about SOA, because we simply reap all the benefits.

**Cons:**

* high entry cost – at some point we moved to Java and JVM technologies, so naturally we spent some time on learning.
We had to support teams, by inviting Java developers. Another major issue was splitting responsibility between teams.
In the past, we used to have e.g. one team maintaining some feature, while other was maintaining the feature’s
administration panel. Therefore, the teams had to spend some time on learning from each other and on moving
responsibility.
* too quick pace – when all teams started to create services, we realized that we did not foresee everything. In many
cases, we did not have a functionality, which was crucial for five or even more teams. Obviously, they had to wait
until someone else would create it, or do it by themselves.
* inconsistency – it takes a lot to control all services in such an architecture. It was difficult to make all the
teams play by one rule, thus we had some problems with introducing common standards (e.g. application release,
code reviews or switching to REST).
* system complexity – a consequence of having simple services is that we moved complexity of combining them to higher
level. Now we spend a lot of time on managing them and on designing business processes on them. We even have a new
“Solutions Architect” role in the company to do it. There are also a
[bunch of new challanges](http://highscalability.com/blog/2014/4/8/microservices-not-a-free-lunch.html) as network latency or fault tolerant
 which we have to address.
* testing – testing in such an environment is not a trivial problem. To present a new feature created for the
“payment” area, you need to have a lot of other services working in your environment, e.g. service responsible
for creating offers, searching, buying, etc. Users want to see the whole process, whereas developers are responsible
for their part and cannot work on everything that might be necessary for such a presentation.
That is what makes testing such a challenge.

### Future

What does the future hold? First of all we need to finish rewriting all domains to microservices. Then we definitely
need to improve our tools. We have to improve our release/deployment
tools and modify our monitoring tools to make them an “out-of-the-box” solution, if we do not want to set it up for
every new service. We need automatic self-healing and auto scaling processes. We are going to replace old
[SOAP](http://en.wikipedia.org/wiki/SOAP) API with the new
[REST](http://en.wikipedia.org/wiki/Representational_state_transfer) one (with
[OAuth](http://en.wikipedia.org/wiki/OAuth#OAuth_2.0) authorization) and we are going to become more active in the
open source community. Naturally, there is much more we will do but let’s leave something for next posts.

### Conclusions

So this is it. We’ve gone a long way from structural code to highly decoupled microservices architecture. As you might
have noticed, refactoring a huge application such as the Allegro platform is not an easy task.
You need to think not only about code, but about people and their habits as well. You need to create an environment,
which will naturally support developers in providing good software. Sometimes, you need to modify the way your teams or
even the whole organization work.
