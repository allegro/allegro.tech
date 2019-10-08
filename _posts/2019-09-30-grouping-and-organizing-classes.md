---
layout: post
title: Grouping and organizing Java classes 
author: mariusz.kopylec
tags: [tech, architecture, package, ddd, domain, hexagonal, clean, java]
---

One of the first challenges the programmer has to face is organizing classes within the project.
The problem may look trivial but it's not.
Still it's worth spending enough time to do it right.
I'll show you why this aspect of software development is crucial by designing sample project's architecture.

## Assumptions
Let's assume that we have to create a “Project Keeper” application for managing projects at IT company.
Thanks to the application, project managers will be able to create projects and assign teams to them.
We know that after some time, the DI (dependency injection) framework currently used by company's software will be replaced by another solution.
As part of cost reduction, the company plans to stop using Oracle database and replace it with some open-source solution.
The application has to be primarily available via HTTP through the browser.
Sometimes, however, access from the operating system terminal will be needed.

## Implementation
Bearing in mind the above assumptions, we want to implement the application in such a way that it is easy to introduce the changes mentioned in them.
Let's think for a moment what our application really is.
The main part of it will be business logic, that is the use cases that we expose to users.
Let's call this part of the application a **core**.
Users must be able to use available use cases, which is why they should be presented to them in some way.
At the moment, the use cases are to be presented via the HTTP API that the frontend application will consume and via the operating system's terminal.
Let's call this part of the application a **presentation**.
Our application will need to communicate with an external system: a database.
Let's call the part responsible for this communication, but also for all other technical aspects not related to business logic, an **infrastructure**.
It turns out that this is not an innovative view of the application.
The above approach to splitting application is one of the fundamental assumptions of Domain-Driven Design, Clean and Hexagonal architectures.
The assumptions of our application show that it must be prepared for changing the DI framework.
So let's make the core independent of it.
Such independence will also make it easier for us to test the core in isolation if we decide to implement such tests.
By getting rid of the framework from the core, we get rid of the possibility of using automatic DI.
We must therefore manually configure all dependencies.
Let's introduce the next part to the application: core **configuration**, where we will do it.

We need to determine one very important detail: the relationships between application parts.
The benefits of the proposed division of the application will be visible only if the core will be completely independent of infrastructure, presentation and configuration.
This means that no class from outside the core can be used in the core.
The relationships between the parts of the application will look like this:

<img alt="Project Dependencies" src="/img/articles/2019-09-30-grouping-and-organizing-classes/project-dependencies.png" />

Using such a division we can easily:
* change ways of presenting use cases without affecting the core
* replace external systems which the application communicates with without affecting the core
* test business logic in isolation by testing the core itself
* find the classes responsible for individual parts of the application
* limit the visibility of classes to **encapsulate** the internal aspects of each part of the application

It is not by accident that I used a bold font for the word encapsulation.
In my opinion, this is the most important thing we can get by grouping and organizing project's classes.
Thanks to it we can:
* clearly define the rules of communication between packages
* be sure that the class will not be used incorrectly and/or in the wrong place

If we combine encapsulation at the package level with that at the level of a single class, we get a surprising result.
Creating so-called spaghetti code will be seriously hindered :)

Let's divide our project into main packages according to the above information:
```
com.itcompany.projectkeeper
├── configuration
├── core
├── infrastructure
└── presentation
```
Let's now focus on each package individually.

### Core
Business logic will focus on projects and teams.
At the IT company, various teams deal with various types of projects.
For example, programmers create software, UX designers design user interfaces, analysts analyze data.
Project type is therefore something common to the project and the team.
Let's map all of this to the application's structure by adding additional packages to the core:
```
com.itcompany.projectkeeper
├── configuration
├── core
│   ├── common
│   ├── project
│   └── team
├── infrastructure
└── presentation
```
By doing this that way we make it easy to:
* deduce what is the purpose of the application
* find classes operating on individual domain objects
* use class visibility restrictions to encapsulate internal packages' aspects

Here we also need to determine the dependencies between the packages.
The `common` package should not have any dependencies.
In an ideal world, the `project` and` team` packages should depend only on the `common` package.
In fact, it can often be differently.
Let's assume that each team is evaluated for the number of completed projects.
In this situation, the `team` package must also depend on the `project` package, because information about which project has been completed must be passed to the `team` package.
Let's try to make this relationship as loose as possible.
Let's present the dependencies between the packages in the `core` package on the diagram:

<img alt="Core Dependencies" src="/img/articles/2019-09-30-grouping-and-organizing-classes/core-dependencies.png" />

