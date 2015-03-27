---
layout: post
title: Spring Boot Starter Handlebars
author: pawel.lesiecki
tags: [java, spring, open source]
---

Nowadays, Spring Boot that makes easy to create standalone, production-grade Spring based applications and services gets
more and more popular. It offers e.g. auto-configuration support for most of the available Java-based template engines
such as Velocity, Thymeleaf, etc. Today, we would like to add a solution that supports auto-configuration of other
popular template engine we have recently got used to — [Handlebars](https://github.com/jknack/handlebars.java).
Hopefully you might find this little piece of code useful.

Follow [Spring Boot](http://projects.spring.io/spring-boot/) for further information about its [auto-configuration](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#using-boot-auto-configuration)
and other helpful features.

### Use

As you can expect for any Spring Boot starter its use is pretty straightforward. Just add
**spring-boot-starter-handlebars** to dependencies of your Spring Boot application and your Handlebars templates will be
picked up automatically from ``src/main/resources/templates``.

```groovy
dependencies {
    compile 'pl.allegro.tech:spring-boot-starter-handlebars:0.1.0'
}
```

Naturally, you can customize configuration settings. Check
[README.md](https://github.com/allegro/spring-boot-starter-handlebars/blob/master/README.md) to find custom
configuration examples.

#### Example Spring Boot application

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
Now start the application and go to http://localhost:8080.

### Where can I find it?

**spring-boot-starter-handlebars** is published under Apache License 2.0 at [Allegro Github](https://github.com/allegro)
account along with the other Allegro OpenSource projects. To find out more about it, check README.md located in
[spring-boot-starter-handlebars repository](https://github.com/allegro/spring-boot-starter-handlebars).
