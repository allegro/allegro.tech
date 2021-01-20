---
layout: post
title: How to manage Spring Boot services configuration on GCP
author: karol.kuc
tags: [java, cloud, gcp, spring-boot]
---

Configuration management is one of the key challenges you have to face when you decide to build an application as a distributed system based on microservices
deployed to the Cloud. There are multiple ways of addressing different aspects of this problem, using several tools such as [Spring Cloud Config Server](https://cloud.spring.io/spring-cloud-config/reference/html/) 
or [Hashicorp Consul](https://cloud.spring.io/spring-cloud-consul/reference/html/). However, this article will focus on the tools that Google Cloud Platform offers
out of the box. The approaches mentioned should be seen as complementary rather than mutually exclusive.


## What is GCP Runtime Configurator?
The [Runtime Configurator](https://cloud.google.com/deployment-manager/runtime-configurator/) available for services deployed to Google Cloud Platform is a handy tool designed to solve multiple problems
related to application state management as well as application configuration management. In this article, I will dig into the latter. The Runtime Configurator features include:
* configuring services dynamically,
* communicating changes in application state between services,
* notifying about changes to application data ([Watching variable state changes](https://cloud.google.com/deployment-manager/runtime-configurator/watching-a-variable) 
and creating [Waiter resources](https://cloud.google.com/deployment-manager/runtime-configurator/creating-a-waiter)
are beyond the scope of this article, please consult the corresponding documentation),
* sharing information between multiple tiers of services.

It can be used via the [gcloud console utility](https://cloud.google.com/sdk/gcloud/), the Deployment Manager or as a Standalone API and lets you centralize
configuration and reuse it between different GCP resources such as 
Google Compute Engine, Google App Engine, Google Kubernetes Engine or Google Cloud Functions.

### State management: why should I use Runtime Configurator?

The official [GCP documentation](https://cloud.google.com/deployment-manager/runtime-configurator/) provides an example as follows:

"For example, imagine a scenario where you have a cluster of nodes that run 
a startup procedure. During startup, you can configure your nodes to report their status 
to the Runtime Configurator, and then have another application query the Runtime Configurator and run specific tasks based on the status of the nodes.
 
The Runtime Configurator also offers a Watcher service and a Waiter service. The Watcher service watches a specific key pair 
and returns when the value of the key pair changes, while the Waiter service waits for a specific end condition and returns a response once that end condition has been met."

### Managing configuration: basic terms

The Runtime Configurator is built on top of the idea of a config resource. It is an abstraction that can be seen
as a hierarchical list of configuration variables, which may separate the configuration variables 
environment-wise (prod, dev, test) and/or tier-wise (frontend, backend). 
A configuration is local to a GCP project so there will be no interference between services managed by a GCP account (provided you deploy services as separate projects).
Variables are simple key-value pairs that can be referenced in your Spring Boot service config files as environment variables.
The variable key has the following format, and is local to a config ID (the config resource unique name), which, as mentioned, is on its own
local to a project id:
```
projects/[project_id]/configs/[CONFIG_ID]/variables/[VARIABLE_NAME]
```
This is how you could store the database username for a cart service on the dev environment:
```
projects/cart-service/configs/cart-db_dev/variables/DBUSER
```
Variable keys can also have multiple levels:
```
projects/cart-service/configs/cart-db_dev/variables/connection-data/credentials/DBUSER
```
It is of vital importance that the config name and the profile (environment) name are separated by an underscore, otherwise they will not be
interpreted correctly by Spring Boot on startup of your service.

Also mind the fact that only leaf keys in the hierarchy can have values assigned so you cannot assign a value to:
```
projects/cart-service/configs/cart-db_dev/variables/connection-data
```

## Creating and populating a config resource
### Using gcloud
The simplest way to create and populate a config resource is to:
* sign-in to an App Engine console account,
* select a project you want to create the configuration for from the dropdown on the top-bar,
* run a Cloud Shell session by clicking the ">_" icon in the top-right corner.

Then run the following command (if you do it for the first time follow the API enabling instructions prompted on the command line):
```
gcloud beta runtime-config configs create cart-db_dev
```
Runtime configurator offers a simple API to get, set and watch variable values, e.g.:
```
gcloud beta runtime-config configs variables set DBUSER  "cart-admin"  --config-name cart-db_dev
```
```
gcloud beta runtime-config configs variables get-value DBUSER --config-name cart-db_dev
```
as well as to list variables.
```
gcloud beta runtime-config configs variables list --config-name cart-db_dev
```

In the next paragraphs, you can check alternative methods for the procedure described above.

### Using the API
```
POST
https://runtimeconfig.googleapis.com/v1beta1/projects/cart-service/configs/
{
   "name": "projects/cart-service/configs/cart-db_dev"
}

```

There is an analogous API to DELETE the config, list the variables and set or access variable values.
You can look up the details in the [API specification](https://cloud.google.com/deployment-manager/runtime-configurator/reference/rest/).
### Using the Deployment Manager
You have to specify the config type as:
```
runtimeconfig.v1beta1.config
```
by defining the properties, mind that the config name has to be provided twice.

```
- name: cart-db_dev
  type: runtimeconfig.v1beta1.config
  properties:
    config: cart-db_dev
```
For analogous instructions to delete the config, list the variables and set or access variable values,
consult [this link](https://cloud.google.com/deployment-manager/runtime-configurator/create-and-delete-runtimeconfig-resources) and [this](https://cloud.google.com/deployment-manager/runtime-configurator/set-and-get-variables) GCP documentation.

This is pretty much it from the GCP perspective, as you can see the API of the runtime-configuration tool is straightforward and intuitive.
Let's now focus on how to set up a Spring Boot app to use the configuration we have created.
## Accessing GCP config from Spring Boot
Set the active application profile in the main appengine/app.yaml file so that Spring Boot can pick up the right config for a given environment. 
Remember that the profile name must be part of the config ID you created on GCP in the following form:
```
  config-name_profile-name eg cart-db_dev
```
You just need to define an environment variable with the right profile.
An example src/main/appengine/app.yaml
```
runtime: java
env: flex
runtime_config:
    dk: openjdk8
**********************************                                 
env_variables:                      
    SPRING_PROFILES_ACTIVE: "dev"      
**********************************
handlers:
    - url: /.*
    script: ''
manual_scaling:
    instances: 1
resources:
    cpu: 2
    memory_gb: 2
    disk_size_gb: 10
liveness_check:
    check_interval_sec: 5
    timeout_sec: 4
    failure_threshold: 1
    success_threshold: 1
    initial_delay_sec: 500
Readiness_check:
    check_interval_sec: 5
    timeout_sec: 4
    failure_threshold: 1
    success_threshold: 1
    app_start_timeout_sec: 1000

```
Then you have to create a following config file src/main/resources/bootstrap-dev.yml so that Spring Boot
GCP integration picks up the config before other properties are read:
```
spring:
 cloud:
   gcp:
     config:
       enabled: true
       name: cart-db
       profile: dev
```
In the build.gradle file you will need the following plugin and dependencies: 
```
buildscript { 
    ext {
        ...
        springBootVersion = '2.1.2.RELEASE'
        ...
    }
    dependencies {
        ...
        classpath group: 'com.google.cloud.tools', name: 'appengine-gradle-plugin', version: '2.0.1' 
    }
        ...
}
dependencies {
    apply plugin: 'com.google.cloud.tools.appengine'
    appengine.deploy.projectId = 'GCLOUD_CONFIG'
    appengine.deploy.version = 'GCLOUD_CONFIG'
    implementation group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starters', version: '1.1.1.RELEASE'
    implementation group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-config', version: '1.1.0.RC2'
}
dependencyManagement { 
    imports { 
        ... 
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
        ...
    }    
}
```
And then use the DBUSER config variable in the corresponding src/main/application-dev.yml:
```
spring:
  data:
    mongodb:
      ...
      username: ${DBUSER}
      ...
```

Now the configuration provided should be picked up upon application startup. If you update the values 
while the application is running, you must either refresh the config via [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html#production-ready) or restart the service.
## Further readings
For further information about Spring Cloud GCP Runtime Config, consult this [article](https://spring.io/blog/2018/09/03/bootiful-gcp-runtime-configuration-with-spring-cloud-gcp-runtime-config-5-8)
which is the fifth article in the 8-part series about [Spring Boot on GCP](https://spring.io/projects/spring-cloud-gcp).
You might also enjoy this article on [GCP config best practices](https://medium.com/google-cloud/google-cloud-functions-best-practices-using-runtime-configurator-to-manage-config-variables-8b18e77bd6dc)
which also looks into quirks and features of using Runtime Configurator with Google Cloud Functions none of which are covered in this article.
## Miscellaneous
### Limitations, quotas, access control
For quotas and limitations please consult the [docs](https://cloud.google.com/deployment-manager/quotas#runtime_configurator). Currently, it's 4MB data per project and corresponding query per minute limits for specific API queries.
[Runtime Configurator Access Control](https://cloud.google.com/deployment-manager/runtime-configurator/access-control) via IAM ([Identity Access Management](https://cloud.google.com/iam/docs/overview)) roles and permissions of a Service Account are not in the scope of this article. 
### Important
You must take into consideration that the beta Runtime Configuration tool is in a pre-release state and might undergo breaking API changes and/or have limited support.

### Summary
As I have already mentioned, GCP Runtime Configurator 
should not be seen as an alternative to tools such as Spring Cloud Config Server 
or Hashicorp Consul. You can live without one or the other
but you can also use both of them. 
An example of such separation of concerns might be limiting the use of GCP RC to configuration shared between different GCP areas eg. 
Cloud Functions and App Engine. You could then let an independent config server, running in an App Engine container, manage the configuration 
which is used exclusively by services also running on App Engine. It is also relevant that any
piece of infrastructure that you deploy on your own as part of the system, such as a config server or a discovery server, is then yours to monitor and maintain,
which does not apply to tools offered by Google Cloud Platform out of the box. 
