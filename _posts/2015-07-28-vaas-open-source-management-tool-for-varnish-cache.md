---
layout: post
title: Varnish as a Service goes open source
author: szymon.jasinski
tags: [varnish, web cache, python, open source]
---

We are proud to announce that today we released as open source [Varnish as a 
Service](https://stash.allegrogroup.com/projects/VAAS/repos/vaas/browse) (AKA VaaS), a [Varnish 
Cache](https://www.varnish-cache.org/) management tool. The tool has been continually developed and successfuly used for 
over a year at [Allegro](http://allegro.pl) to manage multiple farms of Varnish Cache servers. We got to the point where 
it is mature and flexible enough to share with the community as we believe there may be people out there who could 
benefit from using it. The key features that set VaaS apart from other tools are:

1. [VCL](https://www.varnish-cache.org/trac/wiki/VCL) data validated and stored in a database
2. Varnish API used to distribute VCLs in real time accross the entire caching server farm
3. API and GUI available for internal clients
4. Flexible templating system
5. VaaS is open source and available for free to anybody

### What are the benefits of using VaaS
Since we started using VaaS on a broader scale in Spring 2014, the most repetitive, time consuming, error prone and 
boring tasks related to VCL maintenance became automated and we handed them over to our internal customers. This is 
especially useful in a [SOA](https://en.wikipedia.org/wiki/Service-oriented_architecture) environment.
[Allegro](http://allegro.pl) consists of very many small services. Each service utilizes physical servers, cloud
servers or docker containers. The servers are grouped into directors (a collection of back ends). It would be a very 
difficult task to maintain a varnish VCL consisting of so many back ends that come and go so often (which is especially 
true for the cloud and docker back ends). This is why every team responsible for a service maintains their own director 
by themselves. This would not be possible without VaaS. What is worth noting, even though so many people can modify
the VCL used by Allegro's cache servers via VaaS, the VCL template is maintained by a narrow group of Varnish 
specialists who make sure that the template is well tested and does what it is intended to do before launching it in 
production environment.

### Where you can get it
You can download VaaS from [Git Hub](https://stash.allegrogroup.com/projects/VAAS/repos/vaas/browse).

### What versions of Varnish are supported
VaaS allows you to choose between Varnish 3 and Varnish 4 VCL templates.

### How to use it
VaaS documentation is available in [Read The Docs](https://rtd.allegrogroup.com/docs/vaas/en/latest/). There, you can 
find instructions on how to set VaaS up and how to use it. Since setting up VaaS can be quite a demanding task (you need 
at least one Varnish server, at least one sample backend, a database server and a VaaS application server), we have 
created a test environment that you can use to easily familiarize yourself with VaaS. We call it [VaaS in 
Vagrant](https://rtd.allegrogroup.com/docs/vaas/en/latest/quick-start/vagrant/).

### We count on your input
We believe VaaS is mature enough to safely use it in production. However, the more people use VaaS, the more bugs will 
be discovered. Therefore we encourage you to participate in VaaS development on [Git 
Hub](https://stash.allegrogroup.com/projects/VAAS/repos/vaas/browse). Similarly, if you think VaaS would benefit from a 
feature that we have not yet implemented, feel free to create a pull request. We will be more than happy to review and 
possibly include it in future VaaS releases.
