---
layout: post
title: Is overmocking bad? And if it is, then why?
author: pawel.czubachowski
tags: [overmocking, java, testing, developer, mocking, spock]
---

The first question is — what is overmocking? There are a couple of answers. When you mock something that you can leave or
even should use as it is — this is overmocking. An example of this is a POJO object. Other way to overmock your test is
to mock all the dependencies and rely only on verifying interactions with mock objects. You will see that in my
examples. Overmocking can also happen when you mock something that you don’t own like an external library.

The answer to the title question is — yes. I would say that mocking isn’t always wrong, but it has some
disadvantages. If you want to unit test your code then mocking dependencies seems like a pretty much normal thing.
Overmocking means that your code design might be wrong and you should think about redesigning it instead of
converting your unit tests to integration tests. However tests without mocks are more reliable. And for the sake of this
post let’s say that overmocking is a bad habit. What can we do about it?

Don’t mock at all. Otherwise you may encounter bugs when you launch your application because you assume that a piece of code
works the way you want it to work. Since it is a mock, you cannot be sure. Moreover, what happens when you decide to
update a version of some external library which you mocked in test? The test works just fine, since the library is mocked,
but when you release your program, it may crash. Not always but when update has some essential changes. Conclusion? The
test is useless because it did not detect a bug that should be found.

