---
layout: post
title: Hexagonal Architecture by example - a hands-on introduction
author: karol.kuc
tags: [tech, ddd, hexagonal-architecture, java]
---

When you go through articles related to Hexagonal Architecture, you are usually searching for practical examples of specific use cases
of this rather complex pattern. In most posts you encounter, you have to scroll through exact citations or rephrased definitions of concepts such as 
Ports and Adapters or their conceptual diagrams, which have already been well defined and described by popular authors i.e. 
[Alistair Cockburn](http://web.archive.org/web/20180121161736/http://alistair.cockburn.us/Hexagonal+Architecture) or [Martin Fowler](https://martinfowler.com/eaaCatalog/gateway.html). 
I assume you already have a general understanding of Domain Driven Design and that you understand terms such as Ports and Adapters.

## Introducing the domain
In this article, we will focus on providing a quick and practical example based on a very straightforward domain,
which includes only two simple domain objects:
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
There are also several [value objects](https://martinfowler.com/bliki/ValueObject.html) wrapping fields such as id, title or content. 
These fields are immutable String values anyway, though introducing value objects allows you to encapsulate additional business logic or validation, 
as well as avoid passing several String values as method  or constructor arguments, which is generally a bad practice and may lead to bugs difficult to track: 
now if you accidentally swap values upon method call your code won't compile. 

In the next paragraphs we will go into detail about the overall service architecture, where other components are built around the 
aforementioned domain. Before we do so, I would like to give you a heads up by presenting it on a diagram, which shows how the actual elements
of the underlying project are organized, rather than a generic conceptual example.
<img alt="Architecture diagram" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/ha_example.png"/>

The project package structure also reflects the service architecture. 
<img alt="Overall package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/packages.png"/>

In the introduction I've mentioned that I assume you already know the basic concepts behind
Hexagonal Architecture. Now, that you have seen a high-level picture of the idea,
I think that everyone could do with a short recap before we go on:
* the domain is the core of the hexagon, containing primary 
business logic, free of any infrastructure and framework boilerplate;
* adapters are either external interfaces of your application or 
bridges to the outside world, they translate the interfaces of external
systems to the interfaces exposed or required by the domain;
* ports allow plugging in the adapters into the core domain, they
represent the requirements of the application core, 
preventing implementation details from leaking into the domain;

## The inbound adapter: REST API

<img alt="API package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/api.png"/>

The example microservice, which will help us depict Hexagonal Architecture, 
exposes a very simple REST API. As an author, you can create an article 
and then retrieve its content by issuing POST and GET HTTP requests, respectively.

 ```
@RestController
@RequestMapping("articles")
class ArticleEndpoint {

    private final ArticleFacade articles;

    @GetMapping("{articleId}")
    ArticleResponse get(@PathVariable("articleId") String articleId) {
        return articles.get(articleId);
    }

    @PostMapping
    ArticleIdResponse create(@RequestBody ArticleRequest articleRequest) {
        return articles.create(articleRequest);
    }
    //boilerplate code omitted
}
```

The REST adapter implementation accesses the domain logic via an internal facade, which then delegates to a domain service and translates the domain model to the API model. 
Calling domain services directly from the controller may lead to the *fat controller antipattern*, due to the fact that orchestration logic and domain model translation should not
be the responsibility of the controller. An alternative would be to introduce [***application*** services](http://gorodinski.com/blog/2012/04/14/services-in-domain-driven-design-ddd/) instead of the internal facade.
An application service, a concept which does not belong neither to the domain nor to the API adapter, would take over the responsibility of model translation and orchestration,
opening the possibility of including other adapters in this process. 
 
```
@Component
class ArticleFacade {

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
Each adapter works on its data model, which can translate itself “from” or “to” the domain model, 
which on the other hand is adapter-model-agnostic.
That's why you should always favour
```
ArticleResponse.of(domainArticle) 
```
over
```
domainArticle.toResponse()
```

If you wonder why there is only one inbound adapter and several outbound adapters
I would like to make it crystal clear that it's just because of the overall simplicity of the 
example application.
In a real-life scenario you would also probably have other gateways to your service,
such as a subscription to a message topic or queue, a SOAP API or an API for file uploads.
They could delegate their inputs to the same or other ```ArticleService``` methods, so the inbound port
would most likely, but not necessarily, be reused.

## The domain logic

<img alt="API package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/domain.png"/>

The domain service forms a port on its own. It is called a inbound port to depict that it handles incoming traffic, while outbound adapters handle outgoing 
traffic and decouple external dependencies called from the domain code.
It is often assumed that each port needs to be an interface, it doesn't make much sense for inbound ports though.
Interfaces, in general, allow you to decouple implementation from the component that uses it, 
following the [Dependency Inversion Principle]([dependency inversion](https://martinfowler.com/articles/dipInTheWild.html)). 
They are essential to the decoupling of the domain (also referred to as core) and the adapters that implement outbound ports, 
which makes them pluggable and potentially replaceable. I would like to emphasise that the domain code is adapter-agnostic 
and has no dependency on adapter implementation, yet not the other way round. 
Every adapter depends on the domain code at least by implementing one of the port interfaces or mapping the domain data model. 
Hiding public domain services (inbound ports) behind interfaces should be seen as over-engineering and gives you nothing in return.

The core business logic is included in the domain ```Article::validateEligibilityForPublication``` method,
which validates the article and throws an exception should any problems be identified. 
This part of domain logic does not require external dependencies, so there is no reason for it to reside
in the enclosing ```ArticleService```, moreover, doing so is referred to as [Anaemic Model Antipattern](https://martinfowler.com/bliki/AnemicDomainModel.html).
Other domain operations implemented in ```ArticleService```, creating and retrieving an article, 
depend on external dependencies hidden by the abstraction of ports. 
Just as a quick reminder, outbound ports, from the domain perspective, are only declared as interfaces. 

These dependencies stand for the following underlying operations:
* persisting and retrieving an article,
* retrieving an author,
* notifying the author about the successful publication of an article,
* posting information about an article to social media,
* sending a message, triggered either by article creation or retrieval, to a message broker 
so that it could be potentially consumed by other services forming parts of the bigger system we are developing.

```
public class ArticleService {

    public ArticleId create(AuthorId authorId, Title title, Content content) {
        Author author = authorRepository.get(authorId);
        Article article = articleRepository.save(author, title, content);

        article.validateEligibilityForPublication();

        eventPublisher.publishCreationOf(article);
        return article.id();
    }

    public Article get(ArticleId id) {
        Article article = articleRepository.get(id);
        eventPublisher.publishRetrievalOf(article);
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

## Outbound adapters

Ports used by the domain for outgoing traffic are implemented by corresponding adapters:
* a database adapter,
* an external author service adapter,
* mail and SMS  systems adapter,
* Twitter API client adapter,
* a message broker publisher adapter.

The outbound adapters, instead of delegating to a public domain service, implement the port interfaces which are part of the domain.

<img alt="API package structure" src="/img/articles/2020-05-09-hexagonal-architecture-by-example/twitter.png"/>

Below you'll find an example of social media publishing implementation, which translates the domain
article to ```ArticleTwitterModel``` and sends the result via the ```TwitterClient```.
The domain ```ArticlePublisher``` which delegates social media publication to a list of ```SocialMediaPublisher```
port interfaces, has no clue about the existence of any Twitter API integration code such as HTTP clients. 

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

    public static final String TWEET = "Check out the new article >>%s<< by %s";
    private final String twitterAccountId;
    private final String tweet;

    static ArticleTwitterModel of(Article article) {
        final String title = article
                .title()
                .value();
        final String twitterId = article.author().name().value();
        return new ArticleTwitterModel(twitterId, String.format(TWEET, title, twitterId));
    }
   //boilerplate code omitted
}
```

## Application flow
By adding logging to the controller and external clients, you can analyze the flow of the article creation and retrieval requests in the application logs:

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
To sum up, the domain, which constitutes the core of our application (centre of the hexagon) 
is surrounded by six adapters. Five of them (the so-called “outbound” adapters) implement domain interfaces, 
while the API adapter (“inbound” adapter) calls the domain logic via a public domain service.

As much as I did my best to design the example so that it would show the benefits of using Hexagonal Architecture in a self-explanatory
and intuitive way, to avoid theoretical elucidations, I would still like to emphasise what we have gained. 
Due to designing the core of the application to be independent of external adapters we achieve e.g.: 
* [Dependency Inversion](https://martinfowler.com/articles/dipInTheWild.html). This way, instead of high-level modules depending on low-level modules, 
both will depend on abstractions, which makes our application follow [SOLID](https://en.wikipedia.org/wiki/SOLID) principles. 
* Testability, as the domain logic can be unit-tested regardless of underlying frameworks and infrastructure that the adapters depend on,
which frees those tests from e.g. transaction management or request and response parsing. All adapters can also be tested independently from each other.
* Extendability, following the [Open-closed Principle](https://en.wikipedia.org/wiki/Open–closed_principle). It's best illustrated by the ```ArticleEventPublisher```, 
which depends on implementations of ```SocialMediaPublisher``` and ```ArticleAuthorNotifier```, 
injected as lists of components by the Spring DI container: adding another implementation, such as an adapter for Facebook,
does not require modifying the domain code.

I hope that the above example depicts the theoretical concepts such as Hexagonal Architecture, Ports and Adapters
in an easy and comprehensible way. I also tried to avoid oversimplifying the example implementation, especially
for the sake of readers who encounter the Hexagonal Architecture approach and Domain Driven Design for the first time. 
It could have been difficult to grasp the difference between a traditional layered architecture and Hexagonal Architecture if the only thing 
your domain is responsible for is storing and fetching data from a repository. The same applies to understanding
the reason why the domain model should be independent from the adapter model. Services,
in which the domain model consists of only one class mapped 1 to 1 by an adapter dto (both classes have the same fields, they have just different names), e.g. a JPA entity,
seem to present Hexagonal Architecture as an over-engineered approach, where one copies the same field values
from class to class just for the sake of the pattern on its own.
## Code examples
If you are interested in the implementation of the example service, fragments of which were included in the code snippets, take a look at the [github repository](https://github.com/dziadeusz/hexagonal-architecture-by-example)

