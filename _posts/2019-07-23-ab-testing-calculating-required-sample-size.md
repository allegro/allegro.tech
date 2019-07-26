---
layout: post
title: A/B testing good practise – calculating required sample size
author: [bartlomiej.beczkowski,ewelina.bednarz]
tags: [tech]
---

# A/B testing good practise – calculating required sample size
Developing our own A/B testing platform from scratch came with many lessons during the process. Our platform was built
for people that differs vastly in term of a statistical knowledge, also for those who are not familiar with statistics at all.
So the main challenge wasn't technical implementation. The hardest thing was (and still is) developing good practises and spreading them among our users.
We want to share some of our current knowledge that we think is crucial for A/B testing at scale. 
From this article you will get to know about calculating sample size: what it means and what benefits it provides for you and your organization.
 
## Quick reminder of the statistical significance
If you are not familiar with the concept of statistical significance, we prepared a quick guide that will give you the required
intuition to understand the whole article. **If you are familiar with the concept, just skip this part**.

Let's suppose that you are conducting an experiment that checks if making the button larger increases its CTR (click through rate).
You want to deploy the larger button if it performs better than the smaller button in term of the CTR. 
50% of your users see the smaller button and 50% see the larger button.

<img alt="Small button vs large button" src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/small-vs-large.png" />

After you stop your experiment, you check the CTR of each version
of your button and you can see that the larger button has 10% CTR and the smaller button has 9% CTR. Is it the proof that the larger button
is better in term of the CTR than the smaller button? Not really. 

Let's say that you run an A/A test. For example small button vs small button. 
Even when you compare exactly the same buttons, you will always see some difference between their CTR. So the question is:
how do I know if the difference in CTR comes from the change that I test and not from a random user behaviour?

