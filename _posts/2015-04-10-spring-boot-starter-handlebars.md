---
layout: post
title: Spring Boot Starter Handlebars
author: pawel.lesiecki
tags: [java, spring, open source]
---

Nowadays, [Spring Boot](http://projects.spring.io/spring-boot/) gets more and more popular as it simplifies creating standalone, production-grade Spring based
applications. It offers e.g. auto-configuration support for most of the available Java-based template engines
such as Velocity, Thymeleaf, etc. Today, we would like to publish the new Spring Boot starter that supports
auto-configuration of other popular template engine we have recently got used to —
[Handlebars](https://github.com/jknack/handlebars.java). Hopefully you might find this little piece of code useful.

Follow Spring Boot for further information about its [auto-configuration](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#using-boot-auto-configuration)
and other helpful features.

## Usage

As you can expect for any Spring Boot starter its use is pretty straightforward. Just add
**handlebars-spring-boot-starter** to dependencies of your Spring Boot application and your Handlebars templates will be
picked up automatically from `src/main/resources/templates`.

```groovy
repositories {
    mavenCentral()
}

dependencies {
    compile 'pl.allegro.tech.boot:handlebars-spring-boot-starter:0.2.0'
}
```

Naturally, you can customize configuration settings. Check
[README.md](https://github.com/allegro/handlebars-spring-boot-starter/blob/master/README.md) to find custom
configuration examples.

### Example Spring Boot application

`src/main/resources/templates/index.hbs`

```handlebars
<html>
<head>
    <title>Example</title>
</head>
<body>
    <h1>{% raw %}{{foo}}{% endraw %}</h1>
</body>
</html>
```

`src/main/java/Application.java`

```java
@Controller
@SpringBootApplication
public static class Application {

    @RequestMapping("/")
    public String index(Model model) {
        model.addAttribute("foo", "Hello Handlebars!");
        return "index";
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
Now start the application and go to http://localhost:8080.

## Where can I find it?

**handlebars-spring-boot-starter** is published under Apache License 2.0 at [Allegro Github](https://github.com/allegro)
account along with the other Allegro OpenSource projects and released to [Maven Central](http://search.maven.org/#artifactdetails|pl.allegro.tech.boot|handlebars-spring-boot-starter|0.2.0|jar).
To find out more about it, check README.md located in [handlebars-spring-boot-starter repository](https://github.com/allegro/handlebars-spring-boot-starter).
