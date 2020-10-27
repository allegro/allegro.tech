# Tutorial for AllegroTechBlog Authors

## Where to commit your texts
Write your article in Markdown, save it to `_posts` folder.
If this is your first post, prepare your Bio.

Install needed gems
`bundle install --path vendor/bundle`

Launch the site using [jekyll](https://help.github.com/articles/using-jekyll-with-pages),

`bundle exec jekyll serve -i`

Is your article rendered correctly?

Check if there are any obvious errors by running linter.

```bash
./linter/run.sh
```

Create a Pull Request and get some feedback.

### Filename convention

* _posts/2015-03-09-shaken-not-stirred.md
* _posts/2014-11-12-my-new-awsome-post-about-dreams.md


## Your Bio and Profile
If first time on the blog, add your short **Bio** to this file:

```
_data/members.yml
```

Don’t forget about your **photo**, add it here:

```
img/authors/
```

Then, prepare your **profile page**.
Create a file:

```
authors/firstname.lastname/index.md
```

using the following template:

```
---
layout: author
author: firstname.lastname
---
```

## Format
Articles have to be written in Markdown.
Use [github-flavored-markdown](https://help.github.com/articles/github-flavored-markdown)

Read more about Markdown at

* http://daringfireball.net/projects/markdown/
* syntax http://daringfireball.net/projects/markdown/syntax

## Front Matter
We use Jekyll Front Matter for metadata. You should put following HEAD into your article.

    ---
    layout: post
    title: Java Testing Toolbox
    author: rafal.glowinski
    tags: [tech, java, testing, rest, mockito, junit, assertj]
    ---

### Special tags

There are two special tags: `tech` and `agile`.

Choose `tech` if you want to publish on Tech Blog.

Choose `agile` if you want your to publish on Agile Blog.


## Line breaking
Text lines should not be longer than **120 characters**, for the same reason as lines in the source code.

## Code formatting

Inlined code fragments like `user_id` should be wrapped  with backtick quotes (`).

Code blocks should be formatted with syntax highlighting,
using github style syntax -  <code>```language</code>

    ```java
    public class User {
    //...
    ```

## Links
Avoid raw links like [http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/base/Preconditions.html](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/base/Preconditions.html).

Instead, use meaningful names for links, like [Preconditions](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/base/Preconditions.html).

Avoid enigmatic names for links, like see it [here](https://www.youtube.com/watch?v=TUHgGK-tImY).

When you mention some technology, library or project like [Mockito](https://code.google.com/p/mockito/)
, link it at least first time when it appears in the text.

## Headers
If you are using only one level of headers use ### (h3).

If you want to distinguish between section headers and subsection headers,
use ## (h2) for section headers ### (h3) for subsection headers.

Never use # (H1) as it’s reserved for the title. Don’t repeat the title in the first header (Jekyll takes care of rendering the title of your post).

## Don’t confuse hyphens and dashes
In English, we use hyphens (-) for hyphenation and phrases like *4-10 points*, *so-so*.

For separating two parts of a sentence we always use **em dash** character (—).

For example:
*I pay the bills — she has all the fun*

For keyboard shortcuts, refer to the table below or just copy-paste
a special character from this page.

## Straight and curly quotes
In good typography, straight quotes should be **avoided.**.

Instead of using straight single quote (') and the straight double quote ("),
use curly quotes:

* opening single quote (‘),
* closing single quote (’),
* opening double quote (“),
* and closing double quote (”).

Why? Compare:

<font size="5">
"That's a 'magic' sock."</font>	// wrong <br/>
<font size="5">
“That’s a ‘magic’ sock.”</font> //right


Most **frequently you will use the closing single quote** (’) for words like: don’t, it’s.

## Special characters keyboard shortcuts
<table >
    <tr>
        <th>char</th>
        <th>name</th>
        <th>Windows</th>
        <th>Mac</th>
        <th>Linux</th>
        <th>HTML</th>
    </tr>
    <tr>
        <td>—</td>
        <td>em dash</td>
        <td>alt 0151</td>
        <td>Alt + Shift + hyphen</td>
        <td>Compose, -, -, -</td>
        <td>&amp;mdash;<br/></td>
    </tr>
    <tr>
        <td>‘</td>
        <td>opening single quote</td>
        <td>alt 0145</td>
        <td>Alt + ]</td>
        <td>Compose, ', &lt;</td>
        <td>&amp;lsquo;</td>
    </tr>
    <tr>
        <td>’</td>
        <td>closing single quote</td>
        <td>alt 0146</td>
        <td>Alt + Shift + ]</td>
        <td>Compose, ', &gt;</td>
        <td>&amp;rsquo;</td>
    </tr>
    <tr>
        <td>“</td>
        <td>opening double quote</td>
        <td>alt 0147</td>
        <td>Alt + [</td>
        <td>RightAlt + v</td>
        <td>&amp;ldquo;</td>
    </tr>
    <tr>
        <td>”</td>
        <td>closing double quote</td>
        <td>alt 0148</td>
        <td>Alt + Shift + [</td>
        <td>RightAlt + b</td>
        <td>&amp;rdquo;</td>
    </tr>
</table>
source: [practicaltypography.com](http://practicaltypography.com)

You can visit [fsymbols](http://fsymbols.com/keyboard/linux/compose/) for information about configuring and using Compose key on Linux.
You can also enter any Unicode character based on its hex code as described [here](http://fsymbols.com/keyboard/linux/unicode/).
