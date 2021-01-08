---
layout: post
title: Advances in Information Retrieval and Allegro use case at SIGIR 2016
author: [anna.wroblewska, lukasz.raczkowski]
tags: [tech, information retrieval, visual recommendation, image-based data, metrics, conference]
---

In July we attended the scientific conference SIGIR 2016 held in Pisa, Italy. SIGIR is an annual conference
related to new advances in Information Retrieval. The shortcut is for
[Special Interest Group on Information Retrieval](http://sigir.org/sigir2016/).
This is an annual conference with the highest ranking at
[Microsoft Academic Research in Information Retrieval field](http://academic.research.microsoft.com/RankList?entitytype=3&topDomainID=2&subDomainID=8&last=0&start=1&end=100)
field and the 16th in the ranking in the whole Computer Science field.

The event concentrates around topics such as metrics for information retrieval, evaluation techniques,
ranking challenges — called learning to rank, behavioral models, recommendation applications,
and information retrieval from heterogeneous resources and data, e.g. image, video, audio
or multimodal models.

## SIGIR Tutorials

The first day of SIGIR2016 was dedicated to [tutorials](http://sigir.org/sigir2016/tutorials/)
giving a quick look inside current state-of-the-art of information retrieval technologies.

The Huawei Labs prepared a tutorial about deep learning basics, challenges and applications in industry
 ([slides](http://www.hangli-hl.com/uploads/3/4/4/6/34465961/deep_learning_for_information_retrieval.pdf)).
It contained usage tips of recurrent and convolutional neural networks, embeddings,
[long short-term memory networks](https://en.wikipedia.org/wiki/Long_short-term_memory) dedicated to classification, language modelling, translation,
image matching. The tutorial provides a great bunch of the newest references that confirm the fact that deep learning
methods can significantly improve effectiveness of retrieval tasks like matching text or images,
classification and translations.

The other very interesting tutorial was about counterfactual evaluation of search, recommendation
and advertisements systems ([slides](http://www.cs.cornell.edu/~adith/CfactSIGIR2016/)) . The main goal of this tutorial
was to provide theoretical background and give a way to evaluate and optimize online metrics by exploiting logs
of past user interactions. They used inverse propensity scoring to model the bias in online A/B tests.
The bias can be caused by other (not in the focus) advert campaigns, or seasonal traffic etc.

Other tutorials covered topics such as learning to rank and search in heterogeneous or specific data.
They were given by people from Google, LinkedIn, Microsoft Research, Facebook and universities
from all over the world.

## Main Conference Topics

The main conference started with Chris Manning's
[intro lecture](http://nlp.stanford.edu/~manning/talks/SIGIR2016-Deep-Learning-NLI.pdf "SIGIR 2016 intro lecture")
on deep learning in understanding and inference from natural language.

There were many interesting short talks on e.g. Bayesian approach to the
[performance comparison of text classifiers](http://gridofpoints.dei.unipd.it/),  measuring how much system
components contribute to overall performances of IR system, various flavours of
[learning to rank models](https://sourceforge.net/p/lemur/wiki/RankLib/),e.g. learning to rank
on personal sparse corpora by Google, balancing diversity depending on user needs etc. There were a few very
interesting works by Yahoo Research e.g. image scoring or question answering.

The talks were divided in thematic blocks, which allowed the participants to choose which
presentations they want to attend. Particularly notable sessions were: Speech and Conversation Systems, Music and Math and User Needs. The first one focused on research related to speech recognition and using voice queries
to search on the web or talk with a virtual assistant. The second included a presentation on a music recommendation system
based on user behaviour and two talks on how to crack the problem of searching with (and for) mathematical equations.
The third of aforementioned blocks covered research related to user needs. It showed how our need for new information
correlates with brain activity, how waiting for search results can improve user satisfaction and what can we learn from data on
re-finding Twitter posts. This array of topics was a great way to get a better perspective on what can be done
within the field of information retrieval.

## Industrial Day and Allegro Use Case

The most attractive day for us was the 4th one when industry track was launched. There were  talks from the industry
 about IR systems at scale (big or small). The talks were given by Google, IBM Research on Watson applications,
Amazon/A9 on learning to rank and their models, e.g. using positive and negative feedback, hunger scores for
categories not chosen by a user, LinkedIn on their special job or skill search case, and estimating user skills
reputation, Microsoft Research on online testing and data processing issues in information retrieval. There were a
few small companies presenting on difference between academic/research work and industry deployment and how to start
business after working in research. And of course there was our presentation about visual recommendation use case at
Allegro.

We showed a systematic way step by step from the idea of using visual data in recommendations to deployment and
measuring it
([presentation](http://staff.ii.pw.edu.pl/~awroblew/Publikacje/seminaria/Wroblewska_Raczkowski_SIGIR2016.pdf),
[our paper]( http://dl.acm.org/citation.cfm?id=2926722&CFID=560372954&CFTOKEN=77451234),
[photos](https://m.flickr.com/#/photos/124835839@N03/28169044890/ )). At first we compare our image data-based
methods to text attributes of our offer images. Then we performed user focused subjective tests and then we deployed
our best solutions into our infrastructure.  After that we made A/B tests on a very small user traffic comparing
image-based methods to similar text based methods.

Our presentation was met with great interest. Many people were coming to us asking about our case, solutions and how
we managed to do it in quite a big company. It is a great success of Allegro as a company that we were able to
present its solutions amongst the biggest ones in the world like Google, Microsoft or Amazon.

## Information Retrieval Workshops

The conference ended with a few workshops, e.g.
[Neural IR by Microsoft](https://www.microsoft.com/en-us/research/event/neuir2016/) among others on deep learning
methods or [Medical IR workshop](http://medir2016.imag.fr/programme.html) on its very special use cases.
We found the latter to be especially interesting, mainly because it showed how information retrieval techniques can
be used in real life to help people. It also contained a talk about image search for medical images, so it was great
to compare it with what we did in our project.

## Social Attractions

During the course of the conference it was possible to attend poster and demo sessions, which included fantastic
applications of information retrieval in science and small industry. It was possible to talk to each author about
their project and to ask anything we wanted. It was a great opportunity to meet new people, socialize and make
contacts for the future.

Moreover, the conference offered several social events. Highlights included a welcome reception at the historic park
 of Giardino Scotto and a banquet at the Arsenali Repubblicani, a shipyard that dates back to the 13th century.
These events were another great chance to socialize, this time in a less formal environment. It also allowed us to
try for ourselves many great dishes from the Italian cuisine.

Summing up, the conference had a very bright, creative atmosphere. Among attendees were researchers, people from
industry and many students from all over the world. It was great to visit Pisa, which is a truly nice place in the
Italian region of Tuscany.

Ania Wróblewska<br>
Łukasz Rączkowski

![SIGIR2016 talk photo]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/27835837403_6158e920c2_k.jpg %})
![Arno river in Pisa]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/fgowGkN.jpg %})
![Pisa street]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/Lcw2e1E.jpg %})
![SIGIR2016 banquet]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/FcYrOIq.jpg %})
![Leaning tower of Pisa]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/HpUnVLI.jpg %})
![Pisa cathedral]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/HaDnNcT.jpg %})
![Łukasz in front of the conference venue]({{site.baseurl}}/{% link /img/articles/2016-10-17-advances-in-information-retrieval/Dw56VLs.jpg %})
