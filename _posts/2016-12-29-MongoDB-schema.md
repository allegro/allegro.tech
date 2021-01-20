---
layout: post
title: Responsible work with MongoDB
author: [tomasz.fijalkowski]
tags: [MongoDB, NoSQL, RDBMS]
---

Understanding data model is sufficient to design good database schema in RDBMS (relational
database management system). Having this knowledge you are able to construct normalized tables, add appropriate
constraints and finally create indexes to speed up queries.
In the world of NoSQL there are no simple solutions, rules and answers. That’s why we can only talk about
patterns, tips and hints. MongoDB is not an exception. Besides the comprehension of stored data, deep
understanding of an access pattern, how data is searched, inserted and updated by an application is needed.

This is still not the end. The key is an old good experience which help you to find the optimal balance between
performance and flexibility, establish appropriate level of denormalization, choose between optimizing writes or
reads, consistence or latency, ect. Just like in life, if you buy a car you want to have a good acceleration,
low fuel consumption, large trunk and low price. Since you can’t have them all, you have to decide which
requirements are the most important.

In this article I give some guidance on how to work with MongoDB database, I present its limitations and
trade-off points and give some hints how to design collections and documents. This article focuses on typical
MongoDB usage — main database for single application with read mostly pattern.

## Consistency and the appropriate level of denormalization

The first question which should be answered is to embed documents or not to embed them? General rule says that if you
operate on dependent documents they should be stored in a separated collection. Let’s take classic blog app as an example.
Each blog post has some comments. If comments are shown only under the post they may be embedded, but if someone
wants to perform an operation like filtering or sorting them to create a page presented top ten comments, it should be
stored in a separated collection.

Usually the real examples are more complicated. What about information about posts authors and comments authors?
In our blog app each post and comment may have embedded information such as an author name or his email address. This
solution may improve read latency of generating a post page — all necessary data can be obtained by one or two queries
 — but it also poses problems and threats. If some user will change an email address, all his post and comments must
by found and updated. Here are some of consequences:

- A lot of code is needed to handle all write queries.
- Write operations may take relatively long time.
- Some updates may fail (eg. because of database / app / network fails).
- There is no transaction isolation mechanism so write and read queries from many clients may be interlaced which cause
reading of partially updated data.

It’s one of the significant trade-offs. Embedding documents optimizes reading but increases the risk of inconsistency as
as well as the code maintenance difficulty. Normalized data guarantees consistent reads but page generation are often
more time-consuming due to the necessity of using several documents and several queries.

Fortunately, we can live with that inconvenience. Normalization is very important when the database client is a person,
not an app. The strict consistency is not as necessary as you may think. Let's take a look on another classic example — bank
account money transfer. To do the transfer we take some money from one account and add it to second one. Old professors
would give their lives for ACID transaction — justifying that a situation in which money which disappears from one account
will not appear on the other, can not take place.

However, banking systems existed before computer systems and from the beginning they don’t work with strict consistency
but with eventual consistency. There is nothing surprising in a situation where the money after transfer will appear
on destination account on the next day. If you take out money from an ATM it's theoretically possible to exceed the
limit by taking money from another one in a short period of time. But even if you succeed, this fraud will be eventually
detected.

How the method of banks operation can help to solve the problem of changing the email address on our blog application?
To be able to detect inconsistencies the source of truth should be determined. You can update just one document in users
collection and send acknowledge about succeeded operation. Other changes can be made asynchronously to improve writing
latency. If something goes wrong with additional updates the process of detecting inconsistencies correct errors,
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

