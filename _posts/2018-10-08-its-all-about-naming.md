---
layout: post
title: It’s all about naming
author: wojciech.jurczyk
tags: [cleancode, craftsmanship, tests]
---

We all know that “there are only two hard things in Computer Science: cache
invalidation and naming things”. However, we know that writing good tests is
hard, too. Does it mean that the author of the famous quote is wrong? Not
necessarily! In fact, what are tests? These are descriptions of some concepts.
They answer the questions: “what?”, “when?” and “how?”. When writing tests, you are
answering these questions by giving names to objects, reasons, and processes. I
think writing tests is hard because it is all about naming. I believe you can
significantly improve your tests just by focusing on giving them correct names. Let
me tell you a story of a pull request I was reviewing some time ago.


At that time, one of the tasks of the frontend team was to modify a date picker
component. A simple date picker should have a checkbox which, when checked,
meant “select no date”. It seemed a fairly straightforward task and when the PR
was ready for review I decided to give it a look. Even though
it was a piece of javascript code and I am a backend developer, my fellow frontend
developers were grateful for my comments and suggestions.

## An enigmatic test
I opened the code and went directly to the tests to see what the change was
really about. One of the tests attracted my attention. It was enigmatic to me.
At the first moment, I didn’t understand what the test did:
```javascript
it('should handle happy path on checked form', () => {
   // given
   const onConfirm = sinon.spy();
   props.onConfirm = onConfirm;
   const endDateEditDialogWrapper = shallow(<EndDateEditDialog {...props} />);
   const dialogWrapper = endDateEditDialogWrapper.dive();
   const checkboxComponent = dialogWrapper.find('Checkbox');
   const dialogComponent = dialogWrapper.find('Dialog');

   // when
   checkboxComponent.props().onCheck({ target: { checked: true } });
   dialogComponent.props().actions.find(element => element.props.label === 'OK').props.onTouchTap();

   // then
   expect(endDateEditDialogWrapper.state('errorText')).to.be.null;
   expect(endDateEditDialogWrapper.dive().find('DatePickerInput').props().disabled).to.be.true;
   expect(onConfirm).to.have.been.calledWith(null);
});
```
### State requirements by giving tests descriptive names        
Test’s name mentioned handling a happy path, but I didn’t know what the happy
path was... The problem was that the name was too generic. A happy path could be
anything. I went through the whole test. It seemed to check if the date picker
selects no date when the checkbox is checked. Since the checkbox was checked by
default, this scenario was the default and the first to start tests with. This
was the reason for calling it a happy path test. Fair enough. Hey, now I know
what it really does and I can give it a better name! A name that tells what the
test is about. Do you know what it is? This is easy because I already mentioned
it: “should select no date when the checkbox is checked”.
```javascript
it('should select no end date when noEndDate checkbox is checked', () => {
```
Next time, when someone reads the test, he will know what it is about
because the name precisely describes it. Good test naming is important not only
because it saves time during reviews. For example, when you change the code and
one of the tests starts to fail you can verify if it’s because there’s a bug in
the code or some requirement is no longer valid.

### Name blocks of code by extracting methods
In the next step of the review, I examined the test’s body. What happens in the
`given` section? -- I wondered. This part was even harder to understand because
I didn’t know the frontend tools and libraries that much. I knew that in this
part of the test the EndDateEditDialog component was created. However, I didn’t
know how important to the test ```shallow(...)``` and ```dive()``` were. After a short
discussion, it turned out that these were just boilerplate. The
important things created in the `given` section were: onConfirm (a callback to
test whether the correct value is “returned” by the component) and dialogWrapper
(a handle to the tested component itself).

The code’s purpose is to create EndDateEditDialog. The code would be easier to
understand if the purpose was explicitly written in the code. How do you give a
name to a block of code? Yes, you extract a method. Now, let’s hide the
boilerplate in a new method!
```javascript
const { onConfirm, endDateEditDialogWrapper } = getEndDateEditDialog();

// ...

function getEndDateEditDialog() {
   props.onConfirm = sinon.spy();
   const endDateEditDialogWrapper = shallow(<EndDateEditDialog {...props} />);
   return { onConfirm: props.onConfirm, endDateEditDialogWrapper };
}
```
Extracting a method is a good idea not only because it names a block of code.
Very often the extracted method will be reused. Then, if something changes, for
example, the way how EndDateEdit is created, only one place in the code will
need to be modified.

