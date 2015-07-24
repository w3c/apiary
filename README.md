
# Apiary

*Nice little JS libraries sprout here.*

This is a collection of small JavaScript libraries or utilities leveraging the W3C API.
These JS modules are intended to be used from W3C pages: domain pages, group pages, personal pages, etc.
Examples of use are also included.

Refer to [the W3C API](https://github.com/w3c/w3c-api) and [its documentation](https://api-test.w3.org/doc) for details.

## Live examples

* [Simple *domain page*](https://w3c.github.io/apiary/domain.html)
* [Simple *group page*](https://w3c.github.io/apiary/group.html)
* Simple *personal page* [pending]

## Getting started

First, include [jQuery](http://jquery.com/) and [our script](scripts/domain-or-group-info.js) in your page:
```html
<script src="//www.w3.org/scripts/jquery/2.1.4/jquery.min"></script>
<script src="//w3c.github.io/apiary/scripts/domain-or-group-info.js"></script>
```

Then, make sure you specify the ID of the *entity* you want, adding a *data-&#42;* attribute to the `html` element, eg:  
```html
<html data-domain-id="41381">
```

Finally, write *placeholders* wherever you'll need real data about that *entity*, eg:  
```html
The lead of this domain is: <span class="w3capi w3capi-lead"></span>.
```

## Reference

The `html` element should have *one* of these two *data-&#42;* attributes, and its value should be a valid ID:
* `data-domain-id`
* `data-group-id`

A placeholder is any element with a class beginning with `w3capi-`.
Bear in mind that a new chunk of DOM will be inserted there; whatever that placeholder contains will be lost.
We recommend that you have something in there giving users a hint that data is being loaded dynamically.
For example:
```html
<div class="w3capi w3capi-chairs">[Loading…]</div>
```

For consistency (and to adhere to the [POLA](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)),
the suffix part of these placeholders is equal to [the object keys returned by the API](https://api-test.w3.org/doc).

These are all the supported placeholders:

Placeholder          | Applies to      | Generated content
:--------------------|:----------------|:-----------------
`w3capi-name`        | domains, groups | text
`w3capi-lead`        | domains         | text
`w3capi-activities`  | domains         | `<ul>`
`w3capi-type`        | groups          | text
`w3capi-description` | groups          | text
`w3capi-chairs`      | groups          | `<ul>`

The class `w3capi` isn't used by the JS libraries themselves, but we recommended you add anyway it to all placeholders for easier CSS styling.

## Credits

Copyright © 2015 [World Wide Web Consortium](http://www.w3.org/)

This project is licensed [under the terms of the MIT license](LICENSE.md).

