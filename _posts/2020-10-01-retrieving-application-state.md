---
layout: post
title: Retrieving application state
author: mariusz.kopylec
tags: [architecture, persistence, aggregate, repository, ddd, domain, hexagonal, clean, java]
---

Most applications need to be able to persist and retrieve their state to be fully functional.
In my [previous post]({% post_url 2020-06-22-persisting-application-state %}) I compared methods for persisting application state.
In this post I will compare the methods for retrieving this state.

## Assumptions
This post, similarly to my [post]({% post_url 2020-06-22-persisting-application-state %}) about persisting application state, will be based on the
“Project Keeper” application project introduced [here]({% post_url 2019-12-12-grouping-and-organizing-classes %}).
I strongly recommend that you read both, especially the first one, because the assumptions and part of the source code presented there also apply to this post.

The evaluation criteria for the state retrieving methods will be the same as for the state persisting methods:
* **keeping aggregate encapsulation** by not adding extra code that breaks it (the fewer violations, the higher the rating)
* **no additional code in the aggregate** which doesn’t break the aggregate encapsulation but is still needed for constructing the aggregate from its persisted
  state (the less code, the higher the rating)
* **simplicity of the infrastructure code** responsible for retrieving the state from data sources (the simpler, the higher the rating)

## Methods
I will compare five methods for retrieving the `Project` aggregate.
The part of the application needed for analyzing the retrieving methods is as follows:
<pre>
com.itcompany.projectkeeper
├── core
│   └── project
│       ├── Feature.java
│       ├── Identifier.java
│       ├── Project.java
│       └── ProjectRepository.java
└── infrastructure
    ├── httpclient
    │   ├── HttpClientConfiguration.java
    │   └── HttpClientProperties.java
    ├── mongodb
    │   ├── MongoDbConfiguration.java
    │   └── MongoDbProperties.java
    └── persistence
        ├── FeatureMessage.java
        ├── MultiSourceProjectRepository.java
        ├── ProjectDocument.java
        ├── ProjectPersistenceMapper.java
        └── ProjectResponse.java
</pre>
The source code of the `infrastructure.httpclient` and `infrastructure.mongodb` packages was shown in the
[previous post]({% post_url 2020-06-22-persisting-application-state %}).
We will be retrieving the `Project` aggregate by its identifier using the `ProjectRepository`:

```java
public abstract class ProjectRepository {

    protected abstract Project findByIdentifier(String identifier);
}
```

We won’t need `ProjectRequest` to retrieve the aggregate.
This time the `ProjectResponse` will represent the state of the `Project` stored in the REST service:

```java
class ProjectResponse {

    private String identifier;
    private List<FeatureMessage> features;

    // Getters and setters
}
```

