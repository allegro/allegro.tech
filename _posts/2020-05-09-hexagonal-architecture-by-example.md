---
layout: post
title: Hexagonal Architecture by example - a hands-on introduction
author: karol.kuc
tags: [tech, ddd, hexagonal-architecture, java]
---

When you go through articles related to Hexagonal Architecture (HA) you usually search for practical examples. 
HA isn't simple, that's why most trivial examples make readers even more confused, though it is not as complex as many
theoretical elucidations present it. In most posts you have to scroll through exact citations or rephrased definitions of concepts such as 
Ports and Adapters or their conceptual diagrams. They have already been well defined and described by popular authors i.e. 
[Alistair Cockburn](http://web.archive.org/web/20180121161736/http://alistair.cockburn.us/Hexagonal+Architecture) or [Martin Fowler](https://martinfowler.com/eaaCatalog/gateway.html). 
I assume you already have a general understanding of Domain Driven Design and that you understand terms such as Ports and Adapters.
I'm not a HA expert, yet I use it everyday and I find it useful. The only reason I write this post is to show you that Hexagonal Architecture makes sense, at least if your service is a little more than a ```JsonToDatabaseMapper```.

## Hello domain!
I'd like to provide a quite simple example project, not too trivial but complex enough, based on a very straightforward domain. 
The domain includes only two classes:
```
public class Article {
    
    private final ArticleId id;
    private final Title title;
    private final Content content;
    private final Author author;

    public void validateEligibilityForPublication() {
        verifyForPlagiarism();
        validateTitleLength();
        validateContentLength();
        checkPunctuation();
        checkGrammar();
        checkStyle();
    }
   //boilerplate code omitted
}
```
```
public class Author {
    private final AuthorId id;
    private final PersonName name;
    //boilerplate code omitted
}

```
There are also several [value objects](https://martinfowler.com/bliki/ValueObject.html) for fields such as id, title or content. 

Later we will go into detail about the overall service architecture, where other components are built around the 
domain. Before we do so, I'd like to give you a heads up by presenting it on a diagram, which shows how the actual elements
of the underlying project are organized.

<img alt="Architecture diagram" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/ha_example.png"/>

The project package structure also reflects the service architecture. 

<img alt="Overall package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/packages.png"/>

In the introduction I've mentioned that I assume you already know the basic concepts behind
Hexagonal Architecture. Now, that you have seen a high-level picture of the idea,
I think that everyone could do with a short recap before we go on.
* The domain is the core of the hexagon, containing primary 
business logic, free of any infrastructure and framework boilerplate.
* Adapters are either external APIs of your application or 
clients to other systems. They translate the interfaces of external
systems (e.g. a search index or a file server API) to the interfaces required or exposed by the domain. Those interfaces are called ports.
* Ports allow plugging in the adapters into the core domain. An example could be a repository interface with a method returning article content as  a simple ```String```. 
By declaring a port, e.g. as an plain Java interface, the domain declares
the contract saying: ”I give an id and I expect text in return, where and how you get it from is your business”. The domain here deals with articles,
which have a text title and a text content. Not with JSON or binary files. It does not want to hear about S3, ElasticSearch or an SFTP server.

## The REST API adapter: the front door of your service

<img alt="API package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/api.png"/>

The example microservice, which will help us depict Hexagonal Architecture, 
exposes a very simple REST API. As an author, you can create an article 
and then retrieve its content by issuing POST and GET HTTP requests, respectively.

 ```
@RestController
@RequestMapping("articles")
class ArticleEndpoint {

    private final ArticleApiService apiService;

    @GetMapping("{articleId}")
    ArticleResponse get(@PathVariable("articleId") String articleId) {
        return apiService.get(articleId);
    }

    @PostMapping
    ArticleIdResponse create(@RequestBody ArticleRequest articleRequest) {
        return apiService.create(articleRequest);
    }
    //boilerplate code omitted
}
```

The REST adapter implementation accesses the domain logic via an internal ```ArticleApiService```. The API service belongs to the API adapter. ```ArticleApiService``` delegates article creation and retrieval to the domain ```ArticleService``` and translates the domain model to the API model. 
Calling domain services directly from the controller may lead to the *fat controller antipattern*, due to the fact that orchestration logic and domain model translation should not
be the responsibility of the controller. An alternative would be to introduce a public [***application*** service](http://gorodinski.com/blog/2012/04/14/services-in-domain-driven-design-ddd/) instead of the internal adapter service.
An application service is a concept which belongs neither to the domain nor to the API adapter. It would take over the responsibility of model translation and orchestration,
opening the possibility of including other adapters in this process. 
 
```
@Component
class ArticleApiService {

    private final ArticleService articleService;

    ArticleResponse get(String articleId) {
        final Article article = articleService.get(ArticleId.of(articleId));
        return ArticleResponse.of(article);
    }

    ArticleIdResponse create(ArticleRequest articleRequest) {
        final ArticleId articleId = articleService.create(articleRequest.authorId(), articleRequest.title(), articleRequest.content());
        return ArticleIdResponse.of(articleId);
    }
}
```

I can't stress it enough that, due to the hexagonal package structure, none of the adapter code needs to be public, as no other code
is allowed to depend on it. It is impossible to import it to the domain or other parts of the application thanks to the
package-scope access modifier.

```
class ArticleResponse {
    private final String id;
    private final String title;
    private final String content;
    private final String authorName;

    static ArticleResponse of(Article article) {
        return new ArticleResponse(article.id().value(),
                article.title().value(),
                article.content().value(),
                article.author().name());
    }
    //boilerplate code omitted
}
```
Each adapter works on its data model, which can translate itself “from” or “to” the domain. 
The domain model on the other hand is adapter-model-agnostic.
That's why you should always favour
```
ArticleResponse.of(domainArticle) 
```
over
```
domainArticle.toResponse()
```

You may wonder why there is only one inbound adapter and several outbound adapters.
I would like to make it crystal clear that it's just because of the overall simplicity of the 
example application.
In a real-life scenario you would also probably have other gateways to your service.
It could be a subscription to a message topic or queue, a SOAP API or an API for file uploads.
They could delegate their inputs to the same or other ```ArticleService``` methods.

## The domain logic: let's talk business

<img alt="API package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/domain.png"/>

The ```ArticleService``` forms a port on its own. It is called an inbound port meaning it handles incoming traffic (in this example, in form of HTTP requests).
Outbound adapters handle outgoing traffic (e.g. database requests or messages sent to a broker) and decouple core from implementation details (e.g. which database or message broker was used).

It is often assumed that each port needs to be an interface, though it doesn't make much sense for inbound ports, 
such as ```ArticleService```. Interfaces, in general, allow you to decouple implementation from the component that uses it, 
following the [Dependency Inversion Principle]([dependency inversion](https://martinfowler.com/articles/dipInTheWild.html)). 
They are essential to decouple the domain ```ArticleService``` from ```ExternalServiceClientAuthorRepository``` hidden behind the ```AuthorRepository``` port. 
Hiding ```ArticleService``` behind an interface (especially a meaningless ```IArticleService```) 
would most likely be seen as over-engineering and would give you nothing in return.

The core business logic is included in the domain ```Article::validateEligibilityForPublication``` method,
which validates the article and throws an exception should any problems be identified. 
This part of domain logic does not require external dependencies, so there is no reason for it to reside
in the enclosing ```ArticleService```. Doing so is referred to as [Anemic Model Antipattern](https://martinfowler.com/bliki/AnemicDomainModel.html).
Other domain operations implemented in ```ArticleService```, creating and retrieving an article, 
depend on external dependencies hidden behind port interfaces. 

External dependencies (outbound ports) of Article domain stand for:
* persisting and retrieving an article via ```ArticleRepository``` port,
* retrieving an author via ```AuthorRepository``` port,
* notifying the author about the successful publication of an article via ```AuthorNotifier``` port,
* posting information about an article to social media via ```SocialMediaPublisher``` port,
* sending a message, triggered either by article creation or retrieval, to a message broker via ```ArticleMessageSender``` port.

```
public class ArticleService {

    public ArticleId create(AuthorId authorId, Title title, Content content) {
        Author author = authorRepository.get(authorId);
        Article article = articleRepository.save(author, title, content);

        article.validateEligibilityForPublication();

        articlePublisher.publishCreationOf(article);
        return article.id();
    }

    public Article get(ArticleId id) {
        Article article = articleRepository.get(id);
        articlePublisher.publishRetrievalOf(article);
        return article;
    }
    //boilerplate code omitted
}
```

Domain logic responsible for sending data to external systems, as a result of article creation and retrieval, has been encapsulated
in ```ArticlePublisher```.

```
public class ArticlePublisher {

    void publishCreationOf(Article article) {
        messageSender.sendMessageForCreated(article);
        socialMediaPublishers.forEach(socialMediaPublisher -> socialMediaPublisher.publish(article));
        articleAuthorNotifiers.forEach(articleAuthorNotifier -> articleAuthorNotifier.notifyAboutCreationOf(article));
    }

    void publishRetrievalOf(Article article) {
        messageSender.sendMessageForRetrieved(article);
    }
}
```

## Outbound adapters: let your data go

Ports used by the domain for outgoing traffic are implemented by corresponding adapters:
* a database adapter,
* an external author service adapter,
* mail and SMS  systems adapter,
* Twitter API client adapter,
* a message broker publisher adapter.

The outbound adapters implement the port interfaces (e.g. ```ArticleRepository```, ```AuthorRepository```, ```SocialMediaPublisher```).
Port interfaces are part of the domain.

It makes the adapters pluggable and potentially replaceable. For example you could replace ```ExternalServiceClientAuthorRepository``` with a client to 
a facade-service aggregating multiple user data sources e.g. LDAP, an ERP system, a legacy DB. 

You might say: ”Hey, when was the last time you replaced a database with a different one”. Well, good point, it doesn't happen
everyday. Still, in a microservice-oriented architecture exchanging adapters of legacy services with new ones is very common.
If you are still not convinced, I'm pretty sure you would at least benefit from avoiding spaghetti code, where ”everything depends on everything”.
Even in a ”layered” architecture you wouldn't like your View to explode upon serialization of a managed JPA entity, would you?
The [Open Session In View Anti-Pattern](https://vladmihalcea.com/the-open-session-in-view-anti-pattern/) is still quite common. It makes
my eyes bleed just as mixing JPA annotations with Jackson and JAXB. An independent domain model makes much more sense when you've refactored
such projects before. 

<img alt="API package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/twitter.png"/>

Below you'll find an example of ```SocialMediaPublisher``` port implementation. ```TwitterArticlePublisher``` translates the domain
article to ```ArticleTwitterModel``` and sends the result via the ```TwitterClient```.
The domain ```ArticlePublisher``` delegates social media publication to a list of ```SocialMediaPublisher```
port interfaces. It has no clue about the existence of any Twitter API integration code such as HTTP clients and JSON mapping. 

```
@Component
class TwitterArticlePublisher implements SocialMediaPublisher {

    @Override
    public void publish(Article article) {
        ArticleTwitterModel articleTweet = ArticleTwitterModel.of(article);
        twitterClient.tweet(articleTweet);
    }
    //boilerplate code omitted
}
```
By way of analogy, the domain ```Article``` knows nothing about translating itself to ```ArticleTwitterModel```.
```
class ArticleTwitterModel {

    private static final String TWEET = "Check out the new article >>%s<< by %s";
    private final String twitterAccountId;
    private final String tweet;

    static ArticleTwitterModel of(Article article) {
            return new ArticleTwitterModel(
                    article.author().name().value(),
                    String.format(TWEET, article.title().value(),
                            article.author().name().value()));
   //boilerplate code omitted
}
```

## Application flow
By adding appropriate log messages to the adapter code, you can analyze the flow of the article creation and retrieval requests:

```
>>> HTTP POST Request: create an article "Hexagonal Architecture"
Fetched author: "William Shakespeare"
Persisted article: "Hexagonal Architecture"
Message sent to broker: "Article >>Hexagonal Architecture<< created"
Tweet published on Twitter: "Check out the new article >>Hexagonal Architecture<< by William Shakespeare"
Mail sent to author: "You have successfully published: >>Hexagonal Architecture<<"
SMS sent to author: "Please check your email. We have sent you publication details of the article: >>Hexagonal Architecture<<"
<<< HTTP POST Response: article "Hexagonal Architecture" with id "69683cd6-3e0f-49fd-a9f4-fd4cc1c9ca4b" successfully created


>>> HTTP GET Request: retrieve an article with id: "69683cd6-3e0f-49fd-a9f4-fd4cc1c9ca4b"
Fetched article: "Hexagonal Architecture"
Message sent to broker: "Article >>Hexagonal Architecture<< retrieved"
<<< HTTP GET Response: article: "Hexagonal Architecture" successfully retrieved
```
## Summary
We've gone through the whole example so I guess we would do with a quick summary. 
The domain constitutes the core of our application (centre of the hexagon).
It is surrounded by six adapters. The endpoint in the REST API inbound adapter calls the domain logic via a public domain service.
The five outbound adapters implement domain interfaces, integrating the article service with 
* social media, 
* mail and SMS notifications, 
* message broker, 
* database,
* author service.

As much as I did my best to design the example so that it would show the benefits of using Hexagonal Architecture in a self-explanatory
and intuitive way, to avoid theoretical elucidations, I would still like to emphasise what we have gained. 
Due to designing the core of the application to be independent of external adapters we achieve e.g.: 
* [Dependency Inversion](https://martinfowler.com/articles/dipInTheWild.html). This way, instead of high-level modules (domain) depending on low-level modules (adapters), 
both will depend on abstractions. 
* Testability. The domain logic can be unit-tested regardless of underlying frameworks and infrastructure that the adapters depend on.
It frees domain tests from e.g. transaction management or request and response parsing. All adapters can also be tested independently from each other.
* Extendability, following the [Open-closed Principle](https://en.wikipedia.org/wiki/Open–closed_principle). It's best illustrated by the ```ArticlePublisher```, 
```
public class ArticlePublisher {
    private final ArticleMessageSender messageSender;
    private final List<SocialMediaPublisher> socialMediaPublishers;
    private final List<AuthorNotifier> articleAuthorNotifiers;
    // ...
}
```
```ArticlePublisher``` depends on implementations of ```SocialMediaPublisher``` and ```ArticleAuthorNotifier```, 
injected as lists of Spring components. It is important though, that the domain knows nothing about the DI framework you use. Adding another implementation, such as an adapter for Facebook,
does not require modifying the domain code.

I hope that the above example depicts the theoretical concepts such as Hexagonal Architecture, Ports and Adapters
in an easy and comprehensible way. I tried to avoid oversimplifying the example implementation, especially
for the sake of readers who encounter the Hexagonal Architecture approach and Domain Driven Design for the first time. 
It could have been difficult to grasp the difference between a traditional layered architecture and Hexagonal Architecture if the only thing 
your domain is responsible for is storing and fetching data from a repository. The same applies to understanding
the reason why the domain model should be independent from the adapter model. There are many applications,
in which the domain model consists of only one class mapped 1 to 1 to an adapter dto. Both classes have the same fields, they have just different names, e.g. Article and ArticleEntity.
Those applications seem to present Hexagonal Architecture as an over-engineered approach, where one copies the same field values
from class to class just for the sake of the pattern on its own.
## Code examples
If you are interested in the implementation of the example service, fragments of which were included in the code snippets, take a look at the [github repository](https://github.com/dziadeusz/hexagonal-architecture-by-example)

