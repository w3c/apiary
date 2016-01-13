# Apiary

![Logo](https://w3c.github.io/apiary/logo.svg)

Apiary is a simple JavaScript library to leverage the W3C API.
This library is intended to be used from W3C pages: domain pages, group pages, personal pages, etc.
With Apiary, you can inject data that is retrieved using the W3C API, in a declarative way using *placeholders*.
Examples are also provided.

Refer to [the W3C API](https://github.com/w3c/w3c-api) and its documentation for details
\[[overview](https://w3c.github.io/w3c-api/); [reference](https://api.w3.org/doc)\].

## Live examples

* [Domain page](https://w3c.github.io/apiary/examples/domain.html)
* [Group page](https://w3c.github.io/apiary/examples/group.html)
* [User page](https://w3c.github.io/apiary/examples/user.html)

## Getting started

### Include the dependencies

Include [jQuery](http://jquery.com/) and [Apiary](apiary.js) in your page:  
```html
<script src="//www.w3.org/scripts/jquery/2.1/jquery.min"></script>
<script src="//w3c.github.io/apiary/apiary.js"></script>
```

### Add your API key

Specify your W3C API key, adding a *data-api-key* attribute to the HTML element, eg:  
```html
<html data-api-key="abc123def456">
```
(You can get an API key very easily; refer to [the documentation](https://w3c.github.io/w3c-api/#apikeys).
The examples provided here work with a public API key that is registered to test Apiary only; don't try to use it elsewhere.)

### Specify an entity ID

Specify the ID of the *entity* you want, adding a *data-&#42;* attribute to a container element, eg:  
```html
<main data-domain-id="41381">
```

### Add placeholders

Finally, add *placeholders* wherever you want real data about that *entity*, eg:  
```html
The lead of this domain is: <span class="apiary-lead"></span>.
```

## Reference

The container element should have *one* of these *data-&#42;* attributes, and its value should be a valid ID:
* `data-domain-id`
* `data-group-id`
* `data-user-id` (use [the **user hash**](https://api.w3.org/doc#get--users-%7Bhash%7D))

A placeholder is any element with a class beginning with `apiary-`.
Bear in mind that a new chunk of DOM will be inserted there; whatever that placeholder contains will be lost.
We recommend that you have something in there giving users a hint that data is being loaded dynamically.
For example:
```html
<div class="apiary-chairs">[Loading…]</div>
```

For consistency (and to adhere to the [POLA](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)),
the suffix part of these placeholders is equal to [the object keys returned by the API](https://api.w3.org/doc).

The additional class `apiary` in the example files is ignored by Apiary itself but you may wish to include it anyway to all placeholders in your documents for easier CSS styling.

## Hacking Apiary

Find the developer documentation [under `doc/`](https://w3c.github.io/apiary/doc/Apiary.html).

To regenerate the documentation:

```bash
$ sudo npm install -g jsdoc
$ jsdoc ./apiary.js --destination ./doc/ --access all --encoding utf8 --verbose
```

## Credits

Copyright © 2015 [World Wide Web Consortium](http://www.w3.org/)

This project is licensed [under the terms of the MIT license](LICENSE.md).