The source code of the `ProjectPersistenceMapper` will depend on the retrieving method type.
The [previous post]({% post_url 2020-06-22-persisting-application-state %}) introduced the assumption that the `Project` is persisted in two data sources.
Those are [MongoDB](https://www.mongodb.com/) database and the internal [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) service.
The adapter for the `ProjectRepository` will have the following form:

```java
@Repository
class MultiSourceProjectRepository extends ProjectRepository {

    private MongoTemplate mongoDb;
    private RestTemplate httpClient;
    private ProjectPersistenceMapper mapper = new ProjectPersistenceMapper();

    MultiSourceProjectRepository(MongoTemplate mongoDb, RestTemplate httpClient) {
        this.mongoDb = mongoDb;
        this.httpClient = httpClient;
    }

    @Override
    protected Project findByIdentifier(String identifier) {
        ProjectDocument document = mongoDb.findById(identifier, ProjectDocument.class);
        ProjectResponse response = httpClient.getForEntity("http://internal.itcompany.com/projects/{id}", ProjectResponse.class, identifier).getBody();
        return mapper.mapToProject(document, response);
    }
}
```

Let’s move on to the methods of retrieving the `Project` aggregate.
In order to be able to retrieve the aggregate, `infrastructure.persistence` package must be able to construct it from its persisted state.
We can achieve this in several ways.

### Public factory methods
The aggregate can be constructed from its state by using public factory methods added to each aggregate component.
Aggregate components’ code:

```java
public class Feature {

    private String name;
    private String description;

    public static Feature fromPersistenceState(String name, String description) {
        return isAllBlank(name, description) ? null : new Feature(name, description);
    }

    private Feature(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
```

```java
public class Identifier {

    private String value;

    public static Identifier fromPersistenceState(String value) {
        return isBlank(value) ? null : new Identifier(value);
    }

    private Identifier(String value) {
        this.value = value;
    }
}
```

```java
public class Project {

    private String name;
    private Identifier identifier;
    private List<Feature> features;

    public static Project fromPersistenceState(String name, Identifier identifier, List<Feature> features) {
        return new Project(name, identifier, features);
    }

    private Project(String name, Identifier identifier, List<Feature> features) {
        this.name = name;
        this.identifier = identifier;
        this.features = emptyIfNull(features);
    }
}
```

Mapping code:

```java
class ProjectPersistenceMapper {

    Project mapToProject(ProjectDocument document, ProjectResponse response) {
        if (document == null) {
            return null;
        }
        Identifier identifier = Identifier.fromPersistenceState(document.getId());
        List<Feature> features = null;
        if (response != null) {
            features = response.getFeatures().stream()
                    .map(feature -> Feature.fromPersistenceState(feature.getName(), feature.getSpecification()))
                    .collect(toList());
        }
        return Project.fromPersistenceState(document.getName(), identifier, features);
    }
}
```

**Keeping aggregate encapsulation, rating ★☆☆:**
Let’s suppose that the `Project` aggregate is meant to be constructed without `Feature`s from the business logic perspective.
Adding all-args factory methods allows constructing the `Project` aggregate in undesired way.
This is not a serious issue as long as we ensure that the `Project` is always in valid state.
Thus, it can be confusing for developers as they can start thinking what `Feature`s should be passed.
A much more serious violation of the `Project` encapsulation is making the additional factory methods public.
This makes it possible to create the `Project` anywhere in the `core` package.
Only the `core.project` package should have control over the `Project` aggregate’s state (more on this can be found in the “Project Keeper” application
architecture [post]({% post_url 2019-12-12-grouping-and-organizing-classes %})).
We can make it a bit clearer to other developers why these factory methods were created by naming them `fromPersistenceState`.<br>
**No additional code in the aggregate, rating ★★★:**
The amount of additional code is small, it’s just one additional method per aggregate’s component.<br>
**Simplicity of the infrastructure code, rating ★★★:**
The code that maps the MongoDB document and the HTTP response to an aggregate is simple to understand and extend.

### Public factory methods with reflection
A method similar to the above one, except that the aggregate is constructed using Java reflection API.
We can use Spring’s [BeanUtils](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/BeanUtils.html) to invoke the
factory methods.
Aggregate components’ code:

```java
public class Feature {

    private String name;
    private String description;

    private static Feature fromPersistenceState(String name, String description) {
        return isAllBlank(name, description) ? null : new Feature(name, description);
    }

    private Feature(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
```

```java
public class Identifier {

    private String value;

    private static Identifier fromPersistenceState(String value) {
        return isBlank(value) ? null : new Identifier(value);
    }

    private Identifier(String value) {
        this.value = value;
    }
}
```

```java
public class Project {

    private String name;
    private Identifier identifier;
    private List<Feature> features;

    private static Project fromPersistenceState(String name, Identifier identifier, List<Feature> features) {
        return new Project(name, identifier, features);
    }

    private Project(String name, Identifier identifier, List<Feature> features) {
        this.name = name;
        this.identifier = identifier;
        this.features = emptyIfNull(features);
    }
}
```

Mapping code:

```java
class ProjectPersistenceMapper {

    Project mapToProject(ProjectDocument document, ProjectResponse response) {
        if (document == null) {
            return null;
        }
        Identifier identifier = create(Identifier.class, document.getId());
        List<Feature> features = null;
        if (response != null) {
            features = response.getFeatures().stream()
                    .map(feature -> create(Feature.class, feature.getName(), feature.getSpecification()))
                    .collect(toList());
        }
        return create(Project.class, document.getName(), identifier, features);
    }

    @SuppressWarnings("unchecked")
    private <T> T create(Class<T> object, Object... factoryMethodArguments) {
        try {
            Method method = BeanUtils.findDeclaredMethodWithMinimalParameters(object, "fromPersistenceState");
            method.setAccessible(true);
            return (T) method.invoke(null, factoryMethodArguments);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot invoke persistence factory method for " + object.getName(), e);
        }
    }
}
```

**Keeping aggregate encapsulation, rating ★★★:**
We don’t need to create code that breaks the encapsulation of the aggregate.<br>
**No additional code in the aggregate, rating ★★★:**
The amount of additional code is small, it’s just a one additional method per aggregate’s component.<br>
**Simplicity of the infrastructure code, rating ★☆☆:**
Despite the use of the [BeanUtils](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/BeanUtils.html) in the mapping
code, we still need to create some code ourselves in not type-safe way.
It is the code that resides in `ProjectPersistenceMapper.create` method which is responsible for creating aggregate components.
Using a factory method’s name in the form of string makes changing this name in the future difficult.
The consequence of using reflection is that we will encounter eventual mapping errors only in runtime.
That’s why it will be hard to maintain the correct number and types of the factory methods arguments in the `ProjectPersistenceMapper`.

### State objects
The next method relies on extracting the aggregate state into a separate object and creating a public factory method that constructs the aggregate from
that object.
This method is highly bound to the similar method for persisting aggregates, which I have described in my
[previous post]({% post_url 2020-06-22-persisting-application-state %}), and should be used together with it.
Used alone, it’s just a variation of “public factory methods” that adds an extra state object.
Aggregate components’ code:

```java
public class Feature {

    private State state;

    public static Feature fromState(State state) {
        return state == null || isAllBlank(state.name, state.description) ? null : new Feature(state);
    }

    private Feature(State state) {
        this.state = state;
    }

    public static class State {

        private String name;
        private String description;

        public State(String name, String description) {
            this.name = name;
            this.description = description;
        }
    }
}
```

```java
public class Identifier {

    private State state;

    public static Identifier fromState(State state) {
        return state == null || isBlank(state.value) ? null : new Identifier(state);
    }

    private Identifier(State state) {
        this.state = state;
    }

    public static class State {

        private String value;

        public State(String value) {
            this.value = value;
        }
    }
}
```

```java
public class Project {

    private State state;

    public static Project fromState(State state) {
        return new Project(state);
    }

    private Project(State state) {
        this.state = state;
    }

    public static class State {

        private String name;
        private Identifier identifier;
        private List<Feature> features;

        public State(String name, Identifier identifier, List<Feature> features) {
            this.name = name;
            this.identifier = identifier;
            this.features = features;
        }
    }
}
```

Mapping code:

```java
class ProjectPersistenceMapper {

    Project mapToProject(ProjectDocument document, ProjectResponse response) {
        if (document == null) {
            return null;
        }
        Identifier identifier = Identifier.fromState(new Identifier.State(document.getId()));
        List<Feature> features = null;
        if (response != null) {
            features = response.getFeatures().stream()
                    .map(feature -> Feature.fromState(new Feature.State(feature.getName(), feature.getSpecification())))
                    .collect(toList());
        }
        return Project.fromState(new Project.State(document.getName(), identifier, features));
    }
}
```

**Keeping aggregate encapsulation, rating ★☆☆:**
Similarly to “public factory methods”, this method breaks the aggregate’s encapsulation because it introduces public and all-args factory methods.<br>
**No additional code in the aggregate, rating ★★☆:**
The amount of additional code increases proportionally to the size of the aggregate but is not very large.<br>
**Simplicity of the infrastructure code, rating ★★★:**
The code is similar to what we need in the “public factory methods” approach.
State objects make the code slightly more complicated.

### State objects with reflection
A method similar to the above one, except that the aggregate is constructed using Java reflection API.
This method is also highly bound to the similar method for persisting aggregates, which I have described in my
[previous post]({% post_url 2020-06-22-persisting-application-state %}), and should be used together with it.
Aggregate components’ code:

```java
public class Feature {

    private State state;

    private static Feature fromState(State state) {
        return state == null || isAllBlank(state.name, state.description) ? null : new Feature(state);
    }

    private Feature(State state) {
        this.state = state;
    }

    public static class State {

        private String name;
        private String description;

        public State(String name, String description) {
            this.name = name;
            this.description = description;
        }
    }
}
```

```java
public class Identifier {

    private State state;

    private static Identifier fromState(State state) {
        return state == null || isBlank(state.value) ? null : new Identifier(state);
    }

    private Identifier(State state) {
        this.state = state;
    }

    public static class State {

        private String value;

        public State(String value) {
            this.value = value;
        }
    }
}
```

```java
public class Project {

    private State state;

    private static Project fromState(State state) {
        return new Project(state);
    }

    private Project(State state) {
        this.state = state;
    }

    public static class State {

        private String name;
        private Identifier identifier;
        private List<Feature> features;

        public State(String name, Identifier identifier, List<Feature> features) {
            this.name = name;
            this.identifier = identifier;
            this.features = features;
        }
    }
}
```

Mapping code:

```java
class ProjectPersistenceMapper {

    Project mapToProject(ProjectDocument document, ProjectResponse response) {
        if (document == null) {
            return null;
        }
        Identifier identifier = create(Identifier.class, new Identifier.State(document.getId()));
        List<Feature> features = null;
        if (response != null) {
            features = response.getFeatures().stream()
                    .map(feature -> create(Feature.class, new Feature.State(feature.getName(), feature.getSpecification())))
                    .collect(toList());
        }
        return create(Project.class, new Project.State(document.getName(), identifier, features));
    }

    @SuppressWarnings("unchecked")
    private <T> T create(Class<T> object, Object state) {
        try {
            Method method = BeanUtils.findDeclaredMethodWithMinimalParameters(object, "fromState");
            method.setAccessible(true);
            return (T) method.invoke(null, state);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot invoke persistence factory method for " + object.getName(), e);
        }
    }
}
```

**Keeping aggregate encapsulation, rating ★★★:**
We don’t need to create code that breaks the encapsulation of the aggregate.<br>
**No additional code in the aggregate, rating ★★☆:**
The amount of additional code increases proportionally to the size of the aggregate but is not very large.<br>
**Simplicity of the infrastructure code, rating ★☆☆:**
As in the “public factory methods with reflection” method, here potential mapping errors can also be seen only in runtime.
The implementation of creating aggregate from its state is not the easiest one, although the `ProjectPersistenceMapper.create` method code once implemented
doesn’t have to be changed in the future.

### State creators
A “state objects” method inversion.
Here, instead of creating a state object, we create a stateless state creator which creates the aggregate.
This method combined with “state readers” method from my [previous post]({% post_url 2020-06-22-persisting-application-state %}) lets us create one additional
object instead of two (state reader and state creator can be joined into one state manager).
Aggregate components’ code:

```java
public class Feature {

    private String name;
    private String description;

    private Feature(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public static class StateCreator {

        public Feature createFeature(String name, String description) {
            return isAllBlank(name, description) ? null : new Feature(name, description);
        }
    }
}
```

```java
public class Identifier {

    private String value;

    private Identifier(String value) {
        this.value = value;
    }

    public static class StateCreator {

        public Identifier createIdentifier(String value) {
            return identifier(value);
        }
    }
}
```

```java
public class Project {

    private String name;
    private Identifier identifier;
    private List<Feature> features;

    private Project(String name, Identifier identifier, List<Feature> features) {
        this.name = name;
        this.identifier = identifier;
        this.features = emptyIfNull(features);
    }

    public static class StateCreator {

        public Project createProject(String name, Identifier identifier, List<Feature> features) {
            return new Project(name, identifier, features);
        }
    }
}
```

Mapping code:

```java
class ProjectPersistenceMapper {

    private Identifier.StateCreator identifierStateCreator = new Identifier.StateCreator();
    private Feature.StateCreator featureStateCreator = new Feature.StateCreator();
    private Project.StateCreator projectStateCreator = new Project.StateCreator();

    Project mapToProject(ProjectDocument document, ProjectResponse response) {
        if (document == null) {
            return null;
        }
        Identifier identifier = identifierStateCreator.createIdentifier(document.getId());
        List<Feature> features = null;
        if (response != null) {
            features = response.getFeatures().stream()
                    .map(feature -> featureStateCreator.createFeature(feature.getName(), feature.getSpecification()))
                    .collect(toList());
        }
        return projectStateCreator.createProject(document.getName(), identifier, features);
    }
}
```

**Keeping aggregate encapsulation, rating ★★★:**
We don’t need to create code that breaks the encapsulation of the aggregate.<br>
**No additional code in the aggregate, rating ★★☆:**
The amount of additional code increases proportionally to the size of the aggregate but is not very large.<br>
**Simplicity of the infrastructure code, rating ★★★:**
The code is generally simple, the only disadvantage can be state creators, whose number increases with the number of the aggregate components.

## Summary
Let’s summarize all methods for retrieving aggregates in the form of a table.

| **Method / Criterion**                                                                                                                   | **Keeping aggregate encapsulation** | **No additional code in the aggregate** | **Simplicity of the infrastructure code** | **Total** |
| :---:                                                                                                                                    | :---:                               | :---:                                   | :---:                                     | :---:     |
| <span style="background: #eee; margin: -5px -10px; padding: 5px 10px; display: block;">**Public factory methods**</span>                 | ★☆☆                                 | ★★★                                     | ★★★                                       | ★★★★★★★☆☆ |
| <span style="background: #eee; margin: -5px -10px; padding: 5px 10px; display: block;">**Public factory methods with reflection**</span> | ★★★                                 | ★★★                                     | ★☆☆                                       | ★★★★★★★☆☆ |
| <span style="background: #eee; margin: -5px -10px; padding: 5px 10px; display: block;">**State objects**</span>                          | ★☆☆                                 | ★★☆                                     | ★★★                                       | ★★★★★★☆☆☆ |
| <span style="background: #eee; margin: -5px -10px; padding: 5px 10px; display: block;">**State objects with reflection**</span>          | ★★★                                 | ★★☆                                     | ★☆☆                                       | ★★★★★★☆☆☆ |
| <span style="background: #eee; margin: -5px -10px; padding: 5px 10px; display: block;">**State creators**</span>                         | ★★★                                 | ★★☆                                     | ★★★                                       | ★★★★★★★★☆ |

The ratings were given assuming the usage of the architecture described in my [post](https://allegro.tech/2019/12/grouping-and-organizing-classes.html).
This means that for a different approach, these assessments may look different.

Thanks for reading!
Feel free to begin a discussion in the comments.