The getEndDateEditDialog method was not the only block that should have been
extracted. The next candidate was:
```javascript
checkboxComponent.props().onCheck({ target: { checked: true } });
```
When I read the code above I started wondering if this was the [IOCCC](https://www.ioccc.org/) contest?
This obfuscated line says “the
checkbox component is checked”, so why not write it as below?

```javascript
setCheckboxChecked(endDateEditDialogWrapper, true);
// ...
function setCheckboxChecked(endDateEditDialogWrapper, checked) {
   const dialogWrapper = endDateEditDialogWrapper.dive();
   const checkboxComponent = dialogWrapper.find('Checkbox');
   checkboxComponent.props().onCheck({ target: { checked } });
}
```
The same applies to the next line:
```javascript
dialogComponent.props().actions.find(element => element.props.label === 'OK').props.onTouchTap();
```
Which just clicks the confirmation button and can be simplified to:
```javascript
confirmButtonClicked(endDateEditDialogWrapper);
```
I will leave the method body as an exercise for the reader :)

After writing the comments and suggestions to the `given` and `when` sections, I
reviewed the `then` section. It looked like this:
```javascript
// then
expect(endDateEditDialogWrapper.state('errorText')).to.be.null;
expect(endDateEditDialogWrapper.dive().find('DatePickerInput').props().disabled).to.be.true;
expect(onConfirm).to.have.been.calledWith(null);
```
Before going forward, I want to say that the first two assertions do not belong
to 'should select no end date...' and they were separated to another test cases.
There are dozens of articles focusing on why you should use only one assertion per test
so I’m not going to focus on it here. More interesting was the last line.
```javascript
expect(onConfirm).to.have.been.calledWith(null);
```
It uses a fluent API and it’s readable. One thing it’s missing is that it
doesn’t use the business language. It doesn’t tell what calling onConfirm
with null means from a business perspective. Ii might be a good thing to
refactor it as follows:
```javascript
noDateWasSelected(onConfirm);
```
However, after refactoring and in the context of the test’s new name the
original assertion is rather obvious and good enough to leave it unchanged.

To this point, test code after code review looked like this:
```javascript
it('should select no end date when noEndDate checkbox is checked', () => {
   // given
   const { onConfirm, endDateEditDialogWrapper } = getEndDateEditDialog();

   // when
   setCheckboxChecked(endDateEditDialogWrapper, true);
   confirmButtonClicked(endDateEditDialogWrapper);

   // then
   expect(onConfirm).to.have.been.calledWith(null);
});
```
### Name only necessary things -- be concise by using builders
Still, there was one thing I wanted to change. I disliked the fact the checkbox
was set to checked state in the `when` section. For me, the test case was to test the behavior
of the component with a checked checkbox rather than to test the behavior of
checking and then confirming. I think that the checkbox should be checked in the
`given` section. It is not hard to achieve because the getEndDateEditDialog
method can be parameterized! What if it took values of component’s properties?
With such a function we don’t need to call setCheckboxChecked, but pass the
‘true’ flag to getEndDateEditDialog. In the end, the test could look like this:
```javascript
it('should select no end date when noEndDate checkbox is checked', () => {
   // given
   const { onConfirm, endDateEditDialogWrapper } = getEndDateEditDialog({noEndDateChecked: true});

   // when
   confirmButtonClicked(endDateEditDialogWrapper);

   // then
   expect(onConfirm).to.have.been.calledWith(null);
});
```
## Important things to remember
Writing good tests is a lot more than just names, but if you:
* name what you are testing by giving tests descriptive names,
* extract methods to name blocks of code,
* define builder methods to hide unimportant things and focus on what matters,
* use custom assertions,

you will very easily improve your tests and save reviewers’ and maintainers’
time, as well as spare everyone a bit of frustration. I am happy and kind of proud that the
frontend developers appreciated my comments, changed their code and still make use of
what they have learned during the review to this day. I hope you found this article helpful, too. Let me leave you with a question: “what will happen when
you broaden the idea of this article and say that other things are also hard because
they are analogous to naming things (think of splitting code into classes, designing
system architecture, etc.)?
