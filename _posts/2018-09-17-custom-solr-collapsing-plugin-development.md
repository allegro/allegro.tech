---
layout: post
title: Custom Solr collapsing plugin development
author: andrzej.wislowski
tags: [solr, lucene, deployment]
---

In Allegro we use Solr as our search engine. Due to our site traffic to our search engine up to 10K rps and index size 
over 100M items we need to develop custom optimization. In this post I will describe the story of our Solr plugin development.

## Business case

Our business owners decided to change the presentation of search results on our e-commerce website. We were supposed 
to group offers of a given product variants on the offer listings, so that, for instance, a seller could set offers of 
trousers differing only with size to be presented as  one product on the offer listing.

## Beginning of development

We have decided to use solr [Collapsing Query Parser](https://lucene.apache.org/solr/guide/7_4/collapse-and-expand-results.html) 
which consists in adding a filter to the Solr query.  We only need to specify the field on which we group the results and the 
document sort in order to select the most appropriate document in the group.

```
fq={!collapse field=group_field sort='numeric_field asc, score desc'}
```

Performance tests with our index size, querying load and the required SLA for response time showed that this is not a sufficient 
solution. The main problem with Collapser Query Parser's was the load on the garbage collector. This was caused by data 
structures created in order to group the results during the execution of the request.

## First version of custom plugin

We have decided to create our own optimized filter. In order to reduce remembering the number of best collected documents so far,
which is done by the Solr collapsing filter, we’ve  decided to sort the index by the identifier of document group. Thanks to this 
solution, our filter was receiving all documents for each group in sequence.  A change of the group identifier at the consumption 
of the following document  was indicating another group of documents and triggered the publication of the best document from the 
previous group.

This way we are able to use the filter to read all documents from the group, select the most suitable one and collect it. So 
during the request we only need to remember one best document from the group and compare it with the current one. We don’t need 
more temporary data, that is cleaned by GC, as it is in solr plugin version.

```
public void collect(int docId) throws IOException {
   int group = groupingField.get(docId);        // read group identifier
   if (previousGroup == group) {                // current document in the same group as a previous document
      If (isBetter(docId, previousBestId)) {    // current document is better than already best in current group
           previousBestId = docId;              // update best document in current group
      }
  } else {                                      // new group
    super.collect(previousBestId);              // collect best document from previous group
    previousGroup = group;                      // update current group identifier
    previousBestId = docId;                     // update best document in current group
  }
}

public void finish() throws IOException {       // when whole segment is read, we collect best document from last group
       super.collect(previousBestId);
}

```

The drawback of this solution comes off from the lucene structure itself.  The filter is performed for each segment separately. 
Therefore, the documents from the same group may be in many segments. Documents from one group will be repeated as many times as 
a number of segments in which they occur. Due to our architecture, where documents from the same group are modified and created 
together, there is a high probability that these documents will be in the same segment.

## Second version

Duplicate documents were rare, but nevertheless we decided to develop a solution without duplicate documents from the same group. 
The first approach was to modify the Collapsing Query Parser to reduce the data structures which are loaded during the request. 
The solr plugin creates a structure that groups documents in memory, and finally presents them. In our case, however, we needed 
to keep only one current best document per group. In addition, we separated faceting queries from document list queries. Faceting 
queries require even less temporary data, as, for instance, there is no need to calculate the score of the document or sort the 
documents in order to find the best one in each group. The performance of faceting queries has proved to be sufficient. However, 
the performance of requests returning lists of results was not satisfactory.

## Third version with priority queue

We tried to optimize the requests’ performance by using priority queue. Most queries return the best 100 results. The first idea 
was to implement grouping by attaching its implementation to Rerank Query. However, after analyzing the lucene code, it turned 
out that our implementation would be based on the implementation of the TopDocsCollector subclasses. This would require the 
implementation of our logic in several classes, so the upgrade of our cluster to higher Solr versions could be hindered as 
dependent on solr internal implementation of TopDocsCollector subclasses. We decided to filter results earlier in the filter. 
As a consequence, we also limited the number of collector operations returning the results.

We base our implementation on the class: _FieldValueHitQueue_. It is a queue sorted by the given list of fields. We have to return 
a list of the best N documents, one for each group.

Below is the scheme of our filter implementation.

<img alt="Scheme of our filter implementation" 
src="/img/articles/2018-09-17-custom-solr-collapsing-plugin-development/algorithm.png" />

Finally, in the collector in the **finish** method, we return documents collected in the priority queue.

The requirement is to set our filter to be performed as the last one.

## The problem with number of results

The problem of our algorithm is the wrong number of results. The number of results in the request is the number of documents 
returned by our filter to the TopDocsCollector collector  where this number is counted. However, we decided to return from 
filter only the requested number of best documents. So, for instance, if we search for 30 best offers, we will get in response 
30 documents and the total number of results will count to 30 also. Unfortunately, this prevents us from building navigation 
that presents number of result pages. In order to handle the correct number of documents available for the given criterion, 
we count the number of documents consumed in filter and save it on the request context variable. Then at SearchComponent 
we change the number of returned results in the **Response** class.

Here is how it looks in our code:

In the finish method of our filter we put the number of document groups into the request context variable:
```
public void finish() throws IOException {
…
    solrQueryRequest.getContext().put(“REQUEST_TOTAL_HITS”,size);
…
}
```
We add our own search component:
```
public class CollapsingSearchComponent extends SearchComponent {

@Override
public void process(ResponseBuilder rb) {
    // if request contains context variable with the number of documents group
    if (rb.req.getContext().containsKey(“REQUEST_TOTAL_HITS”)) {
        Integer hits = (Integer) rb.req.getContext().get(“REQUEST_TOTAL_HITS”);

    //response object is replaced with the number of results
    rb.rsp.getValues().remove("response");
    DocSlice docList = (DocSlice) response.getDocList();
    DocSlice modifiedDocList = new DocSlice(docList.offset, docList.len, docList.docs, docList.scores, hits, docList.maxScore);
    rb.rsp.addResponse(new BasicResultContext(modifiedDocList, response.getReturnFields(), response.getSearcher(), response.getQuery(), response.getRequest()));

    //results number is also replaced in a structure used for application log
    rb.rsp.getToLog().remove(HITS);
    rb.rsp.getToLog().add(HITS, hits);
   }
}

```

We have to instantiate this component in configuration:
```
<searchComponent name="collapseHits" class="org.apache.solr.search.CollapsingSearchComponent"/>
```

And finally on our search handler we turn it on:
```
<requestHandler name="/select" class="solr.SearchHandler">
	<arr name="components">
		<str>query</str>
		<str>collapseHits</str>
	</arr>
</requestHandler>
```

## Conclusion

Our experience with the possibilities of Solr in terms of efficiency and flexibility in modifying the request for search 
has been very positive. With the development of large solutions, we are able to modify our search engine to meet the 
challenges that our business brings to us. Maintaining custom changes in the search code is possible to be handled at 
the plugins level, which allows us to easily upgrade the succeeding versions of Solr.

