---
layout: post
title: Is overmocking bad? And if it is, then why?
author: pawel.czubachowski
tags: [java, testing, developer, mocking, spock]
---

First question is what is overmocking? There are few answers. When you mock something that you can leave or even should leave unmocked — this is overmocking. Or when your classes are so big that tests are full of mocks then that is overmocking too. You will see that in my examples. Another example is when you mock something that you do not own, that is overmocking too. 

The answer for title question is — it depends. I would even say no, but it has some disadvantages. If you want to unit test your code then mocking dependecies is pretty much normal thing. Getting more and more mocks does not mean that overmocking is bad, it means that your code architecture is probably bad and you should think about it instead of unmocking things and change your unit tests to integration tests. But there are cases where answer for title question should be yes because tests without mocks are more reliable. And for the sake of this post lets say that overmocking is bad habbit, what we can do about it?

First, we can forget about unit tests and integration tests. Lets say that there are just tests. And it makes a big difference because you think more about what functionality you want test instead of how to test it or mock dependencies. And there is one more thing, if you mock your own classes then it is probably ok. But you should avoid mocking things that you do not own, it may cause problems. 

Take a look at some example. Rest client is my favourite but something with repository is good case too. 

```
def "should return transformed delivery methods for two sellers"() {
        given:
        client.target(host)                                         >> webTarget
        webTarget.path(_)                                           >> webTarget
        webTarget.queryParam("sellerId", SELLER_1)                  >> webTarget1
        webTarget1.queryParam(_,_)                                  >> webTarget1
        webTarget2.queryParam(_,_)                                  >> webTarget2
        webTarget.queryParam("sellerId", SELLER_2)                  >> webTarget2
        webTarget1.request(_)                                       >> builder1
        webTarget2.request(_)                                       >> builder2
        builder1.buildGet()                                         >> invocation1
        builder2.buildGet()                                         >> invocation2
        invocation1.submit()                                        >> ConcurrentUtils.constantFuture(response1)
        invocation2.submit()                                        >> ConcurrentUtils.constantFuture(response2)
        retrier.getWithRetry({it.getInvocation() == invocation1})   >> response1
        retrier.getWithRetry({it.getInvocation() == invocation2})   >> response2
        response1.getStatus()                                       >> 200
        response1.readEntity(AllegroDeliveryMethods.class)          >> TestDeliveryMethodsObjects.ALLEGRO_DELIVERY_METHODS_ONE_DELIVERY_METHOD
        response2.getStatus()                                       >> 200
        response2.readEntity(AllegroDeliveryMethods.class)          >> TestDeliveryMethodsObjects.ALLEGRO_DELIVERY_METHODS_ALL

        when:
        def methods = deliveriesClient.getDeliveryMethods(host, SELLER_ITEMS_TWO_SELLERS_THREE_ITEMS)

        then:
        methods.entrySet().size() == 2
        methods.containsKey(SELLER_1)
        methods.containsKey(SELLER_2)
        methods.get(SELLER_1) == TestDeliveryMethodsObjects.DELIVERY_METHODS_ONE_DELIVERY_METHOD
        methods.get(SELLER_2) == TestDeliveryMethodsObjects.DELIVERY_METHODS_ALL
    }


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

    DeliveriesClient deliveriesClient = new DeliveriesClientRest(client, "", retrier)
```

This is one crazy mocked test. Yes, my team did it. It is very hard to read. It does its job, unit tests functionality but it is not that reliable. And if you look at mocked things you will see that class is probably not so complicated. Most of the things are for rest client. This is good example of mocking something that you could leave unmocked or even should to make your test more reliable. Solution for this case? Unmock webtarget and use it on mocked service. That way you will test whole your class including rest communication. If it is possible you can make your service start before test and shutdown after and that would be great. 

There is another example.

```
CartClient cartClient = new CartClientRest(ClientBuilder.newClient(), "8089", new RestRetrier())
@Unroll
def "should return infromation about cart with id #id"() {
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
    output         || cartId    | quantity | id    | price | cartItemsSize | endedItemsSize
    CARTS_OUTPUT_1 || "testId1" | 1        | "111" | 444   | 1             | 0
    CARTS_OUTPUT_2 || "testId2" | 2        | "222" | 555   | 2             | 1
}
```

This is much better, client is not mocked. And the last one. You can see that there service is mocked but it is quite good test. Code used to configure mocks is 
very short. 

```
def "should remove address"() {
    given:
    addressesDao.save(AddressDbFixture.simple())

    when:
    addressesClient.remove(buildId(AddressDbFixture.USER_ID, AddressDbFixture.ADDRESS_ID))

    then:
    def address = addressesDao.get(AddressFixture.USER_ID, AddressFixture.ADDRESS_ID)

    !address.visible
}

@Autowired
AddressesDao addressesDao

static def addressesClient = new AddressesClientImpl(new RestTemplate(), SERVICE_ADDRESS)
```

It extends this class:

```
@ContextConfiguration(loader = SpringApplicationContextLoader.class)
@WebAppConfiguration
@IntegrationTest
@ActiveProfiles(profiles = ['integration'])
abstract class IntegrationSpecification extends Specification {
    public static final String SERVICE_ADDRESS = "http://localhost:8080"

    @ClassRule
    @Shared
    EmbeddedCassandra embeddedCassandra = new EmbeddedCassandra("cassandra/schema/schema.cql")

    def setup() {
        embeddedCassandra.executeScript("cassandra/schema/truncate_tables.cql");
    }
}
```

This test is more reliable because it uses embedded cassandra and client that does not mock anything. You can still mock service if you want/have to but it is still good. You can think of it like integration test, but for me it is just test that does its job. In this example we start service before every test and shutdown after. Whole communication is working as in real environment so you can find your bugs much easier and much faster.

So what should you do with overmocking? In my opinion it is a sign that you should take a closer look to your application architecture because something might be going in the wrong direction. If you have clients then try to unmock them. If you have any storage then try to use embedded version of it. If you have submodule service then start it before test and shutdown after. Or leave it as is if you want but if you choose that way you loose some reliability. And this is big disadvantages because you should trust your tests and it should give as much confidence as possible that your code will not break on production in some cases that your test does not cover. What you should not do is using anything from the outside for example some repository only for your tests or version of service only for your tests. That is bad practice. Everything you that need, should start and shutdown inside your tests. 
