
'use strict';

(function() {

  // Pseudo-constants:
  var VERSION             = '0.1.2';
  var BASE_URL            = 'https://api-test.w3.org/';
  var APIARY_PLACEHOLDER  = /[\^\ ]apiary-([^\ ]+)/g;
  var TYPE_DOMAIN_PAGE    = 1;
  var TYPE_GROUP_PAGE     = 2;
  var TYPE_USER_PAGE      = 3;
  var TYPE_ACTIVITIES     = 4;
  var TYPE_CHAIRS         = 5;
  var TYPE_SPECIFICATIONS = 6;

  // “Global” variables:
  var apiKey;
  var type;
  var id;
  var placeholders = {};
  var data         = {};

  /**
   * Main function.
   *
   * I know everything you need to know, baby.
   */

  $(document).ready(function() {

    inferTypeAndId();

    if (apiKey && type && id) {
      findPlaceholders();
      getDataForType(type, id, injectValues);
    } else {
      window.alert('Apiary ' + VERSION + '\n' +
        'ERROR: could not get all necessary metadata.\n' +
        'apiKey: “' + apiKey + '”\n' +
        'type: “' + type + '”\n' +
        'id: “' + id + '”');
    }

  });

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
   * Get basic data for a particular entity from the W3C API, given a type of item and its value.
   *
   * @param {TYPE}     item     type of entity, eg TYPE_DOMAIN_PAGE
   * @param {Object}   value    ID of the entity, eg “1234”
   * @param {Function} callback eg injectValues
   */

  var getDataForType = function(item, value, callback) {
    if (Object.keys(placeholders).length > 0) {
      if (TYPE_DOMAIN_PAGE === item) {
        get(BASE_URL + 'domains/' + value, function(json) {
          data.name = json.name;
          data.lead = json._links.lead.title;
          if (placeholders.activities) {
            digDownData(TYPE_ACTIVITIES, json._links.activities.href, callback);
          } else if (callback) {
            callback.call();
          }
        });
      } else if (TYPE_GROUP_PAGE === item) {
        get(BASE_URL + 'groups/' + value, function(json) {
          data.name = json.name;
          data.type = json.type;
          data.description = json.description;
          if (placeholders.chairs) {
            digDownData(TYPE_CHAIRS, json._links.chairs.href, callback);
          } else if (callback) {
            callback.call();
          }
        });
      } else if (TYPE_USER_PAGE === item) {
        get(BASE_URL + 'users/' + value, function(json) {
          data.name = json.name;
          data.family = json.family;
          data.given = json.given;
          data.photo = '<img alt="Photo of ' + data.name + '" src="' + getLargestPhotoUrl(json._links.photos) + '">';
          if (placeholders.specifications) {
            digDownData(TYPE_SPECIFICATIONS, json._links.specifications.href, callback);
          } else if (callback) {
            callback.call();
          }
        });
      } else {
        if (callback) {
          callback.call();
        }
      }
    } else {
      if (callback) {
        callback.call();
      }
    }
  };

  /**
   * Get data recursively, given a URL and the type of data.
   *
   * @param {TYPE}     item     eg TYPE_ACTIVITIES
   * @param {String}   url      eg “https://api-test.w3.org/domains/109/activities”
   * @param {Function} callback eg injectValues
   */

  var digDownData = function(item, url, callback) {
    var list, i;
    get(url, function(json) {
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
  };

  /**
   * Inject values retrieved from the API into the relevant elements of the DOM.
   * While dynamically writing content, set aria-busy attribute to “true” for screen-readers.
   */

  var injectValues = function() {
    var live = $('[aria-live]');
    if (live) {
      live.attr('aria-busy', 'true');
    }
    for (var i in placeholders) {
      if (placeholders.hasOwnProperty(i)) {
        for (var j in placeholders[i]) {
          placeholders[i][j].html(data[i]);
        }
      }
    }
    if (live) {
      live.attr('aria-busy', 'false');
    }
  };

  /**
   * Find the largest photo available from an array of them.
   *
   * @param {String}   url      target URL, including base URL and parameters, but not an API key.
   * @param {Function} callback <code>function(json){}</code>
   */

  var get = function(url, callback) {

    $.ajax({
      headers: {'Authorization': 'W3C-API apikey="' + apiKey + '"'},
      url:     url,
      success: callback
    });

  };

  /**
   * Find the largest photo available from an array of them.
   *
   * @param {Array} photos eg, [{name: 'large', href: 'size-L.jpg'}, {name: 'medium', href: 'size-M.jpg'}]
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

})();

