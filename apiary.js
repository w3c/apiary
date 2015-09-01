
'use strict';

(function() {

  // Pseudo-constants:
  var VERSION            = '0.3.0';
  var BASE_URL           = 'https://api-test.w3.org/';
  var APIARY_PLACEHOLDER = /[\^\ ]apiary-([^\ ]+)/g;
  var APIARY_SELECTOR    = '[class^="apiary"]';
  var TYPE_DOMAIN_PAGE   = 1;
  var TYPE_GROUP_PAGE    = 2;
  var TYPE_USER_PAGE     = 3;
  var PHOTO_VALUE        = {
    large:     2,
    thumbnail: 1,
    tiny:      0
  };

  // “Global” variables:
  var apiKey;
  var type;
  var id;
  var placeholders = {};
  var cache        = {};

  /**
   * Main function.
   *
   * @TODO: document.
   */

  var process = function() {
    inferTypeAndId();
    if (apiKey && type && id) {
      findPlaceholders();
      getDataForType();
    } else {
      window.alert('Apiary ' + VERSION + '\n' +
        'ERROR: could not get all necessary metadata.\n' +
        'apiKey: “' + apiKey + '”\n' +
        'type: “' + type + '”\n' +
        'id: “' + id + '”');
    }
  };

  /**
   * Infer the type of page (domain, group…) and the ID of the corresponding entity; resolve API key.
   *
   * After this function is done, variables “apiKey”, “type” and “id” should have their right values set.
   */

  var inferTypeAndId = function() {
    if (1 === $('html[data-api-key]').length) {
      apiKey = $('html[data-api-key]').data('api-key');
    }
    if ($('[data-domain-id]').length > 0) {
      type = TYPE_DOMAIN_PAGE;
      id = $('[data-domain-id]').data('domain-id');
    } else if ($('[data-group-id]').length > 0) {
      type = TYPE_GROUP_PAGE;
      id = $('[data-group-id]').data('group-id');
    } else if ($('[data-user-id]').length > 0) {
      type = TYPE_USER_PAGE;
      id = $('[data-user-id]').data('user-id');
    }
  };

  /**
   * Traverse the DOM in search of all elements with class “apiary-*”.
   *
   * After this function is done, “placeholders” should be an object containing all keys found in the DOM;
   * and for every key, an array of all elements mentioning that key.
   * For example:
   * {
   *   name: [
   *     <title> element,
   *     <h1> element
   *   ],
   *   lead: [<div> element],
   *   groups: [<div> element]
   * }
   */

  var findPlaceholders = function() {
    var candidates = $(APIARY_SELECTOR);
    var cand, match;
    for (var c = 0; c < candidates.length; c ++) {
      cand = $(candidates[c]);
      match = APIARY_PLACEHOLDER.exec(cand.attr('class'));
      while (match) {
        if (!placeholders[match[1]]) {
          placeholders[match[1]] = [];
        }
        placeholders[match[1]].push(cand);
        match = APIARY_PLACEHOLDER.exec(cand.attr('class'));
      }
    }
  };

  /**
   * Get basic data for a particular entity from the W3C API, given a type of item and its value.
   *
   * @TODO: document.
   */

  var getDataForType = function() {
    if (Object.keys(placeholders).length > 0) {
      if (TYPE_DOMAIN_PAGE === type) {
        get(BASE_URL + 'domains/' + id, crawl);
      } else if (TYPE_GROUP_PAGE === type) {
        get(BASE_URL + 'groups/' + id, crawl);
      } else if (TYPE_USER_PAGE === type) {
        get(BASE_URL + 'users/' + id, crawl);
      }
    }
  };

  /**
   * @TODO: document.
   */

  var crawl = function(json) {
    var i, keys, key, prefix, rest;
    keys = Object.keys(placeholders);
    for (key in keys) {
      i = keys[key];
      if (json.hasOwnProperty(i)) {
        if (1 === Object.keys(json[i]).length && json[i].hasOwnProperty('href')) {
          get(json[i].href, crawl);
        } else {
          injectValues(i, json[i]);
        }
      } else if (i.indexOf('-') > -1) {
        prefix = i.substr(0, i.indexOf('-'));
        rest = i.substr(i.indexOf('-') + 1);
        Object.defineProperty(placeholders, rest, Object.getOwnPropertyDescriptor(placeholders, i));
        delete placeholders[i];
        crawl(json[prefix]);
      }
    }
  };

  /**
   * Inject values retrieved from the API into the relevant elements of the DOM.
   *
   * @TODO: document.
   */

  var injectValues = function(key, value) {
    var chunk;
    if ('string' === typeof value || 'number' === typeof value) {
      chunk = String(value);
    } else if (value instanceof Array) {
      chunk = getLargestPhoto(value);
      if (!chunk) {
        chunk = '<ul>';
        for (var i = 0; i < value.length; i ++) {
          if (value[i].hasOwnProperty('name')) {
            chunk += '<li>' + value[i].name + '</li>';
          } else if (value[i].hasOwnProperty('title')) {
            chunk += '<li>' + value[i].title + '</li>';
          }
        }
        chunk += '</ul>';
      }
    } else if ('object' === typeof value) {
      if (value.hasOwnProperty('href')) {
        if (value.hasOwnProperty('name')) {
          chunk = '<a href="' + value.href + '">' + value.name + '</a>';
        }
      }
    }
    for (var i in placeholders[key]) {
      placeholders[key][i].html(chunk);
      placeholders[key][i].addClass('apiary-done');
    }
    delete placeholders[key];
  };

  /**
   * GET data from the API, using the API key, and return the flattened version.
   *
   * @param {String}   url      target URL, including base URL and parameters, but not an API key.
   * @param {Function} callback <code>function(json){}</code>
   */

  var get = function(url, callback) {
    var newUrl = url;
    if (-1 === newUrl.indexOf('?')) {
      newUrl += '?apikey=' + apiKey + '&embed=true';
    } else {
      newUrl += '&apikey=' + apiKey + '&embed=true';
    }
    if (cache.hasOwnProperty(newUrl)) {
      callback(cache[newUrl]);
    } else {
      $.get(newUrl, function(result) {
        var i, j;
        for (i in {'_links': true, '_embedded': true}) {
          if (result.hasOwnProperty(i)) {
            for (j in result[i]) {
              if (result[i].hasOwnProperty(j)) {
                result[j] = result[i][j];
              }
            }
            delete result[i];
          }
        }
        cache[newUrl] = result;
        callback(result);
      });
    }
  };

  /**
   * Find the largest photo available from an array of them, and return an IMG element.
   *
   * @TODO: document.
   */

  var getLargestPhoto = function(data) {
    var largest, result;
    if (data && data.length > 0) {
      for (var i = 0; i < data.length; i ++) {
        if (data[i].href && data[i].name && (!largest || PHOTO_VALUE[data[i].name] > PHOTO_VALUE[largest.name])) {
          largest = data[i];
        }
      }
      if (largest) {
        result = '<img alt="Portrait" src="' + largest.href + '">';
      }
    }
    return result;
  };

  // Process stuff!
  $(document).ready(process);

})();

