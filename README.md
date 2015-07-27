
# Apiary

![Logo](https://w3c.github.io/apiary/logo.svg)

Apiary is a simple JavaScript library to leverage the W3C API.
This library is intended to be used from W3C pages: domain pages, group pages, personal pages, etc.
With Apiary, you can inject data that is retrieved using the W3C API, in a declarative way using *placeholders*.
Examples are also provided.

Refer to [the W3C API](https://github.com/w3c/w3c-api) and [its documentation](https://api-test.w3.org/doc) for details.

## Live examples

* [Simple *domain page*](https://w3c.github.io/apiary/examples/domain.html)
* [Simple *group page*](https://w3c.github.io/apiary/examples/group.html)
* [Simple *user page*](https://w3c.github.io/apiary/examples/user.html)

## Getting started

First, include [jQuery](http://jquery.com/) and [Apiary](apiary.js) in your page:
```html
<script src="//www.w3.org/scripts/jquery/2.1.4/jquery.min"></script>
<script src="//w3c.github.io/apiary/apiary.js"></script>
```

Then, make sure you specify the ID of the *entity* you want, adding a *data-&#42;* attribute to the `html` element, eg:  
```html
<html data-domain-id="41381">
```

Finally, write *placeholders* wherever you want real data about that *entity*, eg:  
```html
The lead of this domain is: <span class="apiary apiary-lead"></span>.
```

## Reference

The `html` element should have *one* of these *data-&#42;* attributes, and its value should be a valid ID:
* `data-domain-id`
* `data-group-id`
* `data-user-id` (use [the user hash](https://api-test.w3.org/doc#get--users-{hash}))

A placeholder is any element with a class beginning with `apiary-`.
Bear in mind that a new chunk of DOM will be inserted there; whatever that placeholder contains will be lost.
We recommend that you have something in there giving users a hint that data is being loaded dynamically.
For example:
```html
<div class="apiary apiary-chairs">[Loading…]</div>
```

For consistency (and to adhere to the [POLA](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)),
the suffix part of these placeholders is equal to [the object keys returned by the API](https://api-test.w3.org/doc).

These are all the supported placeholders now:

Placeholder             | Applies to             | Generated content
:-----------------------|:-----------------------|:-----------------
`apiary-activities`     | domains                | `<ul>`
`apiary-chairs`         | groups                 | `<ul>`
`apiary-description`    | groups                 | text
`apiary-family`         | users                  | text
`apiary-given`          | users                  | text
`apiary-lead`           | domains                | text
`apiary-name`           | domains, groups, users | text
`apiary-photo` ¹        | users                  | `<img>`
`apiary-specifications` | users                  | `<ul>`
`apiary-type`           | groups                 | text

¹ Largest size returned by the API, if there are several.

The additional class `apiary` is ignored by Apiary itself, but we recommended you add anyway it to all placeholders in your documents, for easier CSS styling.

## Credits

Copyright © 2015 [World Wide Web Consortium](http://www.w3.org/)

This project is licensed [under the terms of the MIT license](LICENSE.md).