The state of each account can be verified and reproduced based on this collection. This approach is similar to
[Event Sourcing](http://martinfowler.com/eaaDev/EventSourcing.html) architectural pattern.

There is one more thing you should be aware of when repeating a failed operation.
Even if the command was successful, the app might not receive an acknowledge because of a network failure.
By repeating that command you will apply the same money transfer twice.
To prevent that, writing operation to the source of truth should be **idempotent**.

To perform the verification process you can calculate and store snapshots of data from the collection of truth.
The collection size limitation can be achieved by making it
[Capped Collections](https://docs.mongodb.com/manual/core/capped-collections/).

In such case we trade up strong consistency to eventual consistency and increased performance.
If  you can live with some percent of false positives or false negatives errors you can also
give up eventual consistency and idempotent operations. A good example is counting of page views when
high accuracy is not required.

## Migration and refactoring

It’s commonly said that MongoDB, like most NoSQL databases, is schemaless. In practice, when you work
with MongoDB you actually work with *implicit schema* — each document has its own schema which you can control in your app.
No matter how good was the schema when you design it, the necessity to change will come eventually.
Two important issues related to application maintenance are presented below.

### Data migration

Some applications operate on huge data set and need 24*7 uptime. To migrate data
in such application you can’t stop it for the migration time — the whole process may takes hours.
I recommend the following migration process which is based on
[polymorphic data](http://stackoverflow.com/questions/39867278/what-is-polymorphic-data-nosql-databases)
nature of document-oriented database:

1. Modify the code of Object—Document Mapper (ODM) to be compatible with both version of the document.
2. Deploy a new version of the application.
3. Start migrating each document one by one.
4. When migration is finished, remove support for the old version of the document from ODM.

The fourth step is very important. Avoid to support more then two versions of document schema,
otherwise you may fall in conditions hell and make your ODM layer very complex.

This is the way to change stored documents schema, but what about indexes?

### Creating new indexes

New business requirements bring a need to add new database queries. To make them efficient, new indexes are required.
Creating an index on a collection of size about 50 GB may takes hours and has negative impact on a production system.
The solution is to use replication as follow:

1. Create index on a slave node.
2. Promote the slave node to master.
3. Create index on other slaves.

That process lets your application work clearly and smoothly even if whole migration takes hours.

## Data Access Layer

To work effectively with MongoDB it’s important to have clear separated data access layer. All access
should be grouped in packages, modules or other code grouping units. This approach allows anyone to quickly analyze how
an application queries and uses the database.

Another question is how to build ODM? Is it good or bad practice to use frameworks like Spring Data?
Does their advantages bring in too many restrictions to a project?
To answer that questions let's define a good ODM layer as one that allow:

- making partial updates (modifying part of a document, changing one field or adding an element to embedded list without
changing a whole document),
- work with polymorphic data (many schema versions in one collection),
- use specific MongoDB operation like findAndModify or update with upsert,
- inject some services or dependencies when working with rich domain model.

That set of requirements convinces me to build my own ODM layer without Spring Data like framework when working with MongoDB.
This allows me to use all advantages of MongoDB at the price of giving up take-and-use solutions.

## Saving disc space with short keys

In MongoDB keys selection is important for the size of the database. Keys are in fact stored together with the
associated documents, each document keeps its schema. If you are OK with *pa* key instead of *platform_account* you can
save 14 bytes per document. It may seem not much, but if you store 10^8 of such documents, you can save almost 1.4 GB
of disk space.

Smaller collection size means: quick backup and restore, more documents can be cached by database, smaller collection
chunks in sharding, etc.

Once I heard the story about the programmer who reduced the size of production collections by 30% just by shortening
keys. By sacrificing readability of documents, you can achieve data size reduction and performance improvement.
Every time you have to find the right balance.

## Durability

ACID transaction accustomed us to durability of write operations. If I saved the data, does it mean that it’s indeed saved.
It's true for RDBMS with ACID transactions but not for MongoDB in default configuration. It is especially important if
you work with critical data (eg. financial). There are two typical issues:

Whe you work with *replica set* and wait for write acknowledgment only from the master, you can lose data which was
not replicated to any slave node [Oplog](https://docs.mongodb.com/v3.2/core/replica-set-oplog/) (when new master is
elected, not replicated data from old master will be unrolled). To prevent data loss you can set
[`w`](https://docs.mongodb.com/manual/reference/write-concern/#wc-w) (`wValue`) connection. This option forces to wait
for acknowledge until the data will be replicated on:

- a certain number of of nodes,
- any node in each data center (with taged nodes),
- and finally, in majority of nodes which guarantees that no data will be rolled back.

Second threat for durability is [journaling](https://docs.mongodb.com/manual/core/journaling/). Write operation are
stored in a journal which is synchronized with disc every 50 ms for WiredTiger and 100 ms for MMAPv1 *stored engine*.
It means that you can lose writes from last 50 ms (or 100 ms for MMAPv1) when unclear shutdown occurs. To prevent
this you can turn off journaling (which is not recommended) or set
[`j`](https://docs.mongodb.com/manual/reference/write-concern/#wc-j) write concern option as `true`. It causes waiting
for journal sync before sending an acknowledge. This flag only applies to master node, so it makes sense to set it only when
you are not using replication. Be careful about setting this flag for all writes, instead I suggest putting
this flag only for critical operations if at all (replication with `w` option is more rational).

This is another trade-off where you have to chose between latency and durability.

## Summary

### A difficult compromise

There are more trade-offs then it was presented in this article. For example allow or not to read from slave nodes. Usually
there is more than one good solution, which can lead to conflicts between team members who appreciate different values.
For some people performance is more important than flexibility, for some it is the opposite. Everyone has the right, and
at the same time is wrong.

### If it hurts, stop doing it!

If you can't solve problems with clear model, probably you use wrong tool. Don't try to use tricky algorithm, instead of,
think about other solutions like:

- Other database
- [Polyglot persistence](http://martinfowler.com/bliki/PolyglotPersistence.html)
- [Lambda architecture](http://lambda-architecture.net)

And remember, failure is a result. Don't try to be resistant to all kind of failures, prepare for them
to detect and fix them.
