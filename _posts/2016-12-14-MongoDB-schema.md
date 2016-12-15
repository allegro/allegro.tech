---
layout: post
title: Responsible work with MongoDB
author: [tomasz.fijalkowski]
tags: [tech, MongoDB, NoSQL, RDBMS]
---

Understanding data structures is sufficient requirement to design good database schema in *RDBMSs* (relational
database management system). Having this knowledgeyou are able to construct normalized tables, add appropriate
constraints and finally create indexes to perform queries.

In the world of NoSQL there are no simple solutions, rules and answers. That is why we can only talk about
patterns, tips and hints. MongoDB is not an exception. Besides the comprehension of stored data, a deep
understanding of access pattern, how the data is finding, inserting and updating by application is needed.

This is still not the end. The key is an old good experience which help you to find the optimal balance between
performance and flexibility, establish appropriate level of denormalization, choose between optimize writes or
reads, consistence and latency ect. Just like in life, if you buy a car you want to have a good acceleration,
low fuel consumption, large trunk and not too much to pay. You can not have it all, you have to decide which
requirements are important.

In this article I will give some guidance on how to work with MongoDB database, present its limitations and
points to trade-off, and give some hints how to design collections and documents. This article concentrates
on use MongoDB as typical app database — main database for single application with read mostly pattern.

## Consistency and the appropriate level of denormalization

The first question which should be to answer is to embed documents or not embed? General rule says that if you
operate on dependent documents it should be a separated collection. Lets take classic blog app as an example.
Each blog post has some comments. If comments are only show under the post they may be embedded, but if someone
wants to make some operation like eg. filter or sort them to create top 10 comments page, it should be separated
collection.

Usually the real examples are more complicated. What about information about the authors of posts and comments?
In our blog app each post and comment may has embedded information such as author name or his email address. This
solution may improve read latency of generating post page — all necessary data can be obtained by one or two queries
 — but it also poses problems and threats. If any user will change an email address, all his post and comments must
by founded and updated. Here are some of the consequences:

- A lot of code is needed to handle all write queries.
- Write operations may take relatively long time.
- Some updates may fail (eg. Because of database / app / network fails).
- There is no isolation mechanism so write and read queries from many clients may be interlaced what causes reading of
partial update data.

It is one of significant trade-off. Embedding documents optimizes reading but increases the risk of inconsistency as
well as the complexity of updates code and the difficulty of its maintenance. Normalized data guarantee consistent
readings  but they are often time consuming due to the necessity of using several documents.

Fortunately we can live with that inconvenience. Normalization is very important when the database client is a person,
not an app. The strict consistency is not as necessary as many think. Lets take a look on another classic example — bank
account money transfer. To do the transfer we take some money from one account and add it to second one. Old professors
would give their lives for ACID transaction justifying that a situation in which money which disappear from one account
will not appear on the other, can not take place.

However, banking systems existed before computer systems and from the beginning they do not work with strict consistency
but with eventual consistency. There is nothing surprising in a situation where the money after transfer will appear
on destination account on the next day. If you take out money from an ATM it is theoretically possible to exceed the
limit taking money from another one in a short period of time. But even if you succeed it, this fraud will be eventually
detected.

How the method of banks operation can help to solve the problem of changing the email address on our blog application?
To be able to detect inconsistencies the source of truth should be determined. You can update just one document in user
collection and send acknowledge about succeeded operation. Other changes can be made asynchronously what improve writing
latency. If something goes wrong with additional updates the process of detecting inconsistencies corrects errors,
so the system will by eventually consistent.

What does this have to do with the transfer of money between accounts? What is the source of truth? In this case
additional collection which I call *collection of truth* is needed. Let's name this collection `TransactionLogs` and
store in documents like:

```json
{
    "_Id" : "someID",
    "amount": "200",
    "fromAccount": ObjectId("568ec07683ee780023a90c29"),
    "toAccount": ObjectId("567ec07683ee780023a50d62"),
}
```

The state of each account can be verified and reproduced based on this collection.

There is one more thing should be aware of when repeating failed operation.
Even if the command was successful, app may not receive acknowledge because of network failure.
By repeating that command you will instruct another transfer.
To prevent that, writing operation to the source of truth should be **idempotent**.