Take a look at an example. Testing a [REST](http://en.wikipedia.org/wiki/Representational_state_transfer) client is my favourite but case with repository is good too. In the code presented
below we test fetching some additional data from an external service by using a REST client. Just look at the `given` section
and count the mocks.

```groovy
def "should return transformed delivery methods for two sellers"() {
    given:
    def client = Mock(Client)
    def webTarget = Mock(WebTarget)
    def webTarget1 = Mock(WebTarget)
    def webTarget2 = Mock(WebTarget)
    def builder1 = Mock(Invocation.Builder)
    def builder2 = Mock(Invocation.Builder)
    def response1 = Mock(Response)
    def response2 = Mock(Response)
    def invocation1 = Mock(Invocation)
    def invocation2 = Mock(Invocation)
    def retrier = Mock(RestRetrier)
    def host = 'test'
    def deliveriesClient = new DeliveriesClientRest(client, "", retrier)
    def firstSeller = "123456"
    def secondSeller = "654321"

    client.target(host)                                        >> webTarget
    webTarget.path(_)                                          >> webTarget
    webTarget.queryParam("sellerId", firstSeller)              >> webTarget1
    webTarget1.queryParam(_,_)                                 >> webTarget1
    webTarget2.queryParam(_,_)                                 >> webTarget2
    webTarget.queryParam("sellerId", secondSeller)             >> webTarget2
    webTarget1.request(_)                                      >> builder1
    webTarget2.request(_)                                      >> builder2
    builder1.buildGet()                                        >> invocation1
    builder2.buildGet()                                        >> invocation2
    invocation1.submit()                                       >> ConcurrentUtils.constantFuture(response1)
    invocation2.submit()                                       >> ConcurrentUtils.constantFuture(response2)
    retrier.getWithRetry({it.getInvocation() == invocation1})  >> response1
    retrier.getWithRetry({it.getInvocation() == invocation2})  >> response2
    response1.getStatus()                                      >> 200
    response1.readEntity(AllegroDeliveryMethods.class)         >> TestDeliveryMethodsObjects.DELIVERY_METHODS_ONE_DELIVERY_METHOD
    response2.getStatus()                                      >> 200
    response2.readEntity(AllegroDeliveryMethods.class)         >> TestDeliveryMethodsObjects.DELIVERY_METHODS_ALL

    when:
    def methods = deliveriesClient.getDeliveryMethods(host, SELLER_ITEMS_TWO_SELLERS_THREE_ITEMS)

    then:
    methods.entrySet().size() == 2
    methods.containsKey(firstSeller)
    methods.containsKey(secondSeller)
    methods.get(firstSeller) == TestDeliveryMethodsObjects.DELIVERY_METHODS_ONE_DELIVERY_METHOD
    methods.get(secondSeller) == TestDeliveryMethodsObjects.DELIVERY_METHODS_ALL
}
```

This is one crazy mocked test and a good example of mocking something that you don’t own. It’s very hard to read. It does
its job, unit tests functionality but it isn’t that reliable. And if you look at mocked things you can see that the
class is probably not so complicated. The REST client setup is the biggest part of the test. Solution for this case?
Don’t mock webtargets and use a stubbed service. [Wiremock](http://wiremock.org) can help you with that. In this
way you can test the whole class, including the REST communication. If it’s possible you can start your REST service before
test and the test and shut it down afterwards. That would be great.

Here is another example. It’s a very similar test. Again, we use a REST client to fetch data from an external REST service.
This test is much better. REST client is not mocked and Wiremock is used to stub REST service.

```groovy
def cartClient = new CartClientRest(ClientBuilder.newClient(), "8089", new RestRetrier())

@Unroll
def "should return information about cart with id #id"() {
    given:
    def outputForFirstCart = new JsonBuilder([
                                             id: "testId1",
                                             cartItems: [[
                                                     id: 111,
                                                     quantity: 1,
                                                     price: 444
                                             ]],
                                             endedItems: []
                                     ]).toPrettyString()
    def outputForSecondCart = new JsonBuilder([
                                              id: "testId2",
                                              cartItems: [[
                                                      id: 222,
                                                      quantity: 2,
                                                      price: 555
                                              ], [
                                                      id: 333,
                                                      quantity: 4,
                                                      price: 666
                                              ]],
                                              endedItems: [[
                                                      id: 111,
                                                      quantity:1,
                                                      price: 222
                                              ]]
                                      ]).toPrettyString()

    when:
    stubFor(get(urlEqualTo("/carts/" + cartId))
        .willReturn(aResponse()
            .withStatus(200)
            .withHeader("Content-Type", "application/json")
            .withBody(output)))

    def cart = cartClient.get("http://localhost", cartId)

    then:
    cart.id                    == cartId
    cart.cartItems[0].id       == id
    cart.cartItems[0].quantity == quantity
    cart.cartItems[0].price    == price
    cart.cartItems.size()      == cartItemsSize
    cart.endedItems.size()     == endedItemsSize

    where:
    output              || cartId    | quantity | id    | price | cartItemsSize | endedItemsSize
    outputForFirstCart  || "testId1" | 1        | "111" | 444   | 1             | 0
    outputForSecondCart || "testId2" | 2        | "222" | 555   | 2             | 1
}
```

And the last example. This is an example of both operations on a repository and a REST client. We put an address in
 the repository, then remove it using a REST client.

```groovy
@ContextConfiguration(classes = Runner.class, loader = SpringApplicationContextLoader.class)
@WebAppConfiguration
@IntegrationTest
@ActiveProfiles(profiles = ['integration'])
class AddressesClientTest extends Specification {
    @Autowired
    AddressesDao addressesDao

    @ClassRule
    @Shared
    def embeddedCassandra = new EmbeddedCassandra("cassandra/schema/schema.cql")

    static def addressesClient = new AddressesClientImpl(new RestTemplate(), "http://localhost:8080")

    def setup() {
        embeddedCassandra.executeScript("cassandra/schema/truncate_tables.cql");
    }

    def "should remove address"() {
        given:
        addressesDao.save(AddressDbFixture.simple())

        when:
        addressesClient.remove(buildId(AddressDbFixture.USER_ID, AddressDbFixture.ADDRESS_ID))

        then:
        def address = addressesDao.get(AddressFixture.USER_ID, AddressFixture.ADDRESS_ID)

        !address.visible
    }
}
```

This test is more reliable because it uses embedded Cassandra and a client that doesn’t mock anything. You can think of
it like an integration test, but for me it’s just a test that does its job. In this example we start the service before every
test and shut it down afterwards. Whole communication is working as in a real environment so you can find your bugs much easier
and much faster.

So what should you do with overmocking? In my opinion it’s a sign that you should take a closer look at your
application design because something might be going in the wrong direction. Don’t mock anything. Use embedded version of
anything you need and stub REST services. Don’t mock REST clients. Everything you need, should start and shut
down inside your tests.

Several tools we use for stubbing:

* For embedded Mongo we use [Fongo](https://github.com/fakemongo/fongo).

* For embedded Cassandra we use [Achilles](https://github.com/doanduyhai/Achilles).

* For stubbing REST service we use [Wiremock](http://wiremock.org).

* For ActiveMq we use [embedded broker](http://activemq.apache.org/how-do-i-embed-a-broker-inside-a-connection.html).