Now let's think about how to encapsulate the `project` package.
Generally, the less public classes and methods the better.
Let's first create a publicly available `ProjectService`, which will be the entry point to the` project` package.
According to Domain-Driven Design, we extract the `Project` [aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html).
Ideally, the `Project` methods would have a package-private visibility, but as I mentioned earlier, the` team` package will need access to the `Project`.
To minimize this dependency, let's make public only those `Project`'s methods that do not change its state.
With this approach, only the `project` package will have control over the `Project` object.
The state of the `Project` needs to be persisted outside the application, for this we will use the `ProjectRepository` [repository](https://www.martinfowler.com/eaaCatalog/repository.html).
In order to make the core independent from the infrastructure, the repository must be an abstract entity.
I suggest using an abstract class for this, not an interface, because the class methods may have protected visibility.
Thus they will not be visible outside the `project` package.
We'll limit the visibility for the rest of the `project`'s classes to package-private one.

Let's do the same with the `team` package, let's create the `TeamService`, `Team` and` TeamRepository` classes.
Let's also add a `ProjectType` to the `common` package.
In the `common` package most classes will have public visibility.
Similarly to the `project` and` team` packages, let's create an entry point for the `core` package: a `ProjectKeeper` class.
The only stateless classes that the `ProjectKeeper` can access are `ProjectService` and `TeamService`.
So let's delegate work from the `ProjectKeeper` to them.
For the `ProjectKeeper` to be usable, you will need a number of [DTO](https://martinfowler.com/eaaCatalog/dataTransferObject.html) objects.

The project structure now looks like this:
```
com.itcompany.projectkeeper
├── configuration
├── core
│   ├── common
│   │   └── ProjectType.java
│   │   └── *.java
│   ├── project
│   │   ├── Project.java
│   │   ├── ProjectRepository.java
│   │   ├── ProjectService.java
│   │   └── *.java
│   ├── team
│   │   ├── Team.java
│   │   ├── TeamRepository.java
│   │   ├── TeamService.java
│   │   └── *.java
│   ├── ProjectKeeper.java
│   └── *Dto.java
├── infrastructure
└── presentation
```

### Infrastructure
In the `infrastructure` package, let's specify how to save `Project` and `Team` aggregates and let's specify the configuration of the Oracle database connection.
We do this in the `persistence` and` oracle` packages, respectively.
We define the way of saving aggregates by creating a `OracleProjectRepository` and a `OracleTeamRepository`, which will implement the `core`'s repositories.
In case of database replacement, we will only replace these implementations and the application core will remain intact.
Let's configure the connection to Oracle in the `OracleConfiguration` class.
The framework's capabilities can help us to encapsulate packages.
Thanks to its automatic DI, we can limit the visibility of all classes to package-private.

Let's change the structure of the project:
```
com.itcompany.projectkeeper
├── configuration
├── core
│   ├── common
│   │   └── ProjectType.java
│   │   └── *.java
│   ├── project
│   │   ├── Project.java
│   │   ├── ProjectRepository.java
│   │   ├── ProjectService.java
│   │   └── *.java
│   ├── team
│   │   ├── Team.java
│   │   ├── TeamRepository.java
│   │   ├── TeamService.java
│   │   └── *.java
│   ├── ProjectKeeper.java
│   └── *Dto.java
├── infrastructure
│   ├── oracle
│   │   └── OracleConfiguration.java
│   └── persistence
│       ├── OracleProjectRepository.java
│       └── OracleTeamRepository.java
└── presentation
```

### Presentation
In the `http` and` console` packages, we implement access to the `core` package from the HTTP endpoint and the terminal.
For HTTP purpose, let's add the `ProjectKeeperEndpoint` using the framework to help us handle the requests.
Let's also add the `ProjectKeeperConosle` where we implement access from the terminal.
Both of these classes will access the `core` package through the `ProjectKeeper`.
Here, all the exceptions thrown from the `core` package will be handled.
Classes' visibilities can be safely set to package-private.

The structure of the project will change as follows:
```
com.itcompany.projectkeeper
├── configuration
├── core
│   ├── common
│   │   └── ProjectType.java
│   │   └── *.java
│   ├── project
│   │   ├── Project.java
│   │   ├── ProjectRepository.java
│   │   ├── ProjectService.java
│   │   └── *.java
│   ├── team
│   │   ├── Team.java
│   │   ├── TeamRepository.java
│   │   ├── TeamService.java
│   │   └── *.java
│   ├── ProjectKeeper.java
│   └── *Dto.java
├── infrastructure
│   ├── oracle
│   │   └── OracleConfiguration.java
│   └── persistence
│       ├── OracleProjectRepository.java
│       └── OracleTeamRepository.java
└── presentation
    ├── console
    │   ├── ErrorHandler.java
    │   └── ProjectKeeperConosle.java
    └── http
        ├── ErrorHandler.java
        └── ProjectKeeperEndpoint.java
```

### Configuration
To supply the `core` package with repositories' implementations from the `infrastructure` package, let's create a `ProjectKeeperConfiguration` class.
Its task will be to build and expose the `ProjectKeeper` from the `core` package to the `presentation` package.
Let's use the framework to make the `ProjectKeeper` class injectable by DI.
The `ProjectKeeperConfiguration` class may have package-private visibility.

Ultimately, the project looks like this:
```
com.itcompany.projectkeeper
├── configuration
│   └── ProjectKeeperConfiguration.java
├── core
│   ├── common
│   │   └── ProjectType.java
│   │   └── *.java
│   ├── project
│   │   ├── Project.java
│   │   ├── ProjectRepository.java
│   │   ├── ProjectService.java
│   │   └── *.java
│   ├── team
│   │   ├── Team.java
│   │   ├── TeamRepository.java
│   │   ├── TeamService.java
│   │   └── *.java
│   ├── ProjectKeeper.java
│   └── *Dto.java
├── infrastructure
│   ├── oracle
│   │   └── OracleConfiguration.java
│   └── persistence
│       ├── OracleProjectRepository.java
│       └── OracleTeamRepository.java
└── presentation
    ├── console
    │   ├── ErrorHandler.java
    │   └── ProjectKeeperConosle.java
    └── http
        ├── ErrorHandler.java
        └── ProjectKeeperEndpoint.java
```

## Summary
If you've never delved deeply into topics related to application architecture, I hope that I encouraged you to do so.
The presented approach is obviously not the only right way to group classes.
It works well in business applications but, for example, it doesn't quite fit into all kinds of libraries.
It also can be enhanced by using [Java 9+ modules](https://www.oracle.com/corporate/features/understanding-java-9-modules.html).
If you know/use alternative ways to organize classes into packages, share them in the comment.

And now the most important thing.
One word for you to remember: **encapsulation**.
Use it and the quality of your code will increase significantly.

That's all, thanks for reading!
If you need to know more add a comment.
