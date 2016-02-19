
Style Validator
============================

Style Validator is CSS Validator that can detect `Risky Style` that might break layout after JavaScript or CSS Media Queries.

[demo](http://style-validator.github.io/gif_animations/demo.gif)


# Installation

- **[Chrome Extension](https://chrome.google.com/webstore/detail/style-validator/aaeahhnjkelemfcdmkcpaggdhfaffeod)**(In conjunction with Chrome DevTools)
- **[JavaScript Bookmarklet](http://style-validator.github.io/)**(Currently, supported only Google Chrome and Opera)


# Function

- Detecting problems of between CSS properties and HTML tags
- Detecting problems after JavaScript and Media Queries
- Detecting problems of Computed Style


# Why we need to detect `Risky Style`?

- Over 300 CSS properties (if include pattern of value... it's insane volume)
- Over 10,000 Browser types (including mobile)
- Other Front-end technology has evolved too much (We are so hard to develop...)

The Risky Style will cause**Unintended Behavior**in the browser such as layout breaking.

But we have no way to detect it. So,**Cross Browser CSS is too difficult**.


## Problems of Current CSS Validator

- Can not validate CSS after JavaScript and Media Queries
- Can not validate Computed Style (It can validate only syntax)
- Can not validate Adaptability of between CSS properties and HTML tags


## Risky CSS Property cause...

- Really Many Bugs&amp;Meaningless Patches :(
- Interrupting creative ideas :(
- Loss of valuable engineer’s life :(

Style Validator is solution that resolves these problems.


## Style Validator gives you...

- Reducing `tests`, `patches` and `costs`
- Keeping Engineer Creative Thinking
- Education of safety HTML/CSS

**CAUTION: Validation Rules is not based on the official specifications**


## Goal

Becoming Help for Web


# Introduction of a part of the Risky Style

If you want to view them all, see the [references page](http://style-validator.github.io/page/references.html)


## No parent table-cell

* **&#10007; NG**
```html
<div>
	<p style="display: table-cell;"></p>
</div>
```

* **&#10003; OK**
```html
<div style="display: table;">
	<p style="display: table-cell;"></p>
</div>
```

## No effect styles

### inline with size and margin

* **&#10007; NG**
```css
span {
	width: 300px;/* no effect */
	height: 300px;/* no effect */
	margin-top: 30px; /* no effect */
	margin-bottom: 30px; /* no effect */
}
```

* **&#10003; OK**
```css
span {
	margin-right: 30px; /* effect */
	margin-left: 30px; /* effect */
}
```

### table-row &amp; table-*-group with margin(padding)

* **&#10007; NG**
```css
thead,
tbody,
tfoot,
tr {
	margin: 30px; /* no effect */
	padding: 20px; /* no effect */
}
```

### table with padding

* **&#10007; NG**
```css
div {
	display: table;
	border-collapse: collapse;
	padding: 30px; /* no effect if collapse */
}
```

## pseudo element into empty element

* **&#10007; NG**
```html
<img src="hoge.jpg" />
```
```css
img::after {
	content: url(fuga.jpg); /* no effect but risky */
}
```

## Mistake in Media Query

Here is base code
```html
<div class="parent">
	<p class="child"></p>
</div>
```
```css
.parent	{ display: table; }
.child	{ display: table-cell; }
```
* **&#10007; NG**
```css
@media (max-width: 640px) {
	.parent { display: block; } /* .child is no parent table-cell */
}
```
* **&#10003; OK**
```css
@media (max-width: 640px) {
	.parent	{ display: block; }
	.child	{ display: block; }
}
```

## Mistake after JavaScript

Here is base code
```html
<div class="parent">
	<p class="child"></p>
</div>
```
```css
.parent	{ display: table; }
.child	{ display: table-cell; }
```

* **&#10007; NG**
```js
var parent = document.querySelector('.parent');
var newChild = document.createelement('div');
newChild.style.display = "inline";//mistake
parent.appendChild(newChild);
```
```html
<div class="parent">
	<p class="child"></p>
	<div style="display: inline;"></div><!-- mistake -->
</div>
```

* **&#10003; OK**
```js
var parent = document.querySelector('.parent');
var newChild = document.createelement('div');
newChild.style.display = "table-cell";//correct
parent.appendChild(newChild);
```
```html
<div class="parent">
	<p class="child"></p>
	<div style="display: table-cell;"></div><!-- correct -->
</div>
```

# Open source project

Dear Web Engineers,

Please feel free to send me any feedback and Pull requests.
If you need, check it out the document for developer.

## Contributing

1. Fork it
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create new Pull Request

## Only Validation Rules

You can edit from [web page](http://style-validator.github.io/page/rules.html)
