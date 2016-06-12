A part of introduction for `Risky Style`
============================

# Static Risky Style

If you want to view them all, see the [rules page](http://style-validator.io/extension/options.html)

## No parent table-cell

* **&#10007; NG**
Parent that should be table is none
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

## Inline with size and margin

* **&#10007; NG**
Non-effective styles
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

## Pseudo element in Empty element

* **&#10007; NG**
Risky. Because old some browser may render this...
```html
<img src="hoge.jpg" />
```
```css
img::after {
	content: url(fuga.jpg); /* no effect but risky */
}
```

# Dynamic Risky Style

## Mistake in Media Query

Here is base code
```css
.parent	{ display: table; }
.child	{ display: table-cell; }
```
```html
<div class="parent">
	<p class="child"></p>
</div>
```

### When width of viewport is less than 640px

* **&#10007; NG**
```css
@media (max-width: 640px) {
	.parent { display: block; } /* .child is no parent table-cell */
}
```
```html
<div class="parent"><!-- block!!! -->
	<p class="child"></p><!-- table-cell -->
</div>
```

* **&#10003; OK**
```css
@media (max-width: 640px) {
	.parent,
  .child	{ display: block; }
}
```
```html
<div class="parent"><!-- table -->
	<p class="child"></p><!-- table-cell -->
</div>
```

## Mistake after JavaScript

Here is base code
```css
.parent	{ display: table; }
.child	{ display: table-cell; }
```
```html
<div class="parent">
	<p class="child"></p>
</div>
```

### When JavaScript is executed

* **&#10007; NG**
Insert inline element into table element
```js
var parent = document.querySelector('.parent');
var newChild = document.createElement('div');
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
To fix, convert inline to table-cell.
```js
var parent = document.querySelector('.parent');
var newChild = document.createElement('div');
newChild.style.display = "table-cell";//correct
parent.appendChild(newChild);
```
```html
<div class="parent">
	<p class="child"></p>
	<div style="display: table-cell;"></div><!-- correct -->
</div>
```
