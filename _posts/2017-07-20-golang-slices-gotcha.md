---
layout: post
title: Golang slices gotcha
author: [tomasz.janiszewski]
tags: [golang]
---

In this post I’ll present a story of a bug that hit us recently. Everything was
caused by unexpected (although documented) behavior of Go built in function
[`append`](https://golang.org/pkg/builtin/#append). This bug has lived silently
for nearly a year in
[allegro/marathon-consul](https://github.com/allegro/marathon-consul). Ensure
you run [latest version](https://github.com/allegro/marathon-consul/releases/).

### Dude, where is my service?

![dude.jpg](https://draftin.com:443/images/52537?token=dI7aX0TJ-YueORUjzvysWmABYA692nRlqGjekNurdo6_nPMBu5bnKORQO53-FPZsttm4YMDooLgSAfwfSE5FZeg)

At Allegro we build our infrastructure on top of
[Mesos](http://mesos.apache.org/) and
[Marathon](https://mesosphere.github.io/marathon/). For discovery service we
use [Consul](https://www.consul.io/). Services registration is done by
[allegro/marathon-consul](https://github.com/allegro/marathon-consul), a simple
tool written in Go to register services started by Marathon in Consul.

One day we deployed a service. It was neither new service nor a big release. It
was just a regular deployment.  But there was a problem. The service has two
ports, each registered in Consul. After deployment both ports has the same tags
although they were configured differently. This might not sound like a serious
issue but it was. Service was unavailable because its clients couldn’t find it
due to invalid tags on  a port responsible for handling clients requests.

Marathon-Consul was not touched for some time, so it was very unlikely that it
was responsible for malformed registration. Application configuration in
Marathon looks good. There were some global service tags on application level
and additional tags on each port. Why Marathon-Consul messed with this?

We checked what had changed in new deployment and the only difference was
service version and additional service tag that was added. Why adding new tag
results in a such weird behavior? We deleted this tag and service was
registered correctly. We added it and tags was filled wrong. We added a test to
reproduce it and provide
[a fix](https://github.com/allegro/marathon-consul/pull/247).

### The bug

The bug lied in
[the following code](https://github.com/allegro/marathon-consul/blob/1.3.3/apps/app.go#L119-L130):

```go
var intents []RegistrationIntent
for _, d := range definitions {
        intents = append(intents, RegistrationIntent{
                Name: app.labelsToName(d.Labels, nameSeparator),
                Port: task.Ports[d.Index],
                Tags: append(commonTags, labelsToTags(d.Labels)...),
        })
}
```

When `commonTags` has 3 elements it works but when there where 4 it doesn’t.
It’s rare case that some service has multiple ports to register and even rarer
when ports have additional tags.

The bug could be compressed to the example below. Everything lies in how
`commonTags` is created. What’s the output of the following code?

```
package main

import (
        "fmt"
)

func a() {
        x := []int{0, 1}
        y := append(x, 2)
        z := append(x, 3)
        fmt.Println(y, z)
}

func b() {
        x := []int{0, 1}
        x = append(x, 2)
        y := append(x, 3)
        z := append(x, 4)
        fmt.Println(y, z)
}

func main() {
        a()
        b()
}
```
First guess could be
```
[0, 1, 2] [0, 1, 3]
[0, 1, 2, 3] [0, 1, 2, 4]
```
but in fact it results in
```
[0, 1, 2] [0, 1, 3]
[0, 1, 2, 4] [0, 1, 2, 4]
```
Function `a()` works as expected but behaviour of `b()` is not what we were
expecting.

# Slices

![slices.jpg](https://draftin.com:443/images/52539?token=KKV3Vr4XJjUMwGrFv9cnTvckFe4Ow4DOgmGEN5aMONEGi0TLNIF2aGLSWNExKTqdGJXf6P3jksagD_8M2VjFr2g)

To understand this not obvious behavior we need some background on [how slices
works](https://blog.golang.org/go-slices-usage-and-internals) and what happen
when we call `append`.

Slice is a triple of pointer to first element, length and capacity (length <=
capacity). Memory is continuous block of data but slice uses only length of
capacity.

![slice_1.svg](https://draftin.com:443/images/52541?token=v95GYf0hDIc1vTjYjn_tq8T6BWjJrIcx-e8oH4NTkNDwOH28lUnjt28gCDborrqo2_StZWFdhH_OHlnFy4lJu6Y)

According to documentation of `append`

> The append built-in function appends elements to the end of a slice. **If it
has sufficient capacity, the destination is resliced to accommodate the new
elements. If it does not, a new underlying array will be allocated. Append
returns the updated slice.** It is therefore necessary to store the result of
append, often in the variable holding the slice itself:

`append` will allocate new slice if new elements do not fit into current slice,
but when they fit they will be added at the end. `append` always returns new
slice but as the slice is a triple of address, length and capacity, the new
slice could have the same address and capacity and differ only on a length.

# How slices grows?

![growslice.jpg](https://draftin.com:443/images/52540?token=bOw14y28vTOCO8s0osR_
YHBM8gEsrAsDeVLKZs6zRUKBLDsaQwqgMUtlANb9SqHNJy3Wa1xGNvVzDV4lb7wC1k8)

Above paragraph does not answers why code works like this. To understand it we
need to go deeper in Go code. Let’s take a look at
[`growslice`](https://github.com/golang/go/blob/eb88b3eefa113f67e7cf72dfd085f65b
bd125179/src/runtime/slice.go#L72-L82) function of Go runtime. It’s is called
by `append` when slice does not have enough capacity for all appended elements.

```go
// growslice handles slice growth during append.
// It is passed the slice element type, the old slice, and the desired new minimum capacity,
// and it returns a new slice with at least that capacity, with the old data
// copied into it.
// The new slice's length is set to the old slice's length,
// NOT to the new requested capacity.
// This is for codegen convenience. The old slice's length is used immediately
// to calculate where to write new values during an append.
// TODO: When the old backend is gone, reconsider this decision.
// The SSA backend might prefer the new length or to return only ptr/cap and save stack space.
func growslice(et *_type, old slice, cap int) slice
```

when slice needs to grow it
[doubles its size](https://github.com/golang/go/blob/eb88b3eefa113f67e7cf72dfd085f65bbd125179/src/runtime/slice.go#L101).
In fact there is more logic to handle growing
heuristics, but in our case it grows by power of two.

### Connect the dots

Let’s go thru `b()` step by step.

1. `x := []int{0, 1}` Create a slice with 2 elements.
![1.svg](https://draftin.com:443/images/52542?token=KVcdP1S51JgIRThTtDhEL7yhev98O2-I5UUtDVV4VobHYezuzw6mf-dyFq-IE9n07lMAUOv7AUA8kRm7uY6gtT4)
2. `x = append(x, 2)` Append one element. `x` is too small so it need to grow.
It doubles its capacity.
![2.svg](https://draftin.com:443/images/52543?token=KfGZ0YyVZCB1DDDXzAjN7JXgqlUZtw5NSSqC9hP6eoHz1pa9RidoxiGzrPDcxas5uP0unJhM5sUxXPlgkbjc5VM)
3. `y := append(x, 3)` Append one element. Slice has free space at the end so
`3` is stored there.
![3.svg](https://draftin.com:443/images/52544?token=YhMn5dg8T-lxwjbJOj-x6b1k42dIL898GnOGhsXgR9MnnBZitk5hjZAUB_SQDAEenAiSs_CYBqyUur0FlV4gj3c)
4. `z := append(x, 4)` Append one element. Slice has free space at the end so
`4` is stored there and overwrites `3` stored before.
![4.svg](https://draftin.com:443/images/52545?token=bqIQzCsEyGreMwPdyzj5_1KU6LjeIi2u6OyCZFjHl4o2dtAmZrXQxtJxACq3hSbLXTWncN3qGRTQhsh4PtHzt80)

All 3 slices: `x`, `y` and `z` points to the same memory block. Only difference
is they are different structures and `x` is smaller.

Why it’s working in `a()`? Answer is really simple. There is slice of capacity
2 and when we append one element it’s copied to new space. That’s why we end up
with `x`, `y`, `z` pointing to different memory blocks.

![5.svg](https://draftin.com:443/images/52546?token=bmBvyoqViskdVWQvBQmfz67pvcwxhGArJBqUFcPx881TqTM1MhAw2z-WR0EFBWSCdlot7Y7aVRda4d42xEfxsGw)

### TL;DR

Be careful when use `append`. If you want to work on a copy of a slice data you
append to, you must explicitly [`copy`](https://golang.org/pkg/builtin/#copy)
it into new slice.

![matrix.jpg](https://draftin.com:443/images/52538?token=kZ8CzKic3lIGOi01hDLNQ_ob_wSEwl2FljVZggTp1-ttKfgsKIjfqa2arcqpQS58fTT7NbBAoQa1YX3BS-hozzY)

