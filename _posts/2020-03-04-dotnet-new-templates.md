---
layout: post
title: Using dotnet new templates to streamline microservices development
author: [szymon.adach]
tags: [tech, dotnet, template, microservices]
---

## What's that and why would I want to use it?
When working on a project consisting of numerous microservices, you often find that each service share a part of 
&ldquo;common&rdquo; code. This becomes a burdensome copy-paste activity when you have to add one more microservices. 
There is a number of straightforward and not-so-clean solutions to this problem (i.e. copying from a microservice of 
a colleague who read &ldquo;Clean Code&rdquo; and/zor maintains an exemplary service). In this post, however, I'd like 
to explore another option suitable for dotnet core developers: `dotnet new` templates.

When you type `dotnet new` in your terminal, you get a rather large list of predefined solutions, webapi, mvc or console 
being the most noted. But did you know you can use it to create exemplary project for your teammates &mdash; in the company 
or for your open source project? Lo and behold, there's a simple solution that's shipped with the SDK: custom dotnet new 
templates to the rescue!  

### Factor out common code
You can easily standarize a lot of boilerplate code with a custom `dotnet new` template. Let's take a look at standard 
WebAPI project files: `Startup.cs` and `Program.cs`. The second one usally stays untouched once someone 
needs to configure HostBuilder. So why don't we factor out the common code from the former: 
* loading configuration, 
* setting up service to service auth, 
* serialization settings 
* configuring logging
* health checks, 
* common libraries mostly used (e.g. Swagger),
* HttpClientFactory or any factories and bootstrappers you may want.


All configuration comes out of the box, so having a template makes it easy and convenient to create a service that 
complies to all standards and policies project may have. It also suggests good behaviour. Comments in this code can help 
the new dev onboard easier and explain something he might otherwise ask or not, as well as reducing cognitive overhead 
for *all* developers by helping them with the template.

### Enforce consistent code style and solution structure 
Moreover, custom `dotnet new` template might be also a good way to nudge the team to keep your services' solutions 
structured in the same way across all repos. That may come in handy by reducing the cognitive overhead when you'll find 
yourself looking for a bug in your mate's service's code. Other than that, onboarding a new teammate may be a bit easier 
if he has a simple microservice MVP that he can dive into to see an example of your development standards. 
Adding unit and integration tests to the template is really worth considering. Such a template after some discussions 
and development would become a source of truth for the project's code style.

### Set rules for dependency and tooling management
Instituting common tooling is way easier now with the `dotnet tool` command. You can store tools' desired versions 
in the `dotnet-tools.json` and include it in the template. Same stands for referenced packages &mdash; you can settle 
for a specific version of given nuget and enforce it by shipping it locked in your dependency manager 
(hello, [paket](https://fsprojects.github.io/Paket/index.html)!) with your template.  
You can also deliver your template with build or deployment scripts for your microservice as well as a minimal dockerfile
 &mdash; just enough to build it, test it and deploy it somewhere.

## Nuts-and-bolts
When it comes to creating a `dotnet new` template there aren't many traps or catches &mdash; the process is rather 
straightforward and well documented. Just create a new dotnet project, add some config files and voila! The most 
important files are `template.json` and `dotnetcli-host.json`. Using the first one can describe his template via 
some metadata and specify parameters. For example, you can create C# project called *ServiceTemplate* and use this 
config to replace this string everywhere (including filenames) with a flag passed from the CLI:
```json
{
    "$schema": "http://json.schemastore.org/template",
    "author": "Szymek Adach",
    "classifications": [ "WebApi", "Microservice", "C#8" ],
    "identity": "FinAi.ServiceTemplate",
    "name": "FinAi C# microservice",
    "shortName": "csharp-service",
    "tags": {
      "language": "C#",
      "type": "project"
    },
    "symbols":{
        "serviceName": {
            "type": "parameter",
            "datatype": "text",
            "replaces": "ServiceTemplate",
            "isRequired": true,
            "description": "Name of the service",
            "FileRename": "ServiceTemplate"
        },
        "deploymentScriptServiceName": {
            "type": "parameter",
            "datatype": "text",
            "replaces": "FinAiTemplateServiceName",
            "isRequired": true,
            "description": "Name of the service used in the deploy.ps1 as well as name of the docker image"
        }
    }
  }
```
`template.json` schema has a really in-depth docs that can be found on 
[GitHub](https://github.com/dotnet/templating/wiki/Reference-for-template.json).  
`dotnetcli-host.json` allows you to specify a shortcut for your command options (the ones generated by the template 
engine can sometimes be confusing).
```json
{
    "$schema": "http://json.schemastore.org/dotnetcli.host",
    "symbolInfo": {
      "serviceName": {
        "longName": "service-name",
        "shortName": "sn"
      },
      "deploymentScriptServiceName": {
        "longName": "deployment-script-service-name",
        "shortName": "dssn"
      }
    }
}
```
Another useful feature of dotnet templates is the ability of testing them. You can examine the execution of arbitrary 
code ran by the template, check for existence of generated files and directories or even make a request to a running 
service and assert the response code.  
After you test your project, it can be installed from a directory or a nuget via `dotnet new -i` command.

## Outro 
So, how do *we* use them at Allegro? Apart from the template configuration files listed above, we created a solution 
(well, actually, two solutions for two service flavours: C# and F#). We used the text replacement feature in dockerfiles, 
both build and deployment scripts (and yaml files), as well as in the namespaces, projects or solution names. 
Now we're also adding an `.editorconfig` file in order to have a versioned IDE settings alongside the tempalate.

![Template layout](/img/articles/2020-03-04-dotnet-new-templates/template_schema.png)

Although they aren't a silver bullet, I find `dotnet new` custom templates very useful in day-to-day work. 
[Read the docs](https://docs.microsoft.com/en-us/dotnet/core/tools/custom-templates) and try them yourself. It doesn't 
cost much and benefits are huge.