---
layout: post
title: Hexagonal Architecture by example: a hands-on introduction
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
of the example project are organized, rather than a generic conceptual example.
<figure><figcaption><img alt="Architecture diagram" src="/img/articles/2020-05-14-hexagonal-architecture-by-example/packages.png"/></figcaption></figure>

The project package structure also reflects the service architecture. 
<figure><figcaption><img alt="Example service package structure" src="/img/articles/2020-05-14-hexagonal-architecture-by-example/ha_example.png"/></figcaption></figure>

## The left-side adapter: REST API

The example microservice, which will help us depict Hexagonal Architecture, 
exposes a very simple REST API. As an author, you can create an article 
and then retrieve its content by issuing POST and GET HTTP requests, respectively.

 ```
@RestController
@RequestMapping("articles")
class ArticleEndpoint {

    @GetMapping("{articleId}")
    ArticleResponse get(@PathVariable("articleId") String articleId) {
        Article article = articleService.get(ArticleId.of(articleId));
        return ArticleResponse.of(article);
    }

    @PostMapping
    ArticleIdResponse create(@RequestBody ArticleRequest articleRequest) {
        ArticleId articleId = articleService.create(articleRequest.authorId(), articleRequest.title(), articleRequest.content());
        return ArticleIdResponse.of(articleId);
    }
    //boilerplate code omitted
}
```

The REST adapter implementation accesses the domain logic via a public domain service. I would like to emphasise, that this is a simplification 
as due to the overall simplicity of the example I tried to avoid over-engineering, since it would beat the purpose of the whole article.
Nevertheless, calling domain services directly from the controller may lead to the *fat controller antipattern*, due to the fact that orchestration logic should not
be the responsibility of the controller, this is where [***application*** services](http://gorodinski.com/blog/2012/04/14/services-in-domain-driven-design-ddd/) come into play (not ***domain*** services).
An application service, a concept which does not belong neither to the domain nor to the API adapter, could also be
responsible for domain model translation, apart from domain logic orchestration. Though, it would not be of much use for the trivial translation which now resides in the controller: 
```
ArticleResponse.of(article);
```

The domain service forms a port on its own. It is called a left-side port to depict that it handles incoming traffic, while right-side adapters handle outgoing 
traffic and decouple (potentially) external services called from the domain code.
It is often assumed that each port needs to be an interface, it doesn't make much sense for left-side ports though.
Interfaces, in general, allow you to decouple implementation from the component that uses it, following the [Dependency Inversion Principle]([dependency inversion](https://martinfowler.com/articles/dipInTheWild.html)). They
are essential to the decoupling of the domain (also referred to as core) and the adapters that implement ports, 
which makes them pluggable and potentially replaceable. It is of vital importance that the domain code is adapter-agnostic 
and has no dependency on adapter implementation, yet not the other way round. 
Every adapter depends on the domain code at least by implementing one of the port interfaces or mapping the domain data model. 
Hiding domain services behind interfaces should be seen as over-engineering and gives you nothing in return.

## Domain logic and right side adapters

The domain operations implemented in ArticleService, creating and retrieving an article, 
depend on external dependencies hidden by the abstraction of ports. 
Ports, from the domain perspective, are only declared as interfaces. 
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

Domain logic responsible for sending data to external systems, as a side-effect of article creation and retrieval, has been encapsulated
in ArticleEventPublisher.

```
public class ArticleEventPublisher {

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
The aforementioned ports are implemented by corresponding adapters:
* a database adapter,
* an external author service adapter,
* mail and SMS  systems adapter,
* Twitter API client adapter,
* a message broker publisher adapter.

To sum up, the domain, which constitutes the core of our application (center of the hexagon) 
is surrounded by six adapters. Five of them (the so-called “right-side”, “outgoing” adapters) implement domain interfaces, 
while the API adapter (“left-side” or “incoming” adapter) calls the domain logic via a public domain service.

## Adapter implementation

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
Below you'll find the REST API adapter model as an example.
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
And an example of social media publisher implementation, which translates the domain
article to ```ArticleTwitterModel``` and sends the result via the ```TwitterClient```.
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

## Application flow
You can analyze the flow of the article creation and retrieval requests in the application logs:
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
As much as I did my best to design the example so that it would show the benefits of using Hexagonal Architecture in a self-explanatory
and intuitive way, to avoid theoretical elucidations, I would still like to emphasise what we have gained. 
Designing the core of the application to be independent of external adapters we achieve e.g.: 
* [Dependency Inversion](https://martinfowler.com/articles/dipInTheWild.html). This way, instead of high-level modules depending on low-level modules, 
both will depend on abstractions, which makes our application follow [SOLID](https://en.wikipedia.org/wiki/SOLID) principles. 
* Testability, as the domain logic can be unit-tested regardless of underlying frameworks and infrastructure that the adapters depend on,
which frees those tests from e.g. transaction management or request and response parsing. All adapters can also be tested independently from each other.
* Extendability, following the [Open-closed Principle](https://en.wikipedia.org/wiki/Open–closed_principle). It's best illustrated by the ```ArticleEventPublisher```, which depends on
on implementations of ```SocialMediaPublisher``` and ```ArticleAuthorNotifier```, injected as lists of components by the Spring DI container: adding another implementation, such as an adapter for Facebook,
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

