---
layout: post
title: Golang slices gotcha
author: [tomasz.janiszewski]
tags: [go, golang]
---

In this post I present a story of a bug that hit us recently. Everything was
caused by unexpected (although documented) behavior of Go built-in function
[`append`](https://golang.org/pkg/builtin/#append). This bug has lived silently
for nearly a year in
[allegro/marathon-consul](https://github.com/allegro/marathon-consul). Ensure
you run [the latest version](https://github.com/allegro/marathon-consul/releases/).

### The missing service

![Dude, where is my service](/img/articles/2017-07-20-golang-slices-gotcha/dude.jpg){: .center-image }

At Allegro we build our infrastructure on the top of
[Mesos](http://mesos.apache.org/) and
[Marathon](https://mesosphere.github.io/marathon/). For discovery service we
use [Consul](https://www.consul.io/). Services registration is done by
[allegro/marathon-consul](https://github.com/allegro/marathon-consul), a simple
tool written in Go to register services started by Marathon in Consul.

One day we deployed a service. It was neither a new service nor a big release. It
was just a regular deployment.  But there was a problem. The service had two
ports, each registered in Consul. After deployment, both ports had the same tags
although they were configured differently. This might not sound like a serious
issue but it was. The service was unavailable because its clients couldn’t find it
due to invalid tags on  a port responsible for handling clients’ requests.

Marathon-Consul was not touched for some time, so it was very unlikely that it
was responsible for malformed registration. Application configuration in
Marathon looked good. There were some global service tags on application level
and additional tags on each port. Why Marathon-Consul messed up with this?

We checked what had changed in new the deployment and the only difference was
the service version and additional service tag that was added. Why adding a new tag
results in a such weird behavior? We deleted this tag and the service was
registered correctly. We added it and tags was filled wrong. We added a test to
reproduce it and contributed
[a fix](https://github.com/allegro/marathon-consul/pull/247).

### The bug

The bug lied in
[the following code](https://github.com/allegro/marathon-consul/blob/1.3.3/apps/app.go#L119-L130):

```go
commonTags := labelsToTags(app.Labels)
var intents []RegistrationIntent
for _, d := range definitions {
        intents = append(intents, RegistrationIntent{
                Name: app.labelsToName(d.Labels, nameSeparator),
                Port: task.Ports[d.Index],
                Tags: append(commonTags, labelsToTags(d.Labels)...), // ◀ Wrong tags here
        })
}

func labelsToTags(labels map[string]string) []string {
	tags := []string{}
	for key, value := range labels {
		if value == "tag" {
			tags = append(tags, key)  // ◀ Hint: The way we build tags is important
		}
	}
	return tags
}
```

The bug is not easy to hit and probably thats why it wasn’t covered in tests
and nobody reported it before.
To reproduce it, application must have at least two ports with different tag on each.
When `commonTags` size is power of two it worked but in other case — it didn’t.
It’s a rare case a service has multiple ports
(80% of our applications has only one port)
and even rarer when ports have additional tags
(8% of our ports has port tags).

The bug can be distilled to the example below.
Let’s unroll the loop to just two iterations and use `int`s instead of structures.
Then rename `commonTags` to `x` and fill it with some values.
Finally, use `y` and `z` instead of `intents[0]` and `intents[1]`.
What’s the output of the following code?

```go
package main

import (
	"fmt"
)

func a() {
	x := []int{}
	x = append(x, 0)
	x = append(x, 1)  // commonTags := labelsToTags(app.Labels)
	y := append(x, 2) // Tags: append(commonTags, labelsToTags(d.Labels)...)
	z := append(x, 3) // Tags: append(commonTags, labelsToTags(d.Labels)...)
	fmt.Println(y, z)
}

func b() {
	x := []int{}
	x = append(x, 0)
	x = append(x, 1)
	x = append(x, 2)  // commonTags := labelsToTags(app.Labels)
	y := append(x, 3) // Tags: append(commonTags, labelsToTags(d.Labels)...)
	z := append(x, 4) // Tags: append(commonTags, labelsToTags(d.Labels)...)
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
Function `a()` works as expected but behavior of `b()` is not what we were
expecting.

### Slices

![Slices](/img/articles/2017-07-20-golang-slices-gotcha/slices.jpg){: .center-image }

To understand this not obvious behavior we need some background on [how slices
works](https://blog.golang.org/go-slices-usage-and-internals) and what happens
when we call `append`.

Slice is a triple of pointer to first element, length and capacity (length ≤
capacity). Memory is continuous block of data but slice uses only length of
capacity.

![slice_1.svg](/img/articles/2017-07-20-golang-slices-gotcha/slice_1.svg){: .center-image }

According to documentation of `append`:

> The append built-in function appends elements to the end of a slice. **If it
has sufficient capacity, the destination is resliced to accommodate the new
elements. If it does not, a new underlying array will be allocated. Append
returns the updated slice.** It is therefore necessary to store the result of
append, often in the variable holding the slice itself:

`append` allocates a new slice if new elements do not fit into a current slice,
but when they fit they will be added at the end. `append` always returns a new
slice but (as the slice is a triple of address, length and capacity) the new
slice could have the same address and capacity and differs only on the length.

### How slices grow?

![One does not simply append to a slice](/img/articles/2017-07-20-golang-slices-gotcha/boromir.jpg){: .center-image }

Above paragraph does’t answers why code works like this. To understand it, we
need to go deeper in Go code. Let’s take a look at
[`growslice`](https://github.com/golang/go/blob/eb88b3eefa113f67e7cf72dfd085f65bbd125179/src/runtime/slice.go#L72-L82)
function of Go runtime. It’s called
by `append` when a slice does’t have enough capacity for all appended elements.

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
heuristics, but in our case it grows just like this.

### Connect the dots

Let’s go through `b()` step by step.

```go
x := []int{0}
x = append(x, 0)
x = append(x, 1)
```
Create a slice with 2 elements.
![1.svg](/img/articles/2017-07-20-golang-slices-gotcha/1.svg){: .center-image }

```go
x = append(x, 2)
```
Append one element. `x` is too small so it need to grow.
It doubles its capacity.
![2.svg](/img/articles/2017-07-20-golang-slices-gotcha/2.svg){: .center-image }

```go
y := append(x, 3)
```
Append one element. Slice has free space at the end so
`3` is stored there.
![3.svg](/img/articles/2017-07-20-golang-slices-gotcha/3.svg){: .center-image }
```go
z := append(x, 4)
```
Append one element. Slice has free space at the end so
`4` is stored there and overwrites `3` stored before.
![4.svg](/img/articles/2017-07-20-golang-slices-gotcha/4.svg){: .center-image }

All 3 slices: `x`, `y` and `z` point to the same memory block.

Why it’s working in `a()`? The Answer is really simple. There is a slice of capacity
two and when we append one element it’s copied to a new space. That’s why we end up
with `x`, `y` and `z` pointing to different memory blocks.

![5.svg](/img/articles/2017-07-20-golang-slices-gotcha/5.svg){: .center-image }

### TL;DR

Be careful when using slices. If you want to work on a copy of a slice data,
you must explicitly [`copy`](https://golang.org/pkg/builtin/#copy)
it into a new slice.

![What if I told you](/img/articles/2017-07-20-golang-slices-gotcha/matrix.jpg){: .center-image }
