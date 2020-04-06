---
layout: post
title: Persisting application state
author: mariusz.kopylec
tags: [tech, architecture, persistence, aggregate, repository, ddd, domain, hexagonal, clean, java]
---

An application can be defined as a set of use cases.
It often happens that an A use case requires a previously executed B use case for its execution.
In such situation, it should be ensured that the B use case has been executed while executing the A use case.
To achieve this, an application state, that is common to both use cases, is introduced.
The state must be persisted to be visible for more than one use case.
Most often, various types of databases are used for this purpose.
While working with the source code, I encountered various methods of persisting the application state.
I also came up with my own variations.
In the post I will make a subjective comparison of these methods based on the defined criteria.

## Assumptions
This post is a continuation of my [previous post](https://allegro.tech/2019/12/grouping-and-organizing-classes.html) and is based on the application project called "Project Keeper" introduced there.
The source code of the application will be written in Java with the help of the [Spring](https://spring.io/) framework.
Part of the "Project Keeper" application state, which is responsible for IT projects data, will be represented by the `Project` [aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html).
To save the state, a `ProjectRepository` [repository](https://www.martinfowler.com/eaaCatalog/repository.html) will be used.
The [CQRS](https://martinfowler.com/bliki/CQRS.html) and [event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) approaches will not be analyzed.
According to the assumptions of "Project Keeper", the `Project` aggregate will be free from any DI and ORM framework.
An aggregate is by definition an object that ignores how it will be persisted.
To emphasize this, the state of the `Project` aggregate will be stored in the [MongoDB](https://www.mongodb.com/) database and also in the internal [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) service.

The criteria by which the persistence methods will be rated are:
* **breaking aggregate encapsulation** by additional code needed only for state persisting (the fewer such cases, the higher the rating)
* **additional code in the aggregate** needed only for state persisting, which doesn’t break the aggregate encapsulation (the less code, the higher the rating)
* **complexity of the infrastructure code** responsible for storing the state in data sources (the less complicated, the higher the rating)

A 3-grade scale will be used, where 3 indicates the best rate.
The methods will be rated in the context of the architecture presented in my [previous post](https://allegro.tech/2019/12/grouping-and-organizing-classes.html).

## Methods
Five methods for persisting the `Project` aggregate will be compared.
The part of the application needed for analyzing the persistence methods is as follows:
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
        └── ProjectRequest.java
</pre>
Most of these classes will have the same structure, regardless of the persistence method.
The classes that will change are `Feature`, `Identifier`, `Project` and `ProjectPersistenceMapper`.
The `Project` aggregate resides in the `core.project` package and its structure will depend on the type of the persistence method.
The aggregate consists of:
* the `Project` entity, which acts as an aggregate root
* the `Identifier` value object representing the unique identifier of the project
* the list of `Feature` value objects describing the functionalities covered by the project

The `core.project` also includes a `ProjectRepository`:

```java
public abstract class ProjectRepository {

    protected abstract void save(Project project);
}
```
The repository is in the form of a secondary port defined by the [Hexagonal architecture](https://declara.com/content/va7eLmgJ).
The "Project Keeper" application uses two data sources for persisting the aggregate: a MongoDB database and a REST service.
In the `infrastructure.mongodb` package, access to MongoDB is configured:
```java
@ConfigurationProperties("project-keeper.mongodb")
class MongoDbProperties {

    private Duration connectTimeout;
    private Duration socketTimeout;

    @ConstructorBinding
    MongoDbProperties(Duration connectTimeout, Duration socketTimeout) {
        this.connectTimeout = connectTimeout;
        this.socketTimeout = socketTimeout;
    }

    // Getters
}
```
```java
@Configuration
@EnableConfigurationProperties(MongoDbProperties.class)
class MongoDbConfiguration {

    @Bean
    MongoClientOptions mongoClientOptions(MongoDbProperties properties) {
        return MongoClientOptions.builder()
                .connectTimeout((int) properties.getConnectTimeout().toMillis())
                .socketTimeout((int) properties.getSocketTimeout().toMillis())
                .build();
    }
}
```
In the `infrastructure.httpclient` package, the REST service HTTP client is configured:
```java
@ConfigurationProperties("project-keeper.http-client")
class HttpClientProperties {

    private Duration connectTimeout;
    private Duration readTimeout;

    @ConstructorBinding
    HttpClientProperties(Duration connectTimeout, Duration readTimeout) {
        this.connectTimeout = connectTimeout;
        this.readTimeout = readTimeout;
    }

    // Getters
}
```
```java
@Configuration
@EnableConfigurationProperties(HttpClientProperties.class)
class HttpClientConfiguration {

    @Bean
    RestTemplate restTemplate(HttpClientProperties properties) {
        return new RestTemplateBuilder()
                .setConnectTimeout(properties.getConnectTimeout())
                .setReadTimeout(properties.getReadTimeout())
                .build();
    }
}
```
The `infrastructure.persistence` package is responsible for storing aggregate state in the data sources.
All project data, except functionalities, is stored in the MongoDB.
The data is represented by the `ProjectDocument`:
```java
@Document("projects")
class ProjectDocument {

    @Id
    private String id;
    private String name;

    // Getters and setters
}
```
The functionalities are stored in the REST service.
A single functionality is represented by the `FeatureMessage`:
```java
class FeatureMessage {

    private String name;
    private String specification;

    // Getters and setters
}
```
The HTTP request itself looks like this:
```java
class ProjectRequest {

    private List<FeatureMessage> features;

    // Getter and setter
}
```
The `ProjectPersistenceMapper` contains the mapping logic between the `Project` aggregate and its infrastructure representations: the `ProjectDocument` and the `ProjectRequest`.
The logic will depend on the persistence method type.
The adapter for `ProjectRepository` has the following form:
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
    protected void save(Project project) {
        ProjectDocument document = mapper.mapToDocument(project);
        ProjectRequest request = mapper.mapToRequest(project);
        mongoDb.save(document);
        try {
            httpClient.put("http://internal.itcompany.com/projects/{id}", request, document.getId());
        } catch (Exception e) {
            mongoDb.remove(document);
        }
    }
}
``` 
As the `Project` aggregate state is stored in more than one data source, it may occur that the saved state will be incomplete.
It is difficult to eliminate this problem completely, but you can reduce it to a minimum by:
* retrying each sub-save operation in case of error (the operations must be idempotent)
* rollbacking a MongoDB sub-save operation if calling the REST service fails
* preventing the creation of an aggregate in invalid state (an error will be reported as soon as the aggregate state is retrieved, which will prevent the invalid aggregate from spreading to different parts of the application)

Let’s move on to the methods of persisting the `Project` aggregate.
To be able to persist the aggregate state the `infrastructure.persistence` package must be able to read the state.
We can achieve this in several ways.

### Public getters
The aggregate state can be read by introducing public getters for each field.
Aggregate components code:
```java
public class Feature {

    private String name;
    private String description;

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
```
```java
public class Identifier {

    private String value;

    public String getValue() {
        return value;
    }
}
```
```java
public class Project {

    private String name;
    private Identifier identifier;
    private List<Feature> features;

    public String getName() {
        return name;
    }

    public Identifier getIdentifier() {
        return identifier;
    }

    public List<Feature> getFeatures() {
        return unmodifiableList(features);
    }
}
```
Mapping code:
```java
class ProjectPersistenceMapper {

    ProjectDocument mapToDocument(Project project) {
        return new ProjectDocument()
                .setId(project.getIdentifier().getValue())
                .setName(project.getName());
    }

    ProjectRequest mapToRequest(Project project) {
        List<FeatureMessage> features = project.getFeatures().stream()
                .map(feature -> new FeatureMessage()
                        .setName(feature.getName())
                        .setSpecification(feature.getDescription()))
                .collect(toList());
        return new ProjectRequest()
                .setFeatures(features);
    }
}
```
**Breaking aggregate encapsulation, rating 2/3:**
Making all information about an aggregate public breaks its encapsulation.
However, most of the aggregate state must be visible to the `ProjectKeeper` primary port in order to map it to the DTOs and present it to the client.
Therefore, most of the getters in the `Project` aggregate will be public, regardless of the type of persistence method used.
Breaking encapsulation by making methods that change the state of the aggregate public is much more serious than by making read-only methods public.<br>
**Additional code in the aggregate, rating 3/3:**
We don’t need to create additional code in the aggregate.<br>
**Complexity of the infrastructure code, rating 3/3:**
The code that maps the aggregate to a MongoDB document and to an HTTP request is simple to understand and extend.

### Reflection
The method involves the Java reflection API to read the aggregate state.
We can use [ModelMapper](http://modelmapper.org/), which is a library for mapping the state between objects.
Aggregate components code:
```java
public class Feature {

    private String name;
    private String description;
}
```
```java
public class Identifier {

    private String value;
}
```
```java
public class Project {

    private String name;
    private Identifier identifier;
    private List<Feature> features;
}
```
Mapping code:
```java
class ProjectPersistenceMapper {

    private ModelMapper mapper = new ModelMapper();

    ProjectPersistenceMapper() {
        mapper.getConfiguration()
                .setFieldAccessLevel(PRIVATE)
                .setFieldMatchingEnabled(true);
        mapper.typeMap(Project.class, ProjectDocument.class)
                .addMappings(new ProjectPropertyMap());
        mapper.typeMap(Feature.class, FeatureMessage.class)
                .addMappings(new FeaturePropertyMap());
    }

    ProjectDocument mapToDocument(Project project) {
        return mapper.map(project, ProjectDocument.class);
    }

    ProjectRequest mapToRequest(Project project) {
        return mapper.map(project, ProjectRequest.class);
    }

    private static class ProjectPropertyMap extends PropertyMap<Project, ProjectDocument> {

        @Override
        protected void configure() {
            map().setId(source("identifier.value"));
        }
    }

    private static class FeaturePropertyMap extends PropertyMap<Feature, FeatureMessage> {

        @Override
        protected void configure() {
            map().setSpecification(source("description"));
        }
    }
}
```
**Breaking aggregate encapsulation, rating 3/3:**
We don’t need to create a code that breaks the encapsulation of the aggregate.<br>
**Additional code in the aggregate, rating 3/3:**
We also don’t need to create a code that doesn’t break the encapsulation of the aggregate.<br>
**Complexity of the infrastructure code, rating 1/3:**
Despite the use of the library in the mapping code, we still need to define some mappings ourselves in not type-safe way.
These are the mappings defined in `ProjectPropertyMap` and in `FeaturePropertyMap`.
Using names in the form of strings makes changing these names in the future difficult.
The consequence of using reflection is that we will encounter eventual mapping errors only in runtime.

### State objects
The next method relies on extracting the aggregate state into a separate object and create a public getter for that object.
There are two variations of this method:
* aggregate components directly depend on the state object (field in class)
* aggregate components create a new state object each time the getter is invoked

We will focus on only one (the first) of them because, from the rating criteria point of view, there is no difference between them.
Aggregate components code:
```java
public class Feature {

    private State state;

    public State getState() {
        return state;
    }

    public static class State {

        private String name;
        private String description;

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }
    }
}
```
```java
public class Identifier {

    private State state;

    public State getState() {
        return state;
    }

    public static class State {

        private String value;

        public String getValue() {
            return value;
        }
    }
}
```
```java
public class Project {

    private State state;

    public State getState() {
        return state;
    }

    public static class State {

        private String name;
        private Identifier identifier;
        private List<Feature> features;

        public String getName() {
            return name;
        }

        public Identifier getIdentifier() {
            return identifier;
        }

        public List<Feature> getFeatures() {
            return features;
        }
    }
}
```
Mapping code:
```java
class ProjectPersistenceMapper {

    ProjectDocument mapToDocument(Project project) {
        Project.State state = project.getState();
        return new ProjectDocument()
                .setName(state.getName())
                .setId(state.getIdentifier().getState().getValue());
    }

    ProjectRequest mapToRequest(Project project) {
        List<FeatureMessage> features = project.getState().getFeatures().stream()
                .map(feature -> {
                    Feature.State state = feature.getState();
                    return new FeatureMessage()
                            .setName(state.getName())
                            .setSpecification(state.getDescription());
                })
                .collect(toList());
        return new ProjectRequest()
                .setFeatures(features);
    }
}
```
**Breaking aggregate encapsulation, rating 2/3:**
Getters returning aggregate state break its encapsulation, but as with the “public getters” persistence method, this is not a serious issue.
In addition, here the developers can agree to use the `getState()` methods only for persisting the aggregate state.<br>
**Additional code in the aggregate, rating 1/3:**
The amount of additional code is large and increases proportionally to the size of the aggregate.<br>
**Complexity of the infrastructure code, rating 3/3:**
The code is similar to what we need in the “public getters” method.
State objects make the code slightly more complicated.

### State objects with reflection
A method similar to the above one, except that the state object is read using Java reflection API.
Aggregate components code:
```java
public class Feature {

    private State state;

    public static class State {

        private String name;
        private String description;

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }
    }
}
```
```java
public class Identifier {

    private State state;

    public static class State {

        private String value;

        public String getValue() {
            return value;
        }
    }
}
```
```java
public class Project {

    private State state;

    public static class State {

        private String name;
        private Identifier identifier;
        private List<Feature> features;

        public String getName() {
            return name;
        }

        public Identifier getIdentifier() {
            return identifier;
        }

        public List<Feature> getFeatures() {
            return features;
        }
    }
}
```
Mapping code:
```java
class ProjectPersistenceMapper {

    ProjectDocument mapToDocument(Project project) {
        Project.State state = getState(project, Project.State.class);
        return new ProjectDocument()
                .setName(state.getName())
                .setId(getState(state.getIdentifier(), Identifier.State.class).getValue());
    }

    ProjectRequest mapToRequest(Project project) {
        List<FeatureMessage> features = getState(project, Project.State.class).getFeatures().stream()
                .map(feature -> {
                    Feature.State state = getState(feature, Feature.State.class);
                    return new FeatureMessage()
                            .setName(state.getName())
                            .setSpecification(state.getDescription());
                })
                .collect(toList());
        return new ProjectRequest()
                .setFeatures(features);
    }

    @SuppressWarnings("unchecked")
    private <T> T getState(Object object, Class<T> state) {
        try {
            Field field = ReflectionUtils.findField(object.getClass(), "state", state);
            field.setAccessible(true);
            return (T) field.get(object);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot get state field for " + object.getClass().getName(), e);
        }
    }
}
```
**Breaking aggregate encapsulation, rating 3/3:**
We don’t need to create a code that breaks the encapsulation of the aggregate.<br>
**Additional code in the aggregate, rating 1/3:**
The amount of additional code is large and increases proportionally to the size of the aggregate.<br>
**Complexity of the infrastructure code, rating 1/3:**
As in the previous “reflection” method, here eventual mapping errors can also be seen only in runtime.
The implementation of reading aggregate state is not the easiest one, although the `getState(...)` method code once implemented doesn’t have to be changed in the future.

### State readers
A “state objects” method inversion.
Here, instead of creating a state object, we create a stateless state reader.
Aggregate components code:
```java
public class Feature {

    private String name;
    private String description;

    public static class StateReader {

        public String getName(Feature feature) {
            return feature.name;
        }

        public String getDescription(Feature feature) {
            return feature.description;
        }
    }
}
```
```java
public class Identifier {

    private String value;

    public static class StateReader {

        public String getValue(Identifier identifier) {
            return identifier.value;
        }
    }
}
```
```java
public class Project {

    private String name;
    private Identifier identifier;
    private List<Feature> features;

    public static class StateReader {

        public String getName(Project project) {
            return project.name;
        }

        public Identifier getIdentifier(Project project) {
            return project.identifier;
        }

        public List<Feature> getFeatures(Project project) {
            return unmodifiableList(project.features);
        }
    }
}
```
Mapping code:
```java
class ProjectPersistenceMapper {
    
    private Identifier.StateReader identifierStateReader = new Identifier.StateReader();
    private Feature.StateReader featureStateReader = new Feature.StateReader();
    private Project.StateReader projectStateReader = new Project.StateReader();

    ProjectDocument mapToDocument(Project project) {
        return new ProjectDocument()
                .setName(projectStateReader.getName(project))
                .setId(identifierStateReader.getValue(projectStateReader.getIdentifier(project)));
    }

    ProjectRequest mapToRequest(Project project) {
        List<FeatureMessage> features = projectStateReader.getFeatures(project).stream()
                .map(feature -> new FeatureMessage()
                        .setName(featureStateReader.getName(feature))
                        .setSpecification(featureStateReader.getDescription(feature)))
                .collect(toList());
        return new ProjectRequest()
                .setFeatures(features);
    }
}
```
**Breaking aggregate encapsulation, rating 3/3:**
We don’t need to create a code that breaks the encapsulation of the aggregate.<br>
**Additional code in the aggregate, rating 1/3:**
The amount of additional code is large and increases proportionally to the size of the aggregate.<br>
**Complexity of the infrastructure code, rating 3/3:**
The code is generally easy, the only disadvantage can be state readers, whose number increases with the number of the aggregate components.

## Summary
Let’s summarize all methods for persisting aggregate state in the form of a table.

| **Method / Criterion**             | **Breaking aggregate encapsulation** | **Additional code in the aggregate** | **Complexity of the infrastructure code** | **Overall** |
| :---:                             | :---:                                | :---:                                | :---:                                     | :---:       |
| **Public getters**                | 2/3                                  | 3/3                                  | 3/3                                       | 8/9         |
| **Reflection**                    | 3/3                                  | 3/3                                  | 1/3                                       | 7/9         |
| **State objects**                 | 2/3                                  | 1/3                                  | 3/3                                       | 6/9         |
| **State objects with reflection** | 3/3                                  | 1/3                                  | 1/3                                       | 5/9         |
| **State readers**                 | 3/3                                  | 1/3                                  | 3/3                                       | 7/9         |

As I mentioned at the beginning, the ratings were given assuming the usage of the architecture described in my [post](https://allegro.tech/2019/12/grouping-and-organizing-classes.html).
This means that for a different approach, these assessments may look different.
For example, we can use a denormalized domain model in our application.
It is a model in which a single entity derived from [ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html) is represented by an aggregate per application context.
If we put a single context into a single package, then mapping aggregates to DTOs will be done inside the package.
In this situation, aggregates, from the use case point of view, will no longer require public getters, so using them will unnecessarily break the encapsulation of the aggregate and the context package.
Personally I will probably choose the “state readers” method in such a case.

Persisting the application state is usually coupled with its retrieving.
In my next post I will make an analogous comparison of the methods for retrieving application state.
Stay tuned!
