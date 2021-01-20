---
layout: post
title: Allegro OpenSource — embedded-elasticsearch
author: grzegorz.kaczmarczyk
tags: [elasticsearch, open source]
---

At Allegro we want to be sure that our software works as designed. That’s why tests are so important to us.
In several projects we are using [Elasticsearch](https://www.elastic.co/products/elasticsearch). In order to
make writing integration tests that uses Elasticsearch easier, we’ve created a little tool called
[embedded-elasticsearch](https://github.com/allegro/embedded-elasticsearch). It sets up Elasticsearch
instance that you need for your tests (including installation of plugins) and gives you full control of it.

## Background and motivation

Once, we were writing a service that extensively used Elasticsearch. Almost every request to that service
ended up in a few requests to Elasticsearch, wrapped them up in some other structure and returned a
response to the requester. In software that relies so much on other software, integration tests give you much
more feedback than simple unit tests that mock out external services. So we started writing our
integration tests using Elasticsearch’s `NodeBuilder` to create an embedded instance of Elasticsearch:

```java
Node node = nodeBuilder()
    .settings(Settings.settingsBuilder().put("http.enabled", false))
    .client(true)
    .node();

Client client = node.client();
```

We were happy with that solution. But then we started to struggle with external plugins, which cannot be
simply added using `NodeBuilder`. We also discovered that in projects that use Elasticsearch we tend
to create simple utility classes that make our tests easier. Those classes let us recreate indices using predefined
schema and settings, start and stop a cluster for testing behaviour during cluster stability problems,
and so on. We were not fully satisfied with this approach because our main dependency — Elasticsearch was
not started in the same way, using a starting script, as in production environment, but using its internal
classes. So we decided to create a tool that would solve these problems.

## Solution

Our tool — embedded-elasticsearch is actually pretty simple. You describe desired Elasticsearch instance and
it downloads proper archives and sets up everything. It also gives you control over created instance and
it’s indices.

To start using embedded-elasticsearch in your project add it as a test dependency:

Gradle:

```
testCompile 'pl.allegro.tech:embedded-elasticsearch:1.0.0'
```

Maven:

```xml
<dependency>
    <groupId>pl.allegro.tech</groupId>
    <artifactId>embedded-elasticsearch</artifactId>
    <version>1.0.0</version>
    <scope>testCompile</scope>
</dependency>
```

Below, we show the example of a simple integration test. It’s a quite
dumb spec that writes a document into Elasticsearch, and checks if it's really been written. Note that the test is written
using Spock framework and Groovy language:

```java
package tech.allegro.blog

import pl.allegro.tech.embeddedelasticsearch.EmbeddedElastic
import spock.lang.Specification

class EmbeddedElasticExampleSpec extends Specification {

    static final CLUSTER_NAME = "my_example_cluster"
    static final PORT = 12913
    static final ELASTIC_VERSION = "2.3.3"

    def embeddedElastic = EmbeddedElastic.builder()
            .withElasticVersion(ELASTIC_VERSION)
            .withClusterName(CLUSTER_NAME)
            .withPortNumber(PORT)
            .build()
            .start()

    def client = embeddedElastic.createClient()

    def "should write document into Elasticsearch"() {
        given: "index with single user"
            def usersIndex = "users"
            embeddedElastic.index(usersIndex, "user", '{ "name": "Joe", "surname": "Doe" }')

        when: "searching for all documents"
            def result = client.prepareSearch(usersIndex).execute().actionGet()

        then: "one document should be returned"
            result.hits.hits.length == 1
    }
}
```

When you run that test, you will see in logs that proper Elasticsearch archive is being downloaded and after
that test starts. Archive is downloaded to temporary directory and is not removed after tests execution.
So if you run tests again, same archive will be used to speed up whole process. But get back to our test.
The most important thing for us here is initialization of `embeddedElastic` object. Here you describe your
desired installation: Elasticsearch version (if preferred, you can use url location of your
archive), plugins, cluster name, port number, used indices and their settings. Later on, you use that object
to operate on cluster: create/delete/recreate indices, create documents, start/stop instance and a few other
things. Here is another more sophisticated example. We have a base class for integration tests of a service
that uses four indices and an external plugin called [Decoumpound](https://github.com/jprante/elasticsearch-analysis-decompound):


```java
package tech.allegro.blog

import pl.allegro.tech.embeddedelasticsearch.EmbeddedElastic
import spock.lang.Specification

class IntegrationBaseSpec extends Specification {

    def CLUSTER_NAME = "elasticsearch"
    def SEARCH_INDEX_NAME = "products_v2"
    def SUGGESTER_PRODUCT_NAMES_INDEX_NAME = "suggester_product_names"
    def SUGGESTER_PRODUCT_NAMES_INDEX_TYPE = "products"
    def SUGGESTER_PHRASES_INDEX_NAME = "suggester_phrases"
    def SUGGESTER_PHRASES_INDEX_TYPE = "phrases"
    def SUGGESTER_PHRASES_AGGS_INDEX_NAME = "suggester_phrases_aggs"
    def SUGGESTER_PHRASES_AGGS_INDEX_TYPE = "phrases_aggs"

    def PORT = 9300
    def ELASTIC_VERSION = "2.3.3"
    def DECOMPOUND_DOWNLOAD_URL = new URL("http://xbib.org/repository/org/xbib/elasticsearch/plugin/elasticsearch-analysis-decompound/${ELASTIC_VERSION}.0/elasticsearch-analysis-decompound-${ELASTIC_VERSION}.0-plugin.zip")

    static def embeddedElastic = EmbeddedElastic.builder()
        .withElasticVersion(ELASTIC_VERSION)
        .withPlugin("decompound", DECOMPOUND_DOWNLOAD_URL)
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
with their schemas. It is also advisable to recreate indices after (or before) each specification execution in order to make tests more reliable. Here, it is done in `cleanupSpec()`. Note that you don’t have to bother to stop Elasticsearch after tests:
it’s done automatically in the shutdown hook.

## Source code
Source code is available under Apache licence, and can be found on
[GitHub](https://github.com/allegro/embedded-elasticsearch). Feel free to use that tool, submit suggestions
and pull requests.
