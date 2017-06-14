# Apiary

![Logo](https://w3c.github.io/apiary/logo.svg)

Apiary is a simple JavaScript library to leverage the W3C API.
This library is intended to be used from W3C pages: group pages, personal pages, etc.
With Apiary, you can inject data that is retrieved using the W3C API, in a declarative way using *placeholders*.
Examples are also provided.

Refer to [the W3C API](https://github.com/w3c/w3c-api) and its documentation for details
\[[overview](https://w3c.github.io/w3c-api/); [reference](https://api.w3.org/doc)\].

## Live examples

* [Group page](https://w3c.github.io/apiary/examples/group.html)
* [User page](https://w3c.github.io/apiary/examples/user.html)

## Getting started

### Include the library

Include [Apiary](apiary.js) in your page:  
```html
<script src="//w3c.github.io/apiary/apiary.js"></script>
```

### Add your API key

Specify your W3C API key, adding a `data-apiary-key` attribute to the HTML element, eg:  
```html
<html data-apiary-key="abc123def456">
```
(You can get an API key very easily; refer to [the documentation](https://w3c.github.io/w3c-api/#apikeys).
The examples provided here work with a public API key that is registered to test Apiary only; don't try to use it elsewhere.)

### Specify an entity ID

Specify the ID of the *entity* you want, adding a `data-apiary-*` attribute to a container element, eg:  
```html
<main data-apiary-group="68239">
```

### Add placeholders

Finally, add *placeholders* wherever you want real data about that *entity*, eg:  
```html
The chairs of this group are: <span data-apiary="chairs"></span>.
```

## Reference

The container element should have *one* of these *data-apiary-&#42;* attributes, and its value should be a valid ID:
* `data-apiary-group`
* `data-apiary-user` (use [the **user hash**](https://api.w3.org/doc#get--users-%7Bhash%7D))

A placeholder is any element with a `data-apiary` attribute.
Bear in mind that a new chunk of DOM will be inserted there; whatever that placeholder contains will be lost.
We recommend that you have something in there giving users a hint that data is being loaded dynamically.
For example:
```html
<div data-apiary="chairs">[Loading…]</div>
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

Copyright © 2015&ndash;2017 [World Wide Web Consortium](http://www.w3.org/)

This project is licensed [under the terms of the MIT license](LICENSE.md).
