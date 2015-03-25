---
layout: post
title: Spring Boot Starter Handlebars
author: pawel.lesiecki
tags: [java, spring, open source]
---

## Spring Boot Handlebars Starter

Nowadays Spring Boot which makes easy to create standalone, production-grade Spring based applications and services gets
more and more popular. Basically, among other things, it includes auto-configuration support for most of the Java-based
template engines available today like Velocity, Thymeleaf, etc. Today we would like to add one more auto-configuration
support for another popular template engine we actually got used to —
[Handlebars](https://github.com/jknack/handlebars.java). Hopefully you might find this little piece of code useful.

Follow [Spring Boot](http://projects.spring.io/spring-boot/) for further information about its [auto-configuration](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#using-boot-auto-configuration)
and other helpful features.

### Usage

As you can expect for any Spring Boot starter the usage is pretty straightforward. Just add
``spring-boot-starter-handlebars`` to dependencies of your Spring Boot application.

```groovy
dependencies {
    compile 'pl.allegro.tech:spring-boot-starter-handlebars:0.1.0'
}
```

Then, your Handlebars templates will be picked up automatically from ``src/main/resources/templates``.

Of course — you can still customize configuration settings. In
[README.md](https://github.com/allegro/spring-boot-starter-handlebars/blob/master/README.md) you can find examples of
custom configuration.

#### Example Spring Boot app

``src/main/resources/templates/index.hbs``

```handlebars
<html>
<head>
    <title>Example</title>
</head>
<body>
    <h1>{% raw %}{{message}}{% endraw %}</h1>
</body>
</html>
```

``src/main/java/Application.java``

```java
@Controller
@SpringBootApplication
public static class Application {

    @RequestMapping("/")
    public String index(Model model) {
        model.addAttribute("message", "Hello Handlebars!");
        return "index";
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
Now start the app and go to http://localhost:8080.

### Where can I find it?

spring-boot-starter-handlebars is published under Apache License 2.0 at [Allegro Github](https://github.com/allegro)
account along with the other Allegro OpenSource projects. To find out more about the usage, read README.md in
[spring-boot-starter-handlebars repository](https://github.com/allegro/spring-boot-starter-handlebars).