To perform verification process you can calculate and store snapshots of data from collection of truth.
The collection size limitation can be achieved by making it
[Capped Collections](https://docs.mongodb.com/manual/core/capped-collections/).

In such case we give up strong consistency to eventual consistency and increase performance.
If  you can live with some percent of false positives or false negatives errors you can also
give up eventual consistency and idempotent operations. A good example is counting of page views.

## Migration and refactorization

It is commonly said that MongoDB like most od NoSQL databases is schemaless. In practice, when you work
with MongoDB you actually work with *implicit schema* — each document has its own schema which you can control in your app.
No matter how good was the schema when you design it, the necessity to change it will come eventually.
Two important issues related to the maintenance of the applications are presented below.

### Data migration


Some applications operate on huge data set and need 24*7 uptime. To migrate data
in such application you can not stop it for the migration time — the whole process may takes hours.
I recommend following migration process which based on polymorphic data nature of document—oriented database:

1. Modify code of Object—Document Mapper (ODM) to be compatible with both version of the document.
2. Deploy new version of the application.
3. Start migrate each document one by one.
4. When migration is finished, remove support for the old version of the document from ODM.

The step 4. is very important. Avoid to support more then two versions of document schema,
otherwise you may fall in conditions hell and make your ODM layer very complex.

This is a way to change stored documents schema, but what about indexes?

### Creating new indexes

New business requirements bring a need to add new database queries. To make them efficient, new indexes are required.
Creating an index on collection of size about 50 GB may takes hours and has negative impact on production system.
The solution is to use replication as follow:

1. Create index on slave node.
2. Promote the slave node to master.
3. Create index on other slaves.

That process lets your application work clear and smoothly even if whole migration takes hours.

## Data Access Layer

To work effectively with MongoDB it is important to have clear separated data access layer in application. All accesses
should be grouped in packages, modules or other code grouping units. This approach allows anyone to quickly analyze how
application queries and uses the database.

Another question is how to build ODM? Is it good or bad practise to use frameworks like Spring Data?
Does their advantages not bring in the project too many restrictions?
To answer that questions let define a good ODM layer as one which allows:

- make partial updates (modify part of document, change one field or add element to embedded list without changing whole
document)
- work with polymorphic data (many schema versions in one collection)
- use specific MongoDB operation like findAndModify or update with upsert
-  inject some services or dependencies when working with rich domain mode

That set of requirements makes me building own ODM layer with no any Spring Data like framework when working with MongoDB.
This allows me to use all advantages of MongoDB at the price of giving up take-and-use solutions.

## Saving disc space with short keys

In MongoDB the keys selection is important for the size of the database. Keys are in fact stored together with the
associated documents, each document keep its schema. If you are OK with *pa* key instead of *platform_account* you can
save 14 bytes per document. It may seem not much, but if you store a 10^8 of such documents, you can save almost 1.4 GB
of data size.

Smaller collection size means: quick backup and restore, more documents can be cached by database, smaller collection
chunks in sharding etc.

Once I heard the story about the programmer who reduced the size of production collections by 30% just by shortening the
keys. By sacrificing readability of documents, you can achieved the size of data reduction and performance improvement.
Every time you have to find the right proportions.

## Durability

ACID transaction accustomed us to durability of write operations. If I saved a data it means that they are indeed saved.
It is true for RDBMS with ACID transactions, but not for MongoDB in default configuration. It is especially important if
you work with critical data (eg. financial). There are two typical issues:

Whe you work with *replica set* and wait for write acknowledgment only from the master, you can loss data witch was
not replicated to any slave node [Oplog](https://docs.mongodb.com/v3.2/core/replica-set-oplog/) (when new master is
elected, not replicated data from old master will be unrolled). To prevent data loss you can set
[`w`](https://docs.mongodb.com/manual/reference/write-concern/#wc-w) (`wValue`) connection. This option forces to wait
for acknowledge until the data will be replicated on:

- a certain number of of nodes
- an any node in each data center (with taged nodes)
- and finally in majority of nodes witch guarantees that no data will be rollback.

Second threat for durability is [journaling](https://docs.mongodb.com/manual/core/journaling/). Write operation are
stored in journal witch is synchronize with disc every 50 ms for WiredTiger and 100 ms for MMAPv1 *stored engine*.
It means that you can lose writes from last 50 ms (or 100 ms for MMAPv1) when unclear shout down occurs. To prevent
this you can tern off journaling which is not recommended or set
[`j`](https://docs.mongodb.com/manual/reference/write-concern/#wc-j) write concern option as `true`. It cause of waiting
for journal sync before send acknowledge. This flag only applies to master node so it makes sense to set it only when
you are not using replication. Be careful about setting this flag for all writes, instead I suggest you put
this flag only for critical operations if at all (replication with `w` option is more rational).

This is another trade-off where you have to chose between latency and durability.

## Summary

### A difficult compromise

There is more trades-off then it was presented in this article like ex. allow or not to read from slave nodes. Usually
there is more than one good solution, which can leads to conflicts between a team members who appreciate different values.
For some people performance is more important than flexibility, for some it is the opposite. Everyone has the right, and
at the same time is wrong.

### If it hurts, stop doing it!

If you can't solve problems with clear model, probably you use wrong tool. Don't try to use tricky algorithm, instead of
this thing about other solution like

- Other database
- [Polyglot persistence](http://martinfowler.com/bliki/PolyglotPersistence.html)
- [Lambda architecture](http://lambda-architecture.net)

And remember, failed is a result. Don't try to be resistant for all failures, be ready for failures and be able
to detect and fix them.
