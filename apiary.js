
'use strict';

(function() {

  // Pseudo-constants:
  var BASE_URL            = 'https://api-test.w3.org/';
  var APIARY_PLACEHOLDER  = /[\^\ ]apiary-([^\ ]+)/g;
  var TYPE_DOMAIN_PAGE    = 0;
  var TYPE_GROUP_PAGE     = 1;
  var TYPE_USER_PAGE      = 2;
  var TYPE_ACTIVITIES     = 3;
  var TYPE_CHAIRS         = 4;
  var TYPE_SPECIFICATIONS = 5;

  // "Global" variables:
  var type;
  var id;
  var placeholders = {};
  var data         = {};

  /**
   * Infer the type of page (domain, group…) and the ID of the corresponding entity.
   *
   * After this function is done, variables “type” and “id” should have their right values set.
   */

  var inferTypeAndId = function() {
    var html = $('html');
    if (html.data('domain-id')) {
      type = TYPE_DOMAIN_PAGE;
      id = html.data('domain-id');
    } else if (html.data('group-id')) {
      type = TYPE_GROUP_PAGE;
      id = html.data('group-id');
    } else if (html.data('user-id')) {
      type = TYPE_USER_PAGE;
      id = html.data('user-id');
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
   *   activities: [<div> element]
   * }
   */

  var findPlaceholders = function() {
    var candidates = $('[class^="apiary"]');
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
   * Get data from the W3C API recursively, given a type of item and its value, or a URL.
   *
   * @param {TYPE}     item,     eg TYPE_DOMAIN_PAGE
   * @param {Object}   value,    eg “1234”
   * @param {String}   url,      eg “https://api-test.w3.org/domains/109/activities”
   * @param {Function} callback, eg injectValues
   */

  var getData = function(item, value, url, callback) {
    var list, i;
    if (TYPE_DOMAIN_PAGE === item && Object.keys(placeholders).length > 0) {
      $.get(BASE_URL + 'domains/' + value, function(json) {
        data.name = json.name;
        data.lead = json._links.lead.title;
        if (placeholders.activities) {
          getData(TYPE_ACTIVITIES, null, json._links.activities.href, callback);
        } else if (callback) {
          callback.call();
        }
      });
    } else if (TYPE_GROUP_PAGE === item && Object.keys(placeholders).length > 0) {
      $.get(BASE_URL + 'groups/' + value, function(json) {
        data.name = json.name;
        data.type = json.type;
        data.description = json.description;
        if (placeholders.chairs) {
          getData(TYPE_CHAIRS, null, json._links.chairs.href, callback);
        } else if (callback) {
          callback.call();
        }
      });
    } else if (TYPE_USER_PAGE === item && Object.keys(placeholders).length > 0) {
      $.get(BASE_URL + 'users/' + value, function(json) {
        data.name = json.name;
        data.family = json.family;
        data.given = json.given;
        data.photo = '<img alt="Photo of ' + data.name + '" src="' + getLargestPhotoUrl(json._links.photos) + '">';
        if (placeholders.specifications) {
          getData(TYPE_SPECIFICATIONS, null, json._links.specifications.href, callback);
        } else if (callback) {
          callback.call();
        }
      });
    } else if (url) {
      $.get(url, function(json) {
        if (TYPE_ACTIVITIES === item) {
          list = '<ul>';
          for (i = 0; i < json._links.activities.length; i ++) {
            list += '<li>' + json._links.activities[i].title + '</li>';
          }
          list += '</ul>';
          data.activities = list;
        } else if (TYPE_CHAIRS === item) {
          list = '<ul>';
          for (i = 0; i < json._links.chairs.length; i ++) {
            list += '<li>' + json._links.chairs[i].title + '</li>';
          }
          list += '</ul>';
          data.chairs = list;
        } else if (TYPE_SPECIFICATIONS === item) {
          list = '<ul>';
          for (i = 0; i < json._links.specifications.length; i ++) {
            list += '<li>' + json._links.specifications[i].title + '</li>';
          }
          list += '</ul>';
          data.specifications = list;
        }
        if (callback) {
          callback.call();
        }
      });
    } else {
      if (callback) {
        callback.call();
      }
    }
  };

  /**
   * Inject values retrieved from the API into the relevant elements of the DOM.
   */

  var injectValues = function() {
    for (var i in placeholders) {
      if (placeholders.hasOwnProperty(i)) {
        for (var j in placeholders[i]) {
          placeholders[i][j].html(data[i]);
        }
      }
    }
  };

  /**
   * Find the largest photo available, for a user
   */

  var getLargestPhotoUrl = function(photos) {
    var VALUE = {large: 2, thumbnail: 1, tiny: 0};
    var result;
    for (var i = 0; i < photos.length; i ++) {
      if (!result || VALUE[photos[i].name] > VALUE[result.name]) {
        result = photos[i];
      }
    }
    return result.href;
  };

  /**
   * Main function.
   */

  $(document).ready(function() {

    inferTypeAndId();
    findPlaceholders();
    getData(type, id, null, injectValues);

  });

})();

