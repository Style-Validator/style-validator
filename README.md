
Style Validator
============================

Style Validator is CSS Validator that can detect `Risky Style` might break layout, NOT syntax. In addition, it can validate after DOM Modifying (e.g. by AJAX or ANY EVENT CALLBACK).

# Why we need to detect `Risky Style`?

1. More than 300 CSS properties
2. More than 10,000 Browser types
3. Other Front-end technology has evolved too much

So, Cross Browser CSS is too difficult

## Problems of Current CSS Validator

1. Can not validate CSS after JavaScript and Media Queries
2. Can not validate Computed Style, it is only possible for syntax.
3. Can not validate Adaptability of between CSS properties and HTML tags

## Risky CSS Property cause...

1. REALLY MANY BUGS :(
2. REALLY MANY LAZY PATCHES :(
3. REALLY MANY TIME & MONEY :(

and...

These is not creative works.
These is interrupt creative thinking.

"Style Validator" is solution that resolves these problems.

## Style Validator gives you...

1. Reducing `tests`, `patches` and `costs`
2. Keeping Engineer Creative Thinking
3. Education of safety HTML/CSS

CAUTION: Validation Rules is not based on the official specifications.

## Goal

Becoming HELP of Web Engineers(=> Web)


# Installation

Chrome Extension
https://chrome.google.com/webstore/detail/style-validator-to-reduce/aaeahhnjkelemfcdmkcpaggdhfaffeod?authuser=1

JavaScript Bookmarklet
http://style-validator.github.io/

# Function

- Detecting problems between HTML and CSS
- Realtime Validation that can track DOM modification
- That observe DOM changed, for example, in case of inserted DOM by AJAX or User Action etc...
- Validation in conjunction with Chrome DevTools.(Chrome Extension only)


# Introduction of a part of the Risky Style

The Risky Style will cause unintended behavior in the browser such as layout breaking. But we have no way to detect it. So, Cross Browser HTML/CSS is too difficult)

## No parent table-cell

NG
```html
<div>
  <p style="display: table-cell;"></p>
</div>
```
OK
```html
<div style="display: table;">
  <p style="display: table-cell;"></p>
</div>
```
## Non effect styles

NG
```html
<span style="width: 300px;">this is inline element.</span>
```
```js
var span = document.querySelector('span');
getComputedStyle(span).getPropertyValue('width');// auto
```
This value is auto. So, width should be removed, or should change display property like the following.

```css
span { display: block };
```

### Another patterns

```css
tr {
  margin-top: 30px; /*Risky for display: table-row;*/
}
div {
  display: table;
  padding: 30px; /*Risky for display: table;*/
}
span {
  margin-bottom: 30px; /*Risky for display: inline;*/
}
```

## Pseudo element into empty element

NG
```html
<img src="hoge.jpg" />
```
```css
img::after {
  content: url(fuga.jpg);
}
```

## Mistake in Media Query

NG
```html
<div class="parent">
  <p class="child"></p>
</div>
```
```css
.parent { display: table; }
.child  { display: table-cell; }

@media (max-width: 640px) {
  .parent { display: block; }
}
```

OK
```css
@media (max-width: 640px) {
  .parent { display: block; }
  .child  { display: block; }
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
.parent { display: table; }
.child  { display: table-cell; }
```

NG
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

OK
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

Please feel free to send me any feedback and pull requests.
If you need, check it out the document for developer.

## Edit rules only

From web page (Needless to clone)
http://style-validator.github.io/page/rules.html

## Brush up Style Validator

1. Clone repository
```
git clone https://github.com/Style-Validator/style-validator.github.io.git
```
2. Send pull request
