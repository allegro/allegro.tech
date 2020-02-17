---
layout: post
title: Persisting application's state
author: mariusz.kopylec
tags: [tech, architecture, persistence, aggregate, repository, ddd, domain, hexagonal, clean, java]
---

Często zdarza się, że dany przypadek użycia A aplikacji, do swojego wykonania, wymaga wcześniejszego wykonania przypadku użycia B.
W takiej sytuacji, należy upewnić się podczas wykonywania przypadku użycia A, że przypadek użycia B został wykonany.
Aby to osiągnąć wprowadza się do aplikacji stan, który jest wspólny dla obu przypadków użycia.
Stan musi być utrwalony, aby być widocznym dla więcej niż jednego przypadku użycia.
Najczęściej wykorzystuje się do tego celu różnego rodzaju bazy danych.
W swojej pracy nad aplikacjami spotkałem się z różnymi metodami zapisu i odczytu stanu aplikacji.
Wypracowałem również swoje wariacje.
W tym artykule porównam owe metody w oparciu o wcześniej załóżone kryteria.

## Założenia
Artykuł jest kontynuacją mojego [poprzedniego posta](https://allegro.tech/2019/12/grouping-and-organizing-classes.html) i opiera się na projekcie aplikacji "Project Keeper" przedstawionej w poście.
Dlatego też zalecam najpierw zapoznanie się z nim.
Kod źródłowy aplikacji będzie napisany w Javie z pomocą frameworka [Spring](https://spring.io/).
Część stanu aplikacji "Project Keeper", który odpowiada za dane projektów reprezentować będzie [agregat](https://martinfowler.com/bliki/DDD_Aggregate.html) `Project`.
Do zapisu i odczytu stanu posłuży [repozitorium](https://www.martinfowler.com/eaaCatalog/repository.html) `ProjectRepository`.
Nie będzie analizowany wzorzec [CQRS](https://martinfowler.com/bliki/CQRS.html) oraz [event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html).
Zgodnie z założeniami implementacyjnymi "Project Keepera" agregat `Project` będzie wolny od jakiegokolwiek frameworka DI czy ORM.
Agregat to z założenia obiekt, który ignoruje to w jaki sposób zostanie utrwalony.
Aby więc to podkreślić, stan agregatu `Project` będzie przechowywany w bazie danych [MongoDB](https://www.mongodb.com/) i wewnętrznej usłudze dostępnej po [REST](https://en.wikipedia.org/wiki/Representational_state_transfer).

Kryteria według, których będą oceniane metody zapisu to:
* **łamanie enkapsulacji agregatu**, poprzez dodatkowy kod potrzebny jedynie do celów utrwalania (im mniej takich przypadków, tym wyższa ocena)
* **dodatkowy kod w agregacie** potrzebny jedynie do celów utrwalania, który nie łamie jego enkapsulacji (im go mniej, tym wyższa ocena)
* **stopień skomplikowania kodu infrastrukturalnego**, odpowiedzialnego za utrwalanie (im mniej skomplikowany, tym wyższa ocena)

Przyjęta zostanie 3-stopniowa skala ocen, gdzie 3 jest oceną najlepszą, 1 najgorszą.

## Metody utrwalania
Porównanych zostanie pięć metod na zapis i odczyt agregatu `Project`.
Część aplikacji, potrzebna do analizy metod utrwalania wygląda następująco:
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
        ├── ProjectRequest.java
        └── ProjectResponse.java
</pre>
Większość z tych klas będzie miała identyczną strukturę, niezależnie od metody utrwalania.
Klasy, które będą się zmieniać to `Feature`, `Identifier`, `Project` oraz `ProjectPersistenceMapper`.
W pakiecie `core.project` umieszczony jest agregat `Project`.
Jego struktura będzie zależna od rodzaju metody utrwalania.
W skład agregatu wchodzą:
* encja `Project`, która pełni funckję korzenia agregatu
* value object `Identifier` reprezentujący unikalny identyfikator projektu
* lista value objectów `Feature` opisująca funkcjonalności, których dotyczy projekt

W `core.project` znajduje się również `ProjectRepository`:
```java
public abstract class ProjectRepository {

    protected abstract Project findByIdentifier(String identifier);

    protected abstract void save(Project project);
}
```
Repozytorium ma postać secondary port, która to postać wywodzi się z architektury [Hexagonal](https://declara.com/content/va7eLmgJ).
Aplikacja "Project Keeper" wykorzystuje dwa żródła utrwalania agregatów: bazę danych MongoDB oraz usługę REST.
W pakiecie `infrastructure.mongodb` skonfigurowany jest dostęp do MongoDB:
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
W pakiecie `infrastructure.httpclient` skonfigurowany jest klient HTTP do usługi REST:
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
Pakiet `infrastructure.persistence` odpowiedzialny jest za zapis i odczyt stanu agregatu.
Wszystkie dane projektu, oprócz funkcjonalności, są przechowywane w MongoDB.
Dane te reprezntuje `ProjectDocument`:
```java
@Document("projects")
class ProjectDocument {

    @Id
    private String id;
    private String name;

    // Getters and setters
}
```
Funkcjonalności przechowane są w usłudze REST.
Pojedyncza funkcjonalność jest reprezentowana przez `FeatureMessage`:
```java
class FeatureMessage {

    private String name;
    private String specification;

    // Getters and setters
}
```
Natomiast request i response HTTP wyglądają następująco:
```java
class ProjectRequest {

    private List<FeatureMessage> features;

    // Getter and setter
}
```
```java
class ProjectResponse {

    private String identifier;
    private List<FeatureMessage> features;

    // Getters and setters
}
```
W `ProjectPersistenceMapper` zawarta jest logika mapująca pomiędzy agregatem `Project` a `ProjectDocument`, `ProjectRequest` i `ProjectResponse`.
Logika ta będzie zależna od rodzaju metody utrwalania.
Adapter dla `ProjectRepository` ma postać:
```java
@Repository
class MultiSourceProjectRepository extends ProjectRepository {

    private static final String PROJECTS_URL = "http://internal.itcompany.com/projects/{id}";

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
        ProjectResponse response = httpClient.getForEntity(PROJECTS_URL, ProjectResponse.class, identifier).getBody();
        return mapper.mapToProject(document, response);
    }

    @Override
    protected void save(Project project) {
        ProjectDocument document = mapper.mapToDocument(project);
        ProjectRequest request = mapper.mapToRequest(project);
        mongoDb.save(document);
        try {
            httpClient.put(PROJECTS_URL, request, document.getId());
        } catch (Exception e) {
            mongoDb.remove(document);
        }
    }
}
``` 
Jako, że stan agregatu `Project` jest przechowywany w więcej niż jednym źródle, mogą zdarzyć się sytuacje, że zapisany stan będzie niekompletny.
Ciężko wyeliminować ten problem całkowicie, można natomiast zredukować go do minimum poprzez:
* ponowienia pod-zapisów w przypadku błędu (pod-zapisy muszą być idempotentne)
* rollback zapisu w MongoDB, w przypadku gdy nie powiedzie się zapis w usłudze REST
* uniemożliwienie utworzenia agregatu z nieprawidłowym stanem (błąd zostanie zgłoszony już w momencie odczytu agregatu, co zapobiegnie rozprzestrzenianiu się nieprawidłowości w różnych częściach aplikacji)

Przejdźmy teraz do samych metod utrwalania agregatu `Project`.
Porównajmy najpierw metody zapisu, a następnie metody odczytu.

### Zapis stanu
Aby móc zapisać stan agregatu potrzebujemy stworzyć możliwość jego odczytu w pakiecie `infrastructure.persistence`.
Możemy to zrobić na kilka sposobów.

#### Publiczne gettery
Stan agregatu możemy odczytać poprzez wystawienie publicznych getterów dla każdego z pól.</br>
_Kod elementów agregatu:_
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
_Kod mapujący:_
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
_Łamanie enkapsulacji, ocena 2/3:_
Upublicznianie niepotrzebnych informacji na temat agregatu łamie jego enksaplucje.
Zastanówmy się jednak, ile z tych getterów rzeczywiście udostępnia coś nadmiarowo.
Zazwyczaj znaczna więkoszość stanu agregatu musi być widoczna dla kodu przypadku użycia w celu zmapowania go na DTO i zaprezentowania klientowi.
W aplikacji "Project Keeper" mapowanie to następować będzie w `ProjectKeeper`, który pełni rolę punktu wejściowego do rdzenia aplikacji.
Także nie wszystkie publiczne gettery w agregacie `Project` będą istniały jedynie w celu zapisu stanu.</br>
_Dodatkowy kod, ocena 3/3:_
Przy takim podejściu do zapisu nie potrzebujemy tworzyć kodu dodatkowego w agregacie, który nie łamie jego enkapsulacji.</br>
_Skomplikowanie kodu infrastruktury, ocena 3/3:_
Kod mapujący agregat na dokument MongoDB i żądanie HTTP jest prosty do zrozumienia i rozbudowy.

#### Refleksja
Metoda polega na odczycie stanu agregatu przy użyciu refleksji w Javie.
Możemy wykorzystać do tego [ModelMapper](http://modelmapper.org/), który jest biblioteką do mapowania stanu pomiędzy obiektami.</br>
_Kod elementów agregatu:_
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
_Kod mapujący:_
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
_Łamanie enkapsulacji, ocena 3/3:_
Nie potrzebujemy tworzyć żadnego kodu łamiącego enkapsulację agregatu.</br>
_Dodatkowy kod, ocena 3/3:_
Nie potrzebujemy również tworzyć kodu, który nie łamie enkapsulacji agregatu.</br>
_Skomplikowanie kodu infrastruktury, ocena 1/3:_
Pomimo wykorzystania biblioteki do mapowania nadal niektóre mapowania musimy definiować sami, in not type-safe way.
Chodzi tu o mapowania zdefiniowane w `ProjectPropertyMap` i `FeaturePropertyMap`.
Konsekwencją użycia refleksji jest to, że o ewentualnych błędach w mapowaniu dowiemy się dopiero w runtime.

#### Wyodrębniony obiekt stan
Kolejną metodą jest wyodrębnienie stanu agregatu do osobnego obiektu i utworzeniu publicznego gettera, który udostępnia owy stan.
Istnieją dwie wariacje tej metody:
* elementy agregatu bezpośrednio zależą od obiektu stanu (pole w klasie)
* elementy agregatu tworzą obiekt stanu przy każdym jego odczycie

My skupimy się tylko jednej z nich, ponieważ, z punktu widzenia kryteriów oceniania metod, nie ma między nimi różnicy.</br>
_Kod elementów agregatu:_
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
_Kod mapujący:_
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
_Łamanie enkapsulacji, ocena 2/3:_
Gettery zwracające stan elementów agregatu łamią enkapsulację, ale podobnie jak w przypadku metody z getterami publicznymi, nie jest to mocno rażące odstępstwo.
Tu dodatkowo możemy umówić się z programistami współpracującymi nad aplikacją, że metod `getState()` używamy tylko przy zapisie stanu.</br>
_Dodatkowy kod, ocena 1/3:_
Ilość dodatkowego kodu jest spora i rośnie proporcjonalnie do agregatu.</br>
_Skomplikowanie kodu infrastruktury, ocena 3/3:_
Kod jest podobny do tego, który potrzebujemy w metodzie z publicznymi getterami.
Nieco komplikują go dodatkowe obiekty stanu.

#### Wyodrębniony obiekt stanu z użyciem refleksji
Metoda podobna do powyższej, z tą różnicą, że obiekt stanu jest odczytywany za pomocą refleksji.
_Kod elementów agregatu:_
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
_Kod mapujący:_
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
            Field field = findField(object.getClass(), "state", state);
            field.setAccessible(true);
            return (T) field.get(object);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot get state field for " + object.getClass().getName(), e);
        }
    }
}
```
_Łamanie enkapsulacji, ocena 3/3:_
Nie potrzebujemy tworzyć żadnego kodu łamiącego enkapsulację agregatu.</br>
_Dodatkowy kod, ocena 1/3:_
Ilość dodatkowego kodu jest spora i rośnie proporcjonalnie do agregatu.</br>
_Skomplikowanie kodu infrastruktury, ocena 1/3:_
Podobnie jak w poprzedniej metodzie z użyciem refleksji, tutaj również ewentualne błędy będziemy widzieli dopiero w runtime.
Sama implmenetacja pobierania stanu z elementów agregatu nie należy do najłatwiejszych.

#### Wyodrębniony odczyt stanu
Metoda odwrotna do wyodrębniania obiektu stanu.
Tutaj zamiast tworzyć obiekt stanu tworzymy bezstanowy state reader.
_Kod elementów agregatu:_
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
_Kod mapujący:_
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
_Łamanie enkapsulacji, ocena 3/3:_
Nie potrzebujemy tworzyć żadnego kodu łamiącego enkapsulację agregatu.</br>
_Dodatkowy kod, ocena 1/3:_
Ilość dodatkowego kodu jest spora i rośnie proporcjonalnie do agregatu.</br>
_Skomplikowanie kodu infrastruktury, ocena 3/3:_
Kod jest generalnie łatwy, jedyną uniedogodnieniem mogą być state readery, których liczba rośnie wraz z liczbą elemntów agregatu.





One of the first challenges a programmer has to face is organizing classes within a project.
This problem may look trivial but it’s not.
Still, it’s worth spending enough time to do it right.
I’ll show you why this aspect of software development is crucial by designing a sample project’s architecture.

## Assumptions
Let’s assume that we have to create a “Project Keeper” application for managing projects at an IT company.
Thanks to the application, project managers will be able to create projects and assign teams to them.
We know that after some time, the DI (dependency injection) framework currently used by the company’s software will be replaced by another solution.
As part of cost reduction, the company plans to stop using a commercial relational database and replace it with some open-source solution.
The application has to be primarily available via HTTP through a browser.
Sometimes, however, access from an operating system terminal will be needed.

## Implementation
Bearing in mind the above assumptions, we want to implement the application in such a way that it is easy to introduce the changes mentioned in them.
Let’s think for a moment what our application really is.
The main part of it will be business logic, that is the use cases that we expose to users.
Let’s call this part of the application the **core**.
This is where the most important but also the most complex source code will reside.
Therefore we should limit the need to change the code to the minimum in the core part.
To achieve that, we will make the **core completely independent** of the other application parts. 
Users must be able to use available use cases, which is why they should be presented to them in some way.
At the moment, the use cases are to be presented via the HTTP API that the frontend application will consume and via the operating system’s terminal.
If we isolate the part responsible for presenting use cases, we can freely change the presentation methods in the future without affecting the core.
Let’s call this part of the application the **presentation**.
Our application will need to communicate with an external system: a database.
The database will soon be replaced by a different one.
It would be good not to change any code in the core when replacing the database.
We will achieve this by introducing the next part of the application: the **infrastructure**.
The infrastructure will be responsible for communicating with database (or any other external system if they appear in the future), but also for all other technical aspects not related to the business logic.
It turns out that this is not an innovative view of the application.
The above approach to splitting the application is one of the fundamental assumptions of [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design), [Clean](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) and [Hexagonal](https://declara.com/content/va7eLmgJ) architectures.
The assumptions of our application show that it must be prepared for changing the DI framework.
This is a rather rare thing you do in real world but in our case we must be prepared for it.
Again, let’s follow the rule that the core stays intact when changing the DI framework.
Let’s make the core independent of the DI framework by not using any of the framework’s classes or annotations in the core.
Such independence will also make it easier for us to test the core in isolation if we decide to implement such tests.
By getting rid of the framework from the core, we get rid of the possibility of using automatic DI.
We must therefore manually configure all dependencies.
Let’s introduce the next part to the application: core **configuration**, where we will do it.

Now we need to determine one very important detail: the relationships between application parts.
To get things working as described above the core must be completely independent of infrastructure, presentation and configuration.
This means that no class from outside the core can be used in the core.
The relationships between the parts of the application will look like this:

![Project Dependencies](/img/articles/2019-12-12-grouping-and-organizing-classes/project-dependencies.png "Project Dependencies")

In Java we can represent each of the application part as a package.
Let’s divide our project into main packages:
```
com.itcompany.projectkeeper
├── configuration
├── core
├── infrastructure
└── presentation
```

Now, that we have came down to the package level of our application, let’s start thinking about making the code easy to read and change.
This is the tricky part of application design because at the moment of writing the code and short after, a developer knows exactly how the code is constructed and how the use cases’ logic flows through it.
But after a while, he often forgets those flows and the code starts to appear messy and hard to maintain.
Good code reviews may help but it is better to create a good source code from the very beginning.
There are many good practices you should consider i.e. Domain-Driven Design, Clean and Hexagonal architectures, various design patterns.
From my experience though, there are two most important rules to follow.
The first one you should already know, as I have already mentioned it couple times: make the `core` package independent from other packages.
The second one is **encapsulation**.
Encapsulation means hiding internal details of packages and classes from other packages and classes.
Why those two rules are so important?
The most unpleasant source code to work with is that which has the most number of dependencies between packages and classes.
In highly coupled code even a small change can create stream of changes around the whole codebase.
Not to mention that first you have to spend hours to understand what the code is really doing and how.
Therefore the code needs to be as loose as possible and for that you need to limit the dependencies in it to the minimum.
This is where the independent core and encapsulation rules shines.
Thanks to them we can:
* clearly define the rules of communication between packages
* be sure that the class will not be used incorrectly and/or in the wrong place

...and creating so-called spaghetti code will be seriously hindered :)

Let’s now focus on each package individually.

### Core
The business logic will focus on projects and teams.
At the IT company, various teams deal with various types of projects.
For example, programmers create software, UX designers design user interfaces, analysts analyze data.
Project type is therefore something common to the project and the team.
Let’s map all of this to the application’s structure by adding additional packages to the `core`:
<pre>
com.itcompany.projectkeeper
├── configuration
├── core
│   ├── <b>common</b>
│   ├── <b>project</b>
│   └── <b>team</b>
├── infrastructure
└── presentation
</pre>
By doing it that way we make it easy to:
* deduce the purpose of the application
* find classes operating on individual domain objects
* use class visibility restrictions to encapsulate internal packages’ aspects

Here we also need to determine the dependencies between the packages.
The `common` package should not have any dependencies.
In an ideal world, the `project` and `team` packages should depend only on the `common` package.
In practice, this is often not the case.
Let’s assume that each team is evaluated based on the number of completed projects.
In this situation, the `team` package must also depend on the `project` package because information about which project has been completed must be passed on to the `team` package.
Let’s try to make this relationship as loose as possible.
Let’s present the dependencies between the packages in the `core` package on the diagram below:

![Core Dependencies](/img/articles/2019-12-12-grouping-and-organizing-classes/core-dependencies.png "Core Dependencies")

Now, let’s think about how to encapsulate the `project` package.
Generally, the fewer public classes and methods the better.
Let’s first create a publicly available `ProjectService`, which will be the entry point to the `project` package.
According to Domain-Driven Design, we extract the `Project` [aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html).
Ideally, the `Project` methods would have a package-private visibility, but as I mentioned earlier, the `team` package will need access to the `Project`.
To minimize this dependency, let’s make only those `Project` methods public that do not change `Project` state.
With this approach, only the `project` package will have control over the `Project` object.
The state of the `Project` needs to be persisted outside the application, for this we will use the `ProjectRepository` [repository](https://www.martinfowler.com/eaaCatalog/repository.html).
In order to make the `core` independent from the `infrastructure`, the repository must be an abstract entity.
I suggest using an abstract class for this, not an interface, because class methods may have protected visibility.
Thus, they will not be visible outside the `project` package.
We’ll limit the visibility for the rest of the `project`’s classes to package-private one.

Let’s do the same with the `team` package, let’s create the `TeamService`, `Team` and` TeamRepository` classes.
Let’s also add a `ProjectType` to the `common` package.
In the `common` package most classes will have public visibility.
Similarly to the `project` and `team` packages, let’s create an entry point for the `core` package: a `ProjectKeeper` class.
The only stateless classes that the `ProjectKeeper` can access are `ProjectService` and `TeamService`.
So let’s delegate work from the `ProjectKeeper` to them.
For the `ProjectKeeper` to be usable, you will need a number of [DTO](https://martinfowler.com/eaaCatalog/dataTransferObject.html) objects.

The project structure now looks like this:
<pre>
com.itcompany.projectkeeper
├── configuration
├── core
│   ├── common
│   │   └── <b>ProjectType.java</b>
│   │   └── <b>*.java</b>
│   ├── project
│   │   ├── <b>Project.java</b>
│   │   ├── <b>ProjectRepository.java</b>
│   │   ├── <b>ProjectService.java</b>
│   │   └── <b>*.java</b>
│   ├── team
│   │   ├── <b>Team.java</b>
│   │   ├── <b>TeamRepository.java</b>
│   │   ├── <b>TeamService.java</b>
│   │   └── <b>*.java</b>
│   ├── <b>ProjectKeeper.java</b>
│   └── <b>*Dto.java</b>
├── infrastructure
└── presentation
</pre>

### Infrastructure
In the `infrastructure` package, let’s specify how to save `Project` and `Team` aggregates and let’s specify the configuration of the database connection.
We do this in the `persistence` and `commercialdb` packages, respectively.
I recommend naming configuration `infrastructure`’s packages same as the external systems are named.
This will allow developers to know what are those systems just by looking at the packages.
This is actually analogical to `core`’s packages naming: the business propose of the application is more or less known just by looking at the packages.
We define the way of saving aggregates by creating a `CommercialDbProjectRepository` and a `CommercialDbTeamRepository`, which will implement the `core`’s repositories.
In case of database replacement, we will only replace these implementations and the `core` package will remain intact.
Let’s configure the connection to database in the `CommercialDbConfiguration` class.
The framework’s capabilities can help us encapsulate packages.
Thanks to its automatic DI, we can limit the visibility of all classes to package-private.

Let’s change the structure of the project:
<pre>
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
│   ├── <b>commercialdb</b>
│   │   └── <b>CommercialDbConfiguration.java</b>
│   └── <b>persistence</b>
│       ├── <b>CommercialDbProjectRepository.java</b>
│       └── <b>CommercialDbTeamRepository.java</b>
└── presentation
</pre>

### Presentation
In the `http` and `console` packages, we implement access to the `core` package from the HTTP endpoint and the terminal.
For HTTP purpose, let’s add the `ProjectKeeperEndpoint` using the framework to help us handle the requests.
Let’s also add the `ProjectKeeperConsole` where we implement access from the terminal.
Both of these classes will access the `core` package through the `ProjectKeeper`.
Here, all the exceptions thrown from the `core` package will be handled.
Classes’ visibilities can be safely set to package-private.

The structure of the project will change as follows:
<pre>
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
│   ├── commercialdb
│   │   └── CommercialDbConfiguration.java
│   └── persistence
│       ├── CommercialDbProjectRepository.java
│       └── CommercialDbTeamRepository.java
└── presentation
    ├── <b>console</b>
    │   ├── <b>ErrorHandler.java</b>
    │   └── <b>ProjectKeeperConsole.java</b>
    └── <b>http</b>
        ├── <b>ErrorHandler.java</b>
        └── <b>ProjectKeeperEndpoint.java</b>
</pre>

### Configuration
To supply the `core` package with repositories’ implementations from the `infrastructure` package, let’s create a `ProjectKeeperConfiguration` class.
Its task will be to build and expose the `ProjectKeeper` from the `core` package to the `presentation` package.
Let’s use the framework to make the `ProjectKeeper` class injectable by DI.
The `ProjectKeeperConfiguration` class may have package-private visibility.

Ultimately, the project looks like this:
<pre>
com.itcompany.projectkeeper
├── configuration
│   └── <b>ProjectKeeperConfiguration.java</b>
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
│   ├── commercialdb
│   │   └── CommercialDbConfiguration.java
│   └── persistence
│       ├── CommercialDbProjectRepository.java
│       └── CommercialDbTeamRepository.java
└── presentation
    ├── console
    │   ├── ErrorHandler.java
    │   └── ProjectKeeperConsole.java
    └── http
        ├── ErrorHandler.java
        └── ProjectKeeperEndpoint.java
</pre>

## Summary
A lot of things have been mentioned above so let’s make a brief summary.
What I would like you to remember is to:
* divide your application into core, infrastructure, presentation and configuration parts
* make the core completely independent from other parts
* encapsulate packages and classes
* name packages so that looking at their names will tell what the application is doing and how
* follow Domain-Driven Design rules

I can assure you that doing so, your code will enter a whole new level of quality.

If you’ve never delved deeply into topics related to application architecture, I hope that I encouraged you to do so.
The presented approach is obviously not the only right way to group classes.
It works well in business applications, but for example, it doesn’t quite fit into all kinds of libraries.
It also can be enhanced by using [Java 9+ modules](https://www.oracle.com/corporate/features/understanding-java-9-modules.html).
If you know/use alternative ways to organize classes into packages, share them in the comments below.

That’s all, thanks for reading!
If you need to know more add a comment.