The answer is: you need to calculate the statistical significance. To calculate the statistical significance for the described
experiment you need the number of clicks and the number of views for each button. Let's say that the large button got 100 clicks
and 1000 views and the small button got 90 clicks and 1000 views.
Using this [calculator](https://www.surveymonkey.com/mp/ab-testing-significance-calculator/) you get the result "Result not significant!":

<img alt="Result not significant!" src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/non-significant.png" />

It means that the difference in buttons CTR comes from a random user behaviour and not from the actual difference between the buttons.
Now, let's modify the button performance a bit. Let's say that the large button got 200 clicks and 1000 views and the small button got 90 clicks and 1000 views.
When you calculate the significance again you get "Significant result!":

<img alt="Result not significant!" src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/significant.png" />

It means that difference between the buttons CTR comes from the real difference between them and not from a random users behaviour.

Unfortunately, the statistical significance is not a perfect tool and it sometimes gives you a false results. It means that even
when you see "Significant result!", in reality it can be "Result not significant!". It works both ways, so when the calculator tells
you "Result not significant!" in reality it can be "Significant result!". In conclusion, there are 4 possible results of
the statistical significance test:

|                                                           | "Significant result!"                | "Result not significant!"                |
|-----------------------------------------------------------|--------------------------------------|------------------------------------------|
| There is no difference between the buttons CTR in reality | false positive                       | true negative                            |
| There is a difference between the buttons CTR in reality  | true positive                        | false negative                           |

 Let's go through each option:
 * **false positive** happens when the difference in buttons CTR comes from random user behaviour but calculator says the opposite,
  that results are statistically significant. In that situation you deploy larger button because you think that it performs better
  but in reality there is no difference.
 * **true negative** happens when the difference in buttons CTR comes from random user behaviour and calculator confirms that
  by showing "Result not significant!". In that situation you don't deploy larger button because there is not difference in CTR.
 * **true positive** happens when the difference in buttons CTR comes from it's characteristics and not just from random user
  behaviour and statistical significance test admits that by showing "Significant result!". You deploy larger button and
  that's right choice because there is in fact a difference.
 * **false negative** happens when the reality is that difference in CTR comes from buttons characteristic but statistical
  significance test says that it comes from random user behaviour. In result you don't deploy larger button because you
  think that difference came from random user behaviour. You just missed the opportunity!
 
Ok, so you know that statistical significance test may be wrong. But what is a probability of getting wrong test result?
Answer is: it depends. You have control over probability of getting false positive by setting confidence level.
Confidence level defines probability of getting true positive results. It doesn't mean that you can just set confidence
level at 100%. Different confident levels require different sample size. Higher confidence level demands more samples.
That's why you can't just set confidence level at 100%, because it requires infinite number of samples. In case of the example
experiment, a single button view is a single sample. As you can see on the picture below, by increasing number of samples,
non significant result changed to significant result (percentage CTR values are the same as previous ones):

<img alt="Result not significant!" src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/higher-sample-size.png" />

If you look closely at the results that [calculator](https://www.surveymonkey.com/mp/ab-testing-significance-calculator/) provides,
you can see the details section. The details section contains information used by the calculator to determine final result.

<img alt="Result not significant!" src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/details-pvalue.png" />

The key value used to determine the final result is the p-value. Under the hood, calculator calculates p-value and compares
it with threshold calculated from confidence level:

\begin{equation}
\frac{ 100\% - \textrm{confidence} }{2}  >= \textrm{p-value}
\end{equation}

If p-value is above threshold, the result is not significant.

## What is the problem?
We noticed that our users are not ignorant about statistical significance, but it's really hard to understand the concept
completely. Because of that, they very often take invalid approach to conducting tests. If you are aware of the concept of
statistical significance and you are not calculating required sample size already, it's very likely that:

1. You stop your test as soon as you see statistical significance.
2. You stop your test after specific period of time, for example 2 weeks.

In both cases you lower your chances of conducting successful test by stopping test to early. Second option is much 
better than first one, but still it's not perfect. 

<figure class="image">
  <img src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/pValue_SampleSize.svg" width="800" alt="pValue Sample Size">
  <figcaption><center>Figure 1: Change of p-value during gathering samples - data gathered during a simulation </center></figcaption>
</figure>

First of all, why is stopping the test after you see the first significant result so bad practice?
It's because your chance of getting false positive is rising. **False positive occurs when we see a statistically significant
difference where in fact there is none**. In that situation you are very likely to deploy change that has no real effect or has negative effect.
On _Figure 1_ you can see that after 12 gathered samples you could stop gathering them (because p-Value is smaller then
0.05 at that point) and mistakenly conclude that there is statistically significant difference, where in fact there is none.

<figure class="image">
  <img src="/img/articles/2019-07-23-ab-testing-calculating-required-sample-size/TruePositives_SampleSize.svg" width="800" alt="True Negatives Sample Size">
  <figcaption><center>Figure 2: Dependency between number of detected true positives and sample size - data gathered during simulations </center></figcaption>
</figure>

Second option is a step in the good direction. Still, it's not perfect solution, because, for example, when you want to detect 1% difference you need to gather
more samples than when you want to detect 10% difference. Two weeks time might be enough to detect 10% difference, but it might not detect 1% difference.
Problem is that the result of your test depends vastly on a number of samples. You can run a test for a year and still not gather enough samples to prove your hypothesis. 
You can see on _Figure 2_ that fraction of detected true positives (detecting a difference when there is one) is increasing with sample size. 

Fortunately, there is a way to calculate required sample size based on your hypothesis. Knowing the required sample size
 and daily traffic on your website you can calculate how long does it take to conduct your test.

## What are the benefits?

A/B testing is time consuming, no matter how powerful and convenient your tools are. Test needs to be designed,
implemented, conducted and concluded. Each phase is critical and can cause making wrong decisions or wasting time.
Calculating required sample size means spending a little bit more time on test design. But it pays out by making inference
easier and less prone to errors. 

One of our current goals in Allegro is improving experimentation pace. There are obvious ways to improve it, for example
reducing number of implementation errors that cause repeating whole test. Making a hypothesis more strict by calculating
required sample size is more subtle change from a user perspective. But it cause positive changes in the whole platform by:

* Reducing number of insignificant results caused by insufficient number of samples.
* Forcing users to form strict hypothesis.
* Saving time that could be lost because of running test to long.

## Calculating required sample size
Depending on type of metric that you want to change and on the test that will be conducted, you are going to use different methods to calculate required sample size.
Below, we described process of calculating required sample size for most common metrics.

## Using sample size calculator for binary metrics
Binary metric is defined as a number of successes divided by a number of trials. Example binary metrics are conversion rate or CTR (click through rate).
In the case of CTR, a number of trials is how many times a user saw the element and number of successes is how many times a user clicked on the element.

Let's say that you want to conduct an experiment that checks if changing the color of the button from blue to red increases its CTR.
We also know that CTR of the blue button is 5%. First, you need to form the hypothesis, for example:

**Changing button color from blue to red will increase it's CTR by at least 10% from current 5%.**

That's the most basic form of the hypothesis that you can use to calculate the required sample size. It contains three crucial elements:
* Which metric you want to change, in this case it's CTR.
* What is the minimal impact that you are looking for, in this case it's +10%.
* What is the base (current) value of the metric, in this case it's 5%.

You can use the [Optimizely calculator](https://www.optimizely.com/sample-size-calculator/) to calculate the required sample size
based on that hypothesis. The baseline conversion rate will be 5% and the minimum detectable effect will be 10%. For now, you can forget about 
the third parameter – statistical significance and leave it as it is by default. The required sample size per variant should be 31,000. 

When you know the required sample size per variant, you can combine that with information that is provided by your analytics to estimate
how long exactly does it take to conduct your test. Let's say that the button is viewed 1000 times in a single day. Knowing that
you can conclude that you should run your test for 62 days. This is so because when you split your users into the two equal size groups,
each generates 500 views per day. So to gather 31,000 samples per each group you need 31,000 / 500 = 62 days.

Finally let's go back to third parameter – statistical significance. There is no way of completely avoiding false positive outcome.
Fortunately, you can control probability of false positive by changing the value of significance level. As a result, the sample size will naturally increase.
Intuitively, by doing more trials you can be more sure about test outcome. That's why when you increase statistical significance, for example to 99% from default 95%,
number of required samples is rising from 31,000 to 33,000 (what is called in this calculator _statistical significance_ is formally named _confidence level_).

If you are interested in making your calculations more precise you need to know that there is fourth parameter that is 
not included in Optimizely calculator - power. Power is the probability that the test will say that there is statistically significant
difference, when it really is. Increasing power will also result in enlarged sample size. If you want to manipulate test power, you need more
[complex calculator](https://conversionxl.com/ab-test-calculator/). Calculator you are interested in is called _Sample size calculator_.

## Calculating sample size for binary metrics (CTR, conversion rate, bounce rate, etc.)

If you are interested in some formulas and what we actually implemented, you should continue reading.


For calculating statistical significance of the difference between two variants, when we are dealing with binary metric, we use chi-squared test for independence.
It is used to test relationship between the expected frequencies and the observed frequencies in two categories and this exactly what we want. 
To estimate sample size $$N$$ we use following formula (which assumes that sample sizes of both variants are equal):

\begin{equation}
N = \frac{2(z_\alpha+z_{\beta} )^2 \mu(1-\mu)}{\mu^2 \cdot d^2} 
\end{equation}

where $$\alpha$$ is confidence level and $$\beta$$ is power of the test. These $$z$$-values might look a little bit confusing, 
but don't worry – they are tabulated values, which you can simply read from [the $$z$$-score table](http://www.z-table.com/). $$\mu$$ is
base (current) value of the metric and $$d$$ is the minimal impact that you want to detect. As you can see all of 
parameters are known and you can calculate estimated sample size.

## Calculating sample size for non-binary metrics (AOV, GMV,  etc.)
Non-binary metric is any metric that isn't binary, as the name says. It could be for example AOV (average order value) or 
GMV (gross merchendise value). To test whether there is statistically 
significant difference between two variants we use nonparametric Mann-Whitney U test. This test can be used to determine whether 
two independent samples were selected from populations that have the same distribution. Calculating sample size in this case 
is a bit more tricky. In fact there is no online calculator to do that and here we propose our method of calculating sample size $$N$$. 
Parametric equivalent of Mann-Whitney U test is Student's t-test. It is known that sample size for our nonparametric test is at most
15% bigger than sample size that is required for parametric version, so we calculate sample size for t-test and than multiply it by 1.15.
Here is the formula:

\begin{equation}
N = \frac{(z_\alpha+z_{\beta} )^2 \sigma^2}{\mu^2 \cdot d^2} \cdot 1.15 
\end{equation}

Just like previously $$\alpha$$ is confidence level, $$\beta$$ is power of the test, $$d$$ is the minimal impact that you want to detect,
$$\mu$$ is base (current) value of the metric and $$\sigma$$ is its standard deviation. Now you can easily calculate estimated sample size $$N$$. 

## Summary
When you are conducting an experiment you should remember a couple of things that are related to statistics. 
First of all, you should state your hypothesis correctly. 
Secondly, you should remember about possible outcomes (false positive, false negative, true positive and true negative)
of your experiment and their probabilities.
Last but not least, **calculate your desired sample size before conducting an experiment** as to avoid bias in interpreting results. 
Especially you shouldn't stop the experiment just at the moment you see a statistically significant result. If you have problems with
estimating sample size, there are several online calculators or you can use formulas provided by us.
