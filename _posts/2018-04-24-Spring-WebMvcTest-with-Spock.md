---
layout: post
title: Spring &#64;WebMvcTest with Spock Framework
author: [rafal.glowinski]
tags: [tech, Spring Boot, Spock, WebMvcTest, java, testing]
---

Spring is one of the most popular JVM-targeted frameworks. One of the reasons why it has become so popular is writing tests.
Even before Spring Boot era, it was easy to run an embedded Spring application in tests. With Spring Boot, it became trivial.
JUnit and Spock are two most popular frameworks for writing tests. They both provide great support and integration with Spring,
but until recently it was not possible to leverage Spring’s `@WebMvcTest` in Spock. Why does it matter?
`@WebMvcTest` is a type of an integration test that only starts a specified slice of Spring Application and thus its
execution time is significantly lower compared to full end-to-end tests.
Things have changed with Spock 1.2. Let me show you, how to leverage this new feature.

## &#64;WebMvcTest

It is easy to write great tests (clear and concise) for most of the components in a typical Spring Application.
We create a unit test, stub interactions with dependencies and voila. Things are not so easy when it comes to REST
controllers. [Until Spring Boot 1.4](https://spring.io/blog/2016/08/30/custom-test-slice-with-spring-boot-1-4) testing
REST controllers (and all the ’magic’ done by Spring MVC) required running full application, which of course took a lot
of time. Not only startup time was the issue. Typically, one was also forced to setup entire system’s state to test certain
edge cases. This usually made tests less readable. `@WebMvcTest` is here to change that and now, supported in Spock.

## &#64;WebMvcTest with Spock

In order to use Spock’s support for `@WebMvcTest`, you have to add a dependency on Spock 1.2-SNAPSHOT, as GA version has not
been released yet ([https://github.com/spockframework/spock](https://github.com/spockframework/spock)).
For Gradle, add snapshot repository:

```groovy
repositories {
    ...

    maven {
        url "https://oss.sonatype.org/content/repositories/snapshots/"
    }
}
```

and then the dependency:

```groovy
dependencies {
    ...

    testCompile(
         ...

        "org.spockframework:spock-core:1.2-groovy-2.4-SNAPSHOT",
        "org.spockframework:spock-spring:1.2-groovy-2.4-SNAPSHOT"
    )
}
```

## Sample application

I have created a fully functional application with examples. All snippets in this article are taken from it.
The application can be found here: [https://github.com/rafal-glowinski/mvctest-spock](https://github.com/rafal-glowinski/mvctest-spock).
It exposes a REST API for users to register to some event. Registration requirements are minimal: a user has to provide a
valid email address, name, and last name. All fields are required.

Starting with Rest Controller (most imports omitted for clarity):

```java
...

import javax.validation.Valid

@RestController
@RequestMapping(path = "/registrations")
public class UserRegistrationController {

    private final RegistrationService registrationService;

    public UserRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping(consumes = APPLICATION_JSON_VALUE, produces = APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ExistingUserRegistrationDTO register(@RequestBody @Valid NewUserRegistrationDTO newUserRegistration) {
        UserRegistration userRegistration = registrationService.registerUser(
                newUserRegistration.getEmailAddress(),
                newUserRegistration.getName(), newUserRegistration.getLastName()
        );

        return asDTO(userRegistration);
    }

    private ExistingUserRegistrationDTO asDTO(UserRegistration registration) {
        return new ExistingUserRegistrationDTO(
                registration.getRegistrationId(),
                registration.getEmailAddress(),
                registration.getName(),
                registration.getLastName()
        );
    }

    ...
}
```

We tell Spring Web to validate incoming request body (`@Valid` annotation on function argument). If you are using Spring Boot 1.4.x
then this will not work without an additional post-processor in Spring Configuration:

```java
@SpringBootApplication
public class WebMvcTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebMvcTestApplication.class, args);
    }

    @Bean
    public MethodValidationPostProcessor methodValidationPostProcessor() {
        return new MethodValidationPostProcessor();
    }
}

```

Spring Boot 1.5.x is shipped with an additional [ValidationAutoConfiguration](https://github.com/spring-projects/spring-boot/blob/1.5.x/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/validation/ValidationAutoConfiguration.java) that automatically creates an instance of `MethodValidationPostProcessor`
if necessary dependencies are present on classpath.

Now, having a REST Controller ready, we need a class to deserialize JSON request into. A simple POJO with
[Jackson](https://github.com/FasterXML/jackson) and [Javax Validation API](http://beanvalidation.org/1.1/) annotations is
enough to do the trick:

```java
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import static com.rg.webmvctest.SystemConstants.EMAIL_REGEXP;

public class NewUserRegistrationDTO {

    private final String emailAddress;
    private final String name;
    private final String lastName;

    @JsonCreator
    public NewUserRegistrationDTO(
            @JsonProperty("email_address")
            String emailAddress,

            @JsonProperty("name")
            String name,

            @JsonProperty("last_name")
            String lastName
    ) {
        this.emailAddress = emailAddress;
        this.name = name;
        this.lastName = lastName;
    }

    @Pattern(regexp = EMAIL_REGEXP, message = "Invalid email address.")
    @NotNull(message = "Email must be provided.")
    public String getEmailAddress() {
        return emailAddress;
    }

    @NotNull(message = "Name must be provided.")
    @Size(min = 2, max = 50, message = "Name must be at least 2 characters and at most 50 characters long.")
    public String getName() {
        return name;
    }

    @NotNull(message = "Last name must be provided.")
    @Size(min = 2, max = 50, message = "Last name must be at least 2 characters and at most 50 characters long.")
    public String getLastName() {
        return lastName;
    }
}
```

What we have here is a POJO with 3 fields. Each of these fields has Jackson’s `@JsonProperty` annotation
and two more from Javax Validation API.

## First test

Writing `@WebMvcTest` is trivial once you have a framework that supports it. Following example is a minimal working piece of
code to create a `@WebMvcTest` in Spock (written in Groovy):

```groovy
...
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(controllers = [UserRegistrationController])         // 1
class SimplestUserRegistrationSpec extends Specification {

    @Autowired
    protected MockMvc mvc                                       // 2

    @Autowired
    RegistrationService registrationService

    @Autowired
    ObjectMapper objectMapper

    def "should pass user registration details to domain component and return 'created' status"() {
        given:
        Map request = [
                email_address : 'john.wayne@gmail.com',
                name          : 'John',
                last_name     : 'Wayne'
        ]

        and:
        registrationService.registerUser('john.wayne@gmail.com', 'John', 'Wayne') >> new UserRegistration(          // 3
                'registration-id-1',
                'john.wayne@gmail.com',
                'John',
                'Wayne'
        )

        when:
        def results = mvc.perform(post('/registrations').contentType(APPLICATION_JSON).content(toJson(request)))    // 4

        then:
        results.andExpect(status().isCreated())                 // 5

        and:
        results.andExpect(jsonPath('$.registration_id').value('registration-id-1'))        // 5
        results.andExpect(jsonPath('$.email_address').value('john.wayne@gmail.com'))
        results.andExpect(jsonPath('$.name').value('John'))
        results.andExpect(jsonPath('$.last_name').value('Wayne'))
    }

    @TestConfiguration                                          // 6
    static class StubConfig {
        DetachedMockFactory detachedMockFactory = new DetachedMockFactory()

        @Bean
        RegistrationService registrationService() {
            return detachedMockFactory.Stub(RegistrationService)
        }
    }
}
```

First, there is a `@WebMvcTest` (1) annotation on the class level. We use it to inform Spring which controllers should be
started. In this example, `UserRegistrationController` is created and mapped onto defined request paths, but to
make that happen we have to provide stubs for all dependencies of `UserRegistrationController`. We do it by
writing a custom configuration class and annotating it with `@TestConfiguration` (6).

Now, when Spring instantiates `UserRegistrationController`, it passes the stub created in `StubConfig` as a constructor
argument and we are able to perform stubbing in our tests (3).
We perform an HTTP request (4) using injected instance of `MockMvc` (2). Finally, we execute assertions on the obtained
instance of `org.springframework.test.web.servlet.ResultActions` (5). Notice that these were not typical Spock assertions,
we used ones built into Spring. Worry not, there is a way to make use of one of the strongest features of Spock:

```groovy
def "should pass user registration details to domain component and return 'created' status"() {
    given:
    Map request = [
            email_address : 'john.wayne@gmail.com',
            name          : 'John',
            last_name     : 'Wayne'
    ]

    and:
    registrationService.registerUser('john.wayne@gmail.com', 'John', 'Wayne') >> new UserRegistration(
            'registration-id-1',
            'john.wayne@gmail.com',
            'John',
            'Wayne'
    )

    when:
    def response = mvc.perform(
            post('/registrations').contentType(APPLICATION_JSON).content(toJson(request))
    ).andReturn().response  // notice the extra call to: andReturn()

    then:
    response.status == HttpStatus.CREATED.value()

    and:
    with (objectMapper.readValue(response.contentAsString, Map)) {
        it.registration_id == 'registration-id-1'
        it.email_address == 'john.wayne@gmail.com'
        it.name == 'John'
        it.last_name == 'Wayne'
    }
}
```

What is different with respect to the previous test is the extra call of `andReturn()` method on the `ResultAction` object
to obtain an HTTP response. Having a response object, we can perform any assertions we need as we would do in any Spock test.

## Testing validations

So, let us get back to validations we want to perform on incoming requests. The `NewUserRegistrationDTO` class has lots of
additional annotations that describe what values are allowed for each of the fields. When any of these fields are
recognized as having illegal values, Spring throws `org.springframework.web.bind.MethodArgumentNotValidException`.
How do we return a proper HTTP Status and error description in such situation?

First, we tell Spring that we are handling the mapping of `MethodArgumentNotValidException` onto the
`ResponseEntity` ourselves. We do this by creating a new class and annotating it with
`org.springframework.web.bind.annotation.ControllerAdvice`. Spring recognizes all such classes and they are
instantiated as if they were regular Spring Beans. Inside this class, we write a function that handles the
mapping. In my sample application, it looks like this:

```java
@ControllerAdvice
public class ExceptionsHandlerAdvice {

    private final ExceptionMapperHelper mapperHelper = new ExceptionMapperHelper();

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorsHolder> handleException(MethodArgumentNotValidException exception) {
        ErrorsHolder errors = new ErrorsHolder(mapperHelper.errorsFromBindResult(exception, exception.getBindingResult()));
        return mapperHelper.mapResponseWithoutLogging(errors, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
```

What we have here is a function annotated with `org.springframework.web.bind.annotation.ExceptionHandler`. Spring
recognizes this method and registers it as global exception handler. If `MethodArgumentNotValidException` is thrown
outside of the scope of the Rest Controller, this function is called to produce the response — an instance of `org.springframework.http.ResponseEntity`.
In this case, I have decided to return HTTP Status 422 — UNPROCESSABLE\_ENTITY with my own, custom errors structure.

Here is a more complicated example, that shows full test setup (make sure to check the sources on
[GitHub](https://github.com/rafal-glowinski/mvctest-spock/blob/master/src/test/groovy/com/rg/webmvctest/rest/UserRegistrationValidationSpec.groovy#L27)):

```groovy
@Unroll
def "should not allow to create a registration with an invalid email address: #emailAddress"() {
    given:
    Map request = [
            email_address : emailAddress,
            name          : 'John',
            last_name     : 'Wayne'
    ]

    when:
    def result = doRequest(
            post('/registrations').contentType(APPLICATION_JSON).content(toJson(request))
    ).andReturn()

    then:
    result.response.status == HttpStatus.UNPROCESSABLE_ENTITY.value()

    and:
    with (objectMapper.readValue(result.response.contentAsString, Map)) {
        it.errors[0].code == 'MethodArgumentNotValidException'
        it.errors[0].path == 'emailAddress'
        it.errors[0].userMessage == userMessage
    }

    where:
    emailAddress              || userMessage
    'john.wayne(at)gmail.com' || 'Invalid email address.'
    'abcdefg'                 || 'Invalid email address.'
    ''                        || 'Invalid email address.'
    null                      || 'Email must be provided.'
}
```

## Summary

This short article by no means covers all features of Spring’s Web Mvc Tests. There are lots of cool features available
(testing against Spring Security) and more are coming. JUnit always gets the support first but if you are a Spock
fan like me, then I hope you have found this article helpful.
