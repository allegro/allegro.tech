---
layout: post
title: We were on re:inventure (AWS conference summary)
author: mateusz.gajewski
tags: [cloud, aws, conference]
---

Two weeks ago we attended [AWS](http://aws.amazon.com/) [re:invent](https://reinvent.awsevents.com/) conference in Las Vegas.
Our company was represented by Wojciech Lesicki (Product Owner of our cloud infrastructure), Sebastian Pietrowski (Head of Architecture and Operations) and Mateusz Gajewski (Solutions Architect).
This post summarises new product announcements made during the keynotes, our impressions on breakout sessions, bootcamps and conference itself.

## Conference itself

AWS re:invent conference gathered more than 13000 attendees from over 50 countries, 400 speakers, lasted 5 days with 2 days of bootcamps and 3 days of sessions.
The venue located at Sands Expo of Venetian hotel, Las Vegas, could barely handle this huge crowd of professionals from different industries.
Over 200 sessions and bootcamps covered topics ranging from architecting in the cloud, big data, business applications, developer tools, enterprise adoption, games & mobile development,
[IoT](http://en.wikipedia.org/wiki/Internet_of_Things) to performance and security.

## Keynotes

During the third and fourth day of the conference two keynotes were carried out and a number of new products and features were introduced.
During the first keynote, Andy Jassy (Senior Vice President of Web Services) presented new RDS service: [Amazon Aurora](http://aws.amazon.com/aurora ),
three application lifecycle management tools: [CodeDeploy](http://aws.amazon.com/codedeploy),
[CodePipeline](http://aws.amazon.com/codepipeline) and [CodeCommit](http://aws.amazon.com/codecommit)
and three services related to security and governance: [Key Management Service](http://aws.amazon.com/kms), [Config](http://aws.amazon.com/config)
and [Service Catalog](http://aws.amazon.com/servicecatalog).
During second keynote Dr. Werner Vogels (Chief Technology Officer Amazon.com) presented new services: [Container Service](https://aws.amazon.com/ecs)
and [Lambda](https://aws.amazon.com/lambda/), announced future availability of a new [EC2](https://aws.amazon.com/ec2) compute instance type (C4) and
new features of existing services like [EBS](https://aws.amazon.com/ebs/), [S3](https://aws.amazon.com/s3/) and [DynamoDB](https://aws.amazon.com/dynamodb/).

Some impressive facts about AWS position as IT vendor were also disclosed by AWS SVP.
YoY growth of AWS exceeded 40% with over 120% YoY data transfer growth of S3 service and close to 100% YoY growth of EC2 service.

Keynotes are available here:

* [Day 1 - Andy Jassy (SVP Amazon Web Services)](https://www.youtube.com/embed/wApMDQFvNio?rel=0;hd=1;autoplay=1)
* [Day 2 - Dr. Werner Vogels (CTO Amazon)](https://www.youtube.com/embed/ZPbM2qGfH3s?rel=0;hd=1;autoplay=1)

## New products & features

### Amazon Aurora

[Amazon Aurora RDS](http://aws.amazon.com/aurora) is a MySQL 5.6 compatible, fully managed, relational database engine.
It provides unprecedented performance (up to 5x more than largest RDS MySQL instance) and scalability.
How fast exactly is it? Aurora is advertised to handle up to 6M inserts per minute and 30M selects per minute.
Additionally it's highly available and durable due to the fact that it's distributed among 3 availability zones with 6 copies of data and continuously being backed up to S3.
Aurora can also scale up to 15 replicas in 3 availability zones that can handle 64TB of data.
All these features are provided and managed by AWS so routine management tasks like patching, backups, failure detection & recovery as well as repairs are handled automatically.

We were impressed with the feature set, scalability, availability and security characteristics of Aurora RDS.

### CodeDeploy

[CodeDeploy](http://aws.amazon.com/codedeploy) is a new service for developers that simplifies and automates code deployments to EC2 instances with a number of interesting features.
Internally it was used at Amazon as a shared infrastructure tool called [Apollo](http://www.quora.com/What-is-Amazon-Apollo) for a couple of years.
Its job was to reliably perform staging, code deployments, rollbacks and change tracking.
Amazon shared that over the last year Apollo was used internally to perform over 50M deployments with an average of more than one deployment each second.
Among the most noticeable features worth mentioning are that it's language and platform agnostic, it provides centralised control over launching and monitoring deployments,
tracking of deployments' history and easy integration with existing continuous integration and delivery tools.

If you have been trying to do continuous delivery - deploying code after successful integration - that's a tool, we all have dreamed about for a loooong time!

### CodePipeline

[CodePipeline](http://aws.amazon.com/codepipeline) is a new tool for developers that allows automating development pipeline - from the commit through build
and continuous integration to deployment through CodeDeploy. It can also be easily integrated with existing code repositories, build and test tools.

We feel that CodePipeline is a last missing piece of development "glue" that will tie up all AWS services together.

### CodeCommit

[CodeCommit](http://aws.amazon.com/codecommit) is... well, as you can conclude from its name... a managed enterprise code repository built on top of Git and AWS infrastructure.
Like any other service it's highly secure, available and integrates well with other services.

It's also worth mentioning that it can handle arbitrarily big repositories and files - no limits at all. Nice!

### Key Management Service (KMS)

[KMS](http://aws.amazon.com/kms/) provides centralised encryption key management on top of [CloudHSM](http://aws.amazon.com/cloudhsm/) (Hardware Security Modules).
It's integrated with [S3](http://aws.amazon.com/s3/), [EBS](http://aws.amazon.com/ebs/) and [Redshift](http://aws.amazon.com/redshift]) services so you can easily encrypt your stored data without revealing keys at all
(you can't even retrieve them - they are stored and used only inside AWS infrastructure) and audit key usage.
KMS allows also you to implement custom usage and key rotation policies. We see this service as a crucial one for security and compliance requirements.

We are very pleased that it was made available, as security of our users' data is our top priority.

### Config

In distributed architectures built on top of cloud infrastructure it's extremely hard to track resource usage, audit changes and visualise what resources actually are in use.
This is where [AWS Config](http://aws.amazon.com/config) comes into play.
Basically it's AWS resource inventory that brings the possibility to view entire infrastructure as list of resources with configuration details, relations and history of changes.
Thus it can be used in security, compliance, risk assessment, incident, change and problem management processes.

It's always a good thing to see entropy going down in a cloud infrastructure :)

### Service Catalog

[Service Catalog](http://aws.amazon.com/servicecatalog/) is a service that manages portfolio of products built on top of AWS infrastructure that users can request through personalised portal.
Product itself is a set of AWS resources (stack) described by [CloudFormation](https://aws.amazon.com/cloudformation/) template.
Service manages multiple portfolios and multiple versions of each product within given portfolio.
Service Catalog provides self-service, access control and auditing capabilities through [CloudTrail](http://aws.amazon.com/cloudtrail/).

Overall it's a nice addition to AWS ecosystem of tools.

### Container Service

[Container Service](http://aws.amazon.com/ecs/) wasn't huge surprise for us during the keynote.
During the last couple of month [Docker](http://docker.io) ecosystem has gained it's momentum and it was really pleasant to see that AWS will provide support for running Docker containers on top of EC2 infrastructure.
What's really cool about the service itself that it's directly integrated with [Docker Hub](https://hub.docker.com), private and public repositories.
Massive number of containers can be launched in seconds and you can provide your own scheduler to efficiently use resources across the underlying cluster of EC2 instances.

And guess what? It's completely free - you pay only for computing power (EC2 instances), not for a usage of container service
(and by using containers you actually minimise number of EC2 instances because multiple containers can be run on single EC2 instance).

### Lambda

[Functional](http://en.wikipedia.org/wiki/Functional_programming) and [reactive](http://en.wikipedia.org/wiki/Reactive_programming) programming are hot topics of a last couple of years.
AWS [Lambda](http://aws.amazon.com/lambda/) is a service that allows you to build reactive, event-based applications that responds to change in state quickly.
As for now events can be generated by S3, Kinesis and DynamoDB services. Every event coming from such services triggers an action that is handled using user defined function written in Node.js (Javascript).
Service itself is also responsible for resource isolation (every "Lambda" function runs in resources constrained environment) and autoscaling and you only pay for time spent on handling event (with 100ms precision).

It seems that the future will be reactive :)

### S3 Event Notifications

This feature seems to be small and irrelevant but it can greatly simplify your application architecture. All events can be pushed to Lambda service, SQS queue or SNS topic giving you enough flexibility when processing data stored on S3. Integration with Kinesis is planned to be available soon.

This neat feature is completely free and can be configured on a bucket level.

### DynamoDB Streams

[DynamoDB Streams](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) gives developer the possibility to retrieve strictly ordered log of changes made at the table level. They are stored for 24 hours and will be available despite table drop. Log can be consumed 2 times faster than writes are made to the table.

We are looking forward to see existing AWS services (like Kinesis and Redshift) being integrated with DynamoDB streams.

### EC2 C4 Instance Type

New compute-optimized EC2 instance - [C4](http://aws.amazon.com/blogs/aws/new-c4-instances/) is built on top of 3rd generation Intel Haswell processor (Intel Xeon E5-2666 v3). It was designed and built exclusively for AWS and it's base clock frequency of 2.9 GHz can be boosted up to 3.5 GHz. C4 has [EBS optimisation](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSOptimized.html) turned on by default and [Enhanced Networking](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/enhanced-networking.html) allows it to achieve higher packet per second rate and lower network latency.

Do we need more computing power? Always!

### New EBS volumes

In [EBS](http://aws.amazon.com/ebs/) new volume types will be available soon:

* general purpose (backed by SSD) with up to 16 TB of space, 10 000 IOPS (IO operations per second) and overall throughput of 160 Mbps,
* provisioned IOPS (also backed by SSD) with up to 16 TB of space, 20 000 IOPS and overall throughput of 320 MBps.

We think that most of customers can benefit from new volumes as most of the data intensive workloads are IO-bound.

## After thoughts

For us re:invent conference was a great experience as it gathered a lot of knowledge on cloud computing and positive vibe in a single place. We've learned a lot both from keynotes, new products announcements, sessions, bootcamps and chit-chats with people we met. We are looking forward for new re:inventions in 2015!


***Update 02.12.2004***: Previously I wrote that Wojciech Lesicki is Product Owner of our private cloud infrastructure. Basically he is responsible for both private and public cloud infrastructures. I'm sorry for this mental shortcut.
