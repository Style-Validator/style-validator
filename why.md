Why we need to detect `Risky Style`?
============================

# Too complicated CSS

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

