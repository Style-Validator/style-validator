
Style Validator
============================

Style Validator is a new html/css validator that detect style problem for the html elements. And more, Style Validator observe DOM changed, for example, in case of inserted DOM by AJAX or User Action etc...

## Why?

1. There is no specification that indicates the adaptability of HTML tags and CSS. (So, There is no way to detect invalid CSS for the HTML element)
2. The invalid CSS property cause unintended behavior.(So, Cross Browser HTML/CSS is too difficult)
3. There is no specifications of matching rules of html elements and css property
4. Computed style is invisible (Difficulties in computedStyle)

### Did you know that properties to the display property forcibly change?

```css
div {
  position: absolute;
}
```
```html
<!-- This is NOT inline element -->
<div style="display: inline;"></div>
```
```js
var div = document.querySelector('div');
getComputedStyle(div).getPropertyValue('display');//block NOT inline
```

### In case of the Flexbox

```css
div {
  display: flex;
}
```
```html
<div>
  <!-- This is NOT inline element -->
  <p style="display: inline;"></p>
</div>
```
```js
var p = document.querySelector('p');
getComputedStyle(div).getPropertyValue('display');//block NOT inline
```


### Invalid CSS Property cause...

- REALLY MANY BUGS :(
- REALLY MANY LAZY PATCHES :(
- REALLY MANY TIME & MONEY :(

And...

These is not creative works.
These is interrupt creative thinking.

"Style Validator" is solution that resolves these problems.

### Style Valdator gives you...

- reducing costs of test and patch
- keeping engineer creative thinking
- education of html/css

CAUTION: Validation Rules is not based on the official specifications.

### Goal

- Aggregate the awesome knowledge of the work field
- Move forward the web


## Bad Example

### CSS

```css
tr {
  margin-top: 30px;/*Invalid for display: table-row;*/
}
div {
  display: table;
  padding: 30px;/*Invalid for display: table;*/
}
span {
  margin-bottom: 30px;/*Invalid for display: inline;*/
}
```

### HTML

```html
<div>
  <!-- No table parent -->
  <div style="display: table-cell;"></div>

  <!-- No flex parent -->
  <div style="display: flex-grow;"></div>
</div>
```

# Installation

#### Chrome Web Store (For Only Chrome)

Install From the following page.

- https://chrome.google.com/webstore/detail/style-validator-to-reduce/aaeahhnjkelemfcdmkcpaggdhfaffeod?authuser=1

#### Bookmarklet (For All Modern Browser)

Bookmark from the following page.

- https://style-validator.github.io/Style-Validator/


# Function

- Detecting problems between HTML and CSS
- Realtime Validation that can track DOM modification
  - That observe DOM changed, for example, in case of inserted DOM by AJAX or User Action etc...

## In case of Chrome Extension

- Validation in conjunction with Chrome DevTools.

## In case of Bookmarklet

- Available in most all modern browser.


# This is a open source project.

Feedback and pull requests are also welcome!

Check it out the document for developer.

https://github.com/igari/Style-Validator/tree/gh-pages/data
