# To start develop

#### 1. git clone

```
git clone https://github.com/Style-Validator/Style-Validator.git
```

#### 2. npm Install

```
npm install
```

#### 3. import directory to chrome

![](../img/extension-import.png)


# How to add new rule

#### 1. gulp

```
node app.js
```

#### 2. access edit page via web server

http://localhost:8001/extension/options.html


#### 3. add new rule and save

![](../img/edit-page.png)


# Format of Style Rules

## Format

```json
[
  {
    "base-styles": {
    },
    "error-style": {
    },
    "warning-style": {
    },
    "parent-error-style": {
    },
    "parent-warning-style": {
    },
    "psuedo-before-error-style": {
    },
    "psuedo-before-warning-style": {
    },
    "psuedo-after-error-style": {
    },
    "psuedo-after-warning-style": {
    },
	"referenceURL": "https://developer.mozilla.org/en/docs/Web/CSS/float",
	"message": "here is error message"
  }
]
```

## Basic Pattern

### Base Style and Warning Styles

```json
[
  {
    "base-styles": {
      "display": "inline"
    },
    "warning-style": {
      "margin-top": "!0",//same with "non-0"
      "margin-bottom": "non-0"//same with !0
    }
  }
]
```

### Simplest Pattern

```json
[
  {
    "error-style": {//warning-style is another pattern
      "z-index": "under-0"
    }
  }
]
```


## Feature

### Base Rules is AND search

```json
[
  {
    "base-styles": {
      //AND
      "display": "table",
      "border-collapse": "collapse"
    },
    "error-style": {
      "padding": "over-0"
    }
  }
]
```
### Error or Warning Styles is OR search

```json
[
  {
    "base-styles": {
      "float": "!left"
    },
    "warning-style": {
      "margin-top": "!0",//same with "non-0"
      "margin-bottom": "non-0"//same with !0
    }
  }
]
```

### "default" keyword can be used (Not CSS Value, Original Value)

```json
[
  {
    "base-styles": {
      //Not User Agent Style sheet
      "float": "!default"//same with "non-default"
    },
    "warning-style": [
      //User Agent Style sheet
      { "margin-top": "default" }
    ]
  }
]
```

### "OR operator ||" can be used in the value

```json
[
  {
    "base-styles": {
      "float": "left||right"//OR
    },
    "warning-style":  {
      "margin-top": "non-0"
    }
  }
]
```


#### Otherwise, to be Array the value is same.

```json
[
  {
    "base-styles": {
      "float": ["left", "right"]//OR
    },
    "warning-style":  {
      "margin-top": "non-0"
    }
  }
]
```

## Original value keyword

### not default (detect not defining)

```json
"error-styles" {
  "float": "!default"
}

"error-styles" {
  "float": "non-default"
}
```

### not 0

```json
"error-styles" {
  "margin-top": "!0"
}

"error-styles" {
  "margin-top": "non-0"
}
```
### over 0

```json
"error-styles" {
  "padding-top": "over-0"
}
```
### under 0

```json
"error-styles" {
  "padding-top": "under-0"
}
```

## Bad Pattern

### Only Base Style

```json
[
  {
    "base-styles": {
      "display": "block"
    }
  }
]
```
