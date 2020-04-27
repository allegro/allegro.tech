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
There are also several wrapper classes for fields such as id, title or content. This allows you to encapsulate additional business logic or validation, 
as well as avoid passing several String values as method arguments which is generally bad practice and may lead to bugs difficult to track: 
now if you accidentally swap values upon method call your code won't compile. 

## The left-side adapter: REST API

The example microservice, which will help us depict Hexagonal Architecture, 
exposes a very simple REST API. As an author, you can create an article 
and then retrieve its content by issuing POST and GET HTTP requests, respectively.

 ```
@RestController
@RequestMapping("articles")
class ArticleEndpoint {

    @GetMapping("{articleId}")
    ArticleResponse get(@PathVariable("articleId") final String articleId) {
        final Article article = articleService.get(ArticleId.of(articleId));
        return ArticleResponse.of(article);
    }

    @PostMapping
    ArticleIdResponse create(@RequestBody final ArticleRequest articleRequest) {
        final ArticleId articleId = articleService.create(articleRequest.authorId(), articleRequest.title(), articleRequest.content());
        return ArticleIdResponse.of(articleId);
    }
```

The REST adapter implementation accesses the domain logic via a public domain service, which forms a port on its own. 
It is called a left-side port to depict that it handles incoming traffic, while right-side adapters handle outgoing 
traffic and decouple potentially external services called from the domain code.
It is often assumed that each port needs to be an interface, it doesn't make much sense for left-side ports though.
Interfaces, in general, allow you to decouple implementation from the component that uses it. They
are essential to the decoupling of the domain (also referred to as core) and the adapters that implement ports, 
which makes them pluggable and potentially replaceable. It is of vital importance that the domain code is adapter-agnostic 
and has no dependency on adapter implementation code, yet not the other way round. 
Every adapter depends on the domain code at least by implementing one of the ports interfaces and mapping the domain data model. 
So unless you plan to replace your core domain with a different one (the possibility of which appears to be remote, not to say absurd)
and don't want your REST adapter to be affected, hiding the domain services (or facades) behind interfaces
can be seen as over-engineering and gives you nothing in return.

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

    public ArticleId create(final AuthorId authorId, final Title title, final Content content) {
        final Author author = authorRepository.get(authorId);
        final Article article = articleRepository.save(author, title, content);
        eventPublisher.publishCreationOf(article);
        return article.id();
    }

    public Article get(final ArticleId id) {
        final Article article = articleRepository.get(id);
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

    void publishCreationOf(final Article article) {
        messageSender.sendMessageForCreated(article);
        socialMediaPublishers.forEach(socialMediaPublisher -> socialMediaPublisher.publish(article));
        articleAuthorNotifiers.forEach(articleAuthorNotifier -> articleAuthorNotifier.notifyAboutCreationOf(article));
    }

    void publishRetrievalOf(final Article article) {
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

The project package structure reflects the service architecture:
<figure><figcaption><img alt="Example service package structure" src="/img/articles/2020-05-14-hexagonal-architecture-by-example/packages.png" /></figcaption></figure>

## Adapter implementation

Each adapter works on its data model, which can translate itself “from” or “to” the domain model, 
which on the other hand is adapter-model-agnostic.
That's why I favour 
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

    static ArticleResponse of(final Article article) {
        return new ArticleResponse(article.id().value(),
                article.title().value(),
                article.content().value(),
                article.author().name());
    }
    //boilerplate code omitted
}
```

The right-side adapters don’t include the actual implementation, 
such as database or HTTP clients. For the sake of simplicity, they just log messages to the console, 
which may help you follow the flow of the application logic.

```
@Component
class TwitterArticlePublisher implements SocialMediaPublisher {
 
    @Override
    public void publish(final Article article) {
        /**
         * social media integration implementation  using {@link TwitterModel} comes here
         */
        log.info("Article: \"{}\" published on twitter", article.title().value());
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
>>> HTTP GET Request: retrieve an article with id: "9d188cf5-c3de-443f-bb26-5999c531c227"
Fetched article: "Hexagonal Architecture"
Message sent to broker: "Article >>Hexagonal Architecture<< retrieved"
<<< HTTP GET Response: article: "Hexagonal Architecture" successfully retrieved
```
## Summary
I hope that the above example depicts the theoretical concepts such as Hexagonal Architecture, Ports and Adapters
in an easy and comprehensible way. I also tried to avoid oversimplifying the example implementation, especially
for the sake of readers who encounter the HA approach and DDD for the first time. 
It could have been difficult to grasp the difference between a traditional layered architecture and Hexagonal Architecture if the only thing 
your domain is responsible for is storing and fetching data from a repository. The same applies to understanding
the reason why the domain model should be independent from the adapter model. Services,
in which the domain model consists of only one class mapped 1 to 1 by an adapter dto (both classes have the same fields, they have just different names), e.g. a JPA entity,
seems to present Hexagonal Architecture as an over-engineered approach, where one copies the same field values
from class to class just for the sake of the pattern on its own.
## Code examples
If you are interested in the implementation of the example service, fragments of which were included in the code snippets, take a look at the [github repository](https://github.com/dziadeusz/hexagonal-architecture-by-example)

