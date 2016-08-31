---
layout: post
title: Allegro OpenSource: embedded-elasticsearch
author: grzegorz.kaczmarczyk
tags: [tech, elasticsearch, open source]
---

At Allegro we want to be sure that our software works as designed. That’s why tests are so important to us. 
In several projects we are using [Elasticsearch](https://www.elastic.co/products/elasticsearch). To ease up 
writing integration tests that uses Elasticsearch we’ve created little tool called embedded-elasticsearch. 
Let me introduce you to it.

# Background

Once, we were writing service that extensively used Elasticsearch. Practically every request to that service 
ended up doing a coupleb of few requests to Elasticsearch, wrap them up in some other structure and return a 
response to the requester. In software that rely so much on other software, integration tests gives you much 
more feedback than simple unit tests that mocks out third party dependencies. So we started writing our 
integration tests using Elasticsearch’s `NodeBuilder` to create embedded instance of Elasticsearch:

```
Node node = nodeBuilder()
        .settings(Settings.settingsBuilder().put("http.enabled", false))
        .client(true)
    .node();

Client client = node.client();
```

We were happy with that solution. But soon we started to struggle with external plugins, which cannot be 
simply added using `NodeBuilder`. We also discovered that in projects using Elasticsearch we tend to create 
simple utility classes that ease up our tests. Those classes let us recreate indices using predefined schema 
and settings, starting and stopping cluster for testing behaviour during cluster stability problems, and so on. 
We were not fully satisfied with this approach because our main dependency was not started in same way, using 
starting script, as in production, but programatically, using its internal classes. So we decided to create a 
tool that will solve those problems. 

Our solution embedded-elasticsearch is actually pretty simple. You describe desired Elasticsearch instance and 
our tool downloads proper archives and set ups everything. It also gives you control over created instance and 
its indices. Because code tells more than words, let me show you simplest possible example. It will be quite 
dumb spec that writes document into Elasticsearch, and checks if it is really written. Note that it is written 
using Spock framework and Groovy language:

```
class EmbeddedElasticExampleSpec extends Specification {

    static final CLUSTER_NAME = "my_example_cluster"
    static final PORT = 12913
    static final ELASTIC_VERSION = "2.3.3"

    static final embeddedElastic = EmbeddedElastic.builder()
            .withElasticVersion(ELASTIC_VERSION)
            .withClusterName(CLUSTER_NAME)
            .withPortNumber(PORT)
            .build()
            .start()
    
    static final client = embeddedElastic.createClient()

    def "should write document into Elasticsearch"() {
        given: "index with single user"
        final usersIndex = "users"
            embeddedElastic.index(usersIndex, "user", 
                """ { "name": "Joe", "surname": "Doe" } """)
        
        when: "searching for all documents"
            final result = client.prepareSearch(usersIndex)
                    .execute().actionGet()
        
        then: "only one document should be returned"
            result.hits.hits.length == 1
    }
}
```

When you run that test, you will see in logs that proper Elasticsearch archive is being downloaded and after 
that test starts. The most important thing for us here is initialization of `embeddedElastic` object. Here you 
describe your desired installation: Elasticsearch version (if preferred, you can use url location of your 
archive), plugins, cluster name, port number, used indices and their settings. Later on, you use that object 
to operate on cluster: create/delete/recreate indices, create documents, start/stop instance and few other 
things. Here is another more sophisticated example. We have base class for integration tests of service, 
that uses four indices, and external plugin called [Decoumpound](https://github.com/jprante/elasticsearch-analysis-decompound):


```
class IntegrationBaseSpec extends Specification {

    static final CLUSTER_NAME = "elasticsearch"
    static final SEARCH_INDEX_NAME = "products_v2"
    static final SUGGESTER_PRODUCT_NAMES_INDEX_NAME = "suggester_product_names"
    static final SUGGESTER_PRODUCT_NAMES_INDEX_TYPE = "products"
    static final SUGGESTER_PHRASES_INDEX_NAME = "suggester_phrases"
    static final SUGGESTER_PHRASES_INDEX_TYPE = "phrases"
    static final SUGGESTER_PHRASES_AGGS_INDEX_NAME = "suggester_phrases_aggs"
    static final SUGGESTER_PHRASES_AGGS_INDEX_TYPE = "phrases_aggs"

    static final PORT = 9300
    static final ELASTIC_VERSION = "2.3.3"
    static final DECOMPOUND_PLUGIN = "decompound"
    static final DECOMPOUND_DOWNLOAD_URL = new URL("http://xbib.org/repository/org/xbib/elasticsearch/plugin/elasticsearch-analysis-decompound/${ELASTIC_VERSION}.0/elasticsearch-analysis-decompound-${ELASTIC_VERSION}.0-plugin.zip")

    static final embeddedElastic = EmbeddedElastic.builder()
        .withElasticVersion(ELASTIC_VERSION)
        .withPlugin(DECOMPOUND_PLUGIN, DECOMPOUND_DOWNLOAD_URL)
        .withClusterName(CLUSTER_NAME)
        .withPortNumber(PORT)
        .withIndex(SEARCH_INDEX_NAME)
        .withIndex(SUGGESTER_PRODUCT_NAMES_INDEX_NAME, IndexSettings.builder()
            .withSettings(getResourceAsStream("products/elastic-settings.json"))
            .withType(SUGGESTER_PRODUCT_NAMES_INDEX_TYPE, getResourceAsStream("products/elastic-mapping.json"))
            .build())
        .withIndex(SUGGESTER_PHRASES_INDEX_NAME, IndexSettings.builder()
            .withSettings(getResourceAsStream("phrases/elastic-settings.json"))
            .withType(SUGGESTER_PHRASES_INDEX_TYPE, getResourceAsStream("phrases/elastic-mapping.json"))
            .build())
        .withIndex(SUGGESTER_PHRASES_AGGS_INDEX_NAME, IndexSettings.builder()
            .withSettings(getResourceAsStream("phrases-aggs/elastic-settings.json"))
            .withType(SUGGESTER_PHRASES_AGGS_INDEX_TYPE, getResourceAsStream("phrases-aggs/elastic-mapping.json"))
            .build())
        .build()
        .start()

    def cleanupSpec() {
        embeddedElastic.recreateIndices()
    }
}
```

Index definition is straightforward: you must specify index name, settings, and optionally one or more types 
with their schemas. It is also advised to recreate indices after every spec, so tests will be more reliable, 
what is done in `cleanupSpec` method. Note that you don’t have to bother to stop Elasticsearch after tests: 
it’s done automatically in shutdown hook.

# Source code
Source code is available under Apache licence, and can be found on [GitHub](https://github.com/allegro/embedded-elasticsearch). Feel free to use that tool, submit suggestions and pull requests.
