---
layout: post
title: Hexagonal Architecture by example: a hands-on introduction
author: karol.kuc
tags: [tech, ddd, hexagonal-architecture, java]
---

When you go through articles related to Hexagonal Architecture, you are usually searching for practical examples of specific use cases
of this rather complex pattern. In most posts you encounter, you have to scroll through exact citations or rephrased definitions of concepts such as 
Ports and Adapters or their conceptual diagrams, which have already been well defined and described by popular authors i.e. 
[Alistair Cockburn](http://alistair.cockburn.us/Hexagonal+Architecture) or [Martin Fowler](https://martinfowler.com/eaaCatalog/gateway.html). 
I assume you already have a general understanding of Domain Driven Design and that you understand terms such as Ports and Adapters.

## Introducing the domain
In this article, we will focus on providing a quick and practical example that will be based on a very straightforward domain including only two simple domain objects:
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
    private final String name;
    //boilerplate code ommited
}

```
There are also several wrapper objects for fields such as id, title or content. This allows you encapsulate additional business logic or validation, 
as well as avoid passing several String values as method arguments which is generally bad practice and may lead to bugs difficult to track: 
now if you accidentally swap values upon method call your code won't compile. 

## The left side adapter: REST API

The example service, which will help us depict Hexagonal Architecture, 
exposes a very simple REST API: as an author, you can create an article 
and then retrieve its content by issuing POST and GET HTTP requests, respectively.

 ```
@RestController
@RequestMapping("articles")
class ArticleController {
    
    @GetMapping("{articleId}")
    ArticleResponse get(@PathVariable("articleId") final String articleId) {
        log.info(">>> HTTP GET Request: retrieve an article with id: \"{}\"", articleId);
        final ArticleResponse articleResponse = service.get(articleId);
        log.info("<<< HTTP GET Response: article: \"{}\", successfully retrieved", articleResponse.title());
        return articleResponse;
    }
 
    @PostMapping
    ArticleIdResponse create(@RequestBody final ArticleRequest articleRequest) {
        log.info(">>> HTTP POST Request: create an article: \"{}\"", articleRequest.title().value());
        final ArticleIdResponse articleIdResponse = service.create(articleRequest);
        log.info("<<< HTTP POST Response: article with id: \"{}\", successfully created", articleIdResponse.id());
        return articleIdResponse;
    }
    //boilerplate code omitted
}
```

The REST adapter implementation accesses the domain logic via a public facade which forms a port on its own. It is called
a right-side port to depict that it handles incoming traffic, while left-side adapters handle outgoing traffic and decouple potentially
external services called from the domain code.
It is often assumed that each port needs to be an interface, 
it doesn't make much sense for left-side ports though.
Interfaces, in general, allow you to decouple implementation from the component that uses it. They
are essential to the decoupling of the domain (also referred to as core) and the adapters that implement ports, which makes them
pluggable and potentially replaceable. It is of vital importance that the domain code is adapter-agnostic and has no dependency on adapter implementation code, yet not necessarily not the other way round. Every adapter depends on the domain code at least by implementing one of the ports interfaces. So unless you plan to replace your core domain with a different one
and don't want your REST adapter to be affected, hiding the domain services (or facades) behind interfaces
can be seen as over-engineering and gives you nothing in return.

```
@Component
class ArticleService {

    private final ArticleFacade articleFacade;

    ArticleService(final ArticleFacade articleFacade) {
        this.articleFacade = articleFacade;
    }

    ArticleResponse get(final String articleId) {
        return ArticleResponse.of(articleFacade.get(ArticleId.of(articleId)));
    }

    ArticleIdResponse create(final ArticleRequest articleRequest) {
        final ArticleId articleId = articleFacade.create(articleRequest.authorId(), articleRequest.title(), articleRequest.content());
        return ArticleIdResponse.of(articleId);
    }
}
```

## Right side adapters

The domain operations, creating and retrieving an article, 
depend on external dependencies hidden by the abstraction of ports, 
which from the domain perspective are only declared as interfaces. 
These dependencies stand for the following underlying operations:
* persisting and retrieving an article,
* retrieving an author,
* notifying the author about the successful publication of an article,
* posting information about an article to social media,
* publishing an event, triggered either by article creation or retrieval, on an event bus so that it could be potentially consumed by other services forming parts of the bigger system we are developing.
```
public class ArticleFacade {
 
    private final ArticleEventPublisher eventPublisher;
    private final ArticleRepository articleRepository;
    private final AuthorRepository authorRepository;
    private final List<SocialMediaPublisher> socialMediaPublishers;
    private final List<ArticleAuthorNotifier> articleAuthorNotifiers;
 
    public ArticleId create(final AuthorId authorId, final Title title, final Content content) {
        final Author author = authorRepository.get(authorId);
        final Article article = articleRepository.save(author, title, content);
        eventPublisher.publishArticleCreationEvent(article);
        socialMediaPublishers.forEach(socialMediaPublisher -> socialMediaPublisher.publish(article));
        articleAuthorNotifiers.forEach(articleAuthorNotifier -> articleAuthorNotifier.notifyAboutArticleCreation(article));
        return article.id();
    }
 
    public Article get(final ArticleId id) {
        final Article article = articleRepository.get(id);
        eventPublisher.publishArticleRetrievalEvent(article);
        return article;
    }
   //boilerplate code omitted
}
```

The aforementioned ports are implemented by corresponding adapters:
* a database adapter,
* an external author service adapter,
* mail and SMS  systems adapter,
* Twitter API client adapter,
* a message broker publisher adapter.
Combined with the REST API, the domain, 
which constitutes the core of our application (center of the hexagon) 
is surrounded by six adapters. 
Five of them (the so-called “right-side”, “outgoing” adapters) implement domain interfaces, 
while the API adapter (“left-side” or “incoming” adapter) calls the domain logic via a public Facade.

The project package structure reflects the service architecture:
<figure><figcaption><img alt="Example service package structure" src="/img/articles/2019-12-24-hexagonal-architecture-by-example/packages.png" /></figcaption></figure>

## Adapter implementation

Each adapter works on its model, which can translate itself “from” or “to” the domain model, which on the other hand is adapter-model-agnostic.
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
>>> HTTP POST Request: create an article: "Hexagonal Architecture"
Author: "William Shakespeare" fetched
Article: "Hexagonal Architecture" persisted
Article: "Hexagonal Architecture" creation event published on event bus
Article: "Hexagonal Architecture" published on twitter
Mail sent to author: "William Shakespeare"
SMS sent to author: "William Shakespeare"
<<< HTTP POST Response: article with identifier: "6dfa5e2a-e0c7-4147-8fcc-25b637178b19" successfully created
>>> HTTP GET Request: retrieve an article with identifier: "6dfa5e2a-e0c7-4147-8fcc-25b637178b19"
Article "Hexagonal Architecture" fetched
Article: "Hexagonal Architecture" retrieval event published on event bus
<<< HTTP GET Response: article: "Hexagonal Architecture" successfully retrieved
```

If you are interested in the implementation of the example service, fragments of which were included in the code snippets, take a look at the [github repository](https://github.com/dziadeusz/hexagonal-architecture-by-example)

