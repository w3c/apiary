'use strict';

/**
 * Simple JavaScript library to leverage the W3C API.
 *
 * @namespace Apiary
 */
(function(window) {

  // Pseudo-constants:
  var VERSION            = '2.0.2';
  var BASE_URL           = 'https://api.w3.org/';
  var USER_PROFILE_URL   = 'https://www.w3.org/users/';
  var APIARY_ATTRIBUTE   = 'data-apiary';
  var APIARY_SELECTOR    = `[${APIARY_ATTRIBUTE}]`;
  var TYPE_GROUP_PAGE    = 1;
  var TYPE_USER_PAGE     = 2;
  var MODE_DEBUG         = 'debug';
  var MODE_PRODUCTION    = 'production';
  var PHOTO_VALUE        = {
    large:     2,
    thumbnail: 1,
    tiny:      0
  };

  // “Global” variables:

  /**
   * API key, provided by the user.
   *
   * @alias apiKey
   * @memberOf Apiary
   */
  var apiKey;

  /**
   * Type of page; one of <code>TYPE_GROUP_PAGE</code> or <code>TYPE_USER_PAGE</code>.
   *
   * @alias type
   * @memberOf Apiary
   */
  var type;

  /**
   * ID of the entity being used on the page.
   *
   * @alias id
   * @memberOf Apiary
   */
  var id;

  /**
   * “Mode” (either “debug” or “production”; the latter by default).
   *
   * @alias mode
   * @memberOf Apiary
   */
  var mode = MODE_PRODUCTION;

  /**
   * Dictionary of placeholders found on the page, and all DOM elements associated to each one of them.
   *
   * @alias placeholders
   * @memberOf Apiary
   */
  var placeholders = {};

  /**
   * Simple cache of HTTP calls to the API, to avoid redundancy and save on requests.
   *
   * @alias cache
   * @memberOf Apiary
   */
  var cache = {};

  /**
   * Main function, invoked once after the document is completely loaded.
   *
   * @alias process
   * @memberOf Apiary
   */
  var process = function() {
    if (window.removeEventListener)
      window.removeEventListener('load', process);
    else if (window.detachEvent)
      window.detachEvent('onload', process);
    console.log(`Apiary version ${VERSION}`);
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
   * Infer the type of page (group, user…) and the ID of the corresponding entity; resolve API key.
   *
   * After this function is done, variables <code>apiKey</code>, <code>type</code> and <code>id</code> should have their right values set.
   *
   * @alias inferTypeAndId
   * @memberOf Apiary
   */
  var inferTypeAndId = function() {
    if (1 === document.querySelectorAll('html[data-apiary-key]').length) {
      apiKey = document.querySelectorAll('html[data-apiary-key]')[0].getAttribute('data-apiary-key');
    }
    if (document.querySelectorAll('[data-apiary-group]').length > 0) {
      type = TYPE_GROUP_PAGE;
      id = document.querySelectorAll('[data-apiary-group]')[0].getAttribute('data-apiary-group');
    } else if (document.querySelectorAll('[data-apiary-user]').length > 0) {
      type = TYPE_USER_PAGE;
      id = document.querySelectorAll('[data-apiary-user]')[0].getAttribute('data-apiary-user');
    }
    if (1 === document.querySelectorAll('html[data-apiary-mode]').length) {
      mode = document.querySelectorAll('html[data-apiary-mode]')[0].getAttribute('data-apiary-mode');
    }
  };

  /**
   * Traverse the DOM in search of all elements with class <code>apiary-*</code>.
   *
   * After this function is done, <code>placeholders</code> should be an object containing all keys found in the DOM;
   * and for every key, an array of all elements mentioning that key.
   *
   * @example
   * {
   *   name: [
   *     <title> element,
   *     <h1> element
   *   ],
   *   lead: [<div> element],
   *   groups: [<div> element]
   * }
   *
   * @alias findPlaceholders
   * @memberOf Apiary
   */
  var findPlaceholders = function() {
    var candidates = document.querySelectorAll(APIARY_SELECTOR);
    var expression;
    for (var c = 0; c < candidates.length; c ++) {
      expression = candidates[c].getAttribute(APIARY_ATTRIBUTE);
      if (!placeholders[expression])
        placeholders[expression] = [];
      placeholders[expression].push(candidates[c]);
    }
    if (MODE_DEBUG === mode)
      console.debug(`placeholders:\n${JSON.stringify(placeholders)}`);
  };

  /**
   * Get basic data for a particular entity from the W3C API, given a type of item and its value.
   *
   * @alias getDataForType
   * @memberOf Apiary
   */
  var getDataForType = function() {
    if (Object.keys(placeholders).length > 0) {
      if (TYPE_GROUP_PAGE === type) {
        get(BASE_URL + 'groups/' + id);
      } else if (TYPE_USER_PAGE === type) {
        get(BASE_URL + 'users/' + id);
      }
    }
  };

  /**
   * Crawl the API dynamically, traversing segments in placeholders.
   *
   * @param {Object} json JSON coming from an API call.
   *
   * @alias crawl
   * @memberOf Apiary
   */
  var crawl = function(json) {
    var i, keys, key, prefix, rest;
    keys = Object.keys(placeholders);
    for (key in keys) {
      i = keys[key];
      if (json.hasOwnProperty(i)) {
        if ('object' === typeof json[i] && 1 === Object.keys(json[i]).length && json[i].hasOwnProperty('href')) {
          get(json[i].href);
        } else {
          injectValues(i, json[i]);
        }
      } else if (i.indexOf(' ') > -1) {
        prefix = i.substr(0, i.indexOf(' '));
        rest = i.substr(i.indexOf(' ') + 1);
        if (MODE_DEBUG === mode)
          console.debug(i, prefix, rest);
        if (json.hasOwnProperty(prefix)) {
          if ('object' === typeof json[prefix] && 1 === Object.keys(json[prefix]).length && json[prefix].hasOwnProperty('href'))
            get(json[prefix].href);
          else
            injectValues(i, json[prefix], rest);
        }
      }
    }
  };

  var interpolateString = function(expression) {
    const expregex = /\$\{([^\}]+)\}/g;
    var exp, result = expression;
    while (exp = expregex.exec(expression))
      if (this.hasOwnProperty(exp[1]))
        result = result.replace(exp[0], this[exp[1]]);
    return result;
  };

  var escapeHTML = function(string) {
    const tags = /<[^>]*>/g,
      ampersands = /&/g,
      dquotes = /'/g,
      squotes = /"/g;
    return string.replace(tags, '').replace(ampersands, '&amp;').replace(dquotes, '&quot;').replace(squotes, '&#39;');
  };

  var formatEntity = function(entity, expression) {
    var result;
    // @TODO: get rid of these special checks when there's a smarter algorithm for hyperlinks.
    if (expression) {
      result = '<li>' + interpolateString.call(entity, expression) + '</li>';
    } else if (entity.hasOwnProperty('_links') && entity._links.hasOwnProperty('homepage') &&
      entity._links.homepage.hasOwnProperty('href') && entity.hasOwnProperty('name')) {
      // It's a group.
      result = '<li><a href="' + entity._links.homepage.href + '">' + entity.name + '</a></li>';
    } else if (entity.hasOwnProperty('discr') && 'user' === entity.discr &&
      entity.hasOwnProperty('id') && entity.hasOwnProperty('name')) {
      // It's a user.
      result = '<li><a href="' + USER_PROFILE_URL + entity.id + '">' + (entity['work-title'] ? entity['work-title'] + ' ' : '') + entity.name + '</a></li>';
    } else if (entity.hasOwnProperty('shortlink') && entity.hasOwnProperty('title')) {
      // Spec:
      result = '<li><a href="' + entity.shortlink;
      result += (entity.description ? '" title="' + escapeHTML(entity.description) : '');
      result += '">' + entity.title;
      result += (entity.shortname ? ' (<code>' + entity.shortname + '</code>)' : '');
      result += '</a></li>';
    } else if (entity.hasOwnProperty('name')) {
      result = '<li>' + entity.name + '</li>';
    } else if (entity.hasOwnProperty('title')) {
      result = '<li>' + entity.title + '</li>';
    } else if (entity.hasOwnProperty('href') && entity.hasOwnProperty('title')) {
      result = '<li><a href="' + entity.href + '">' + entity.title + '</a></li>';
    } else if (entity.hasOwnProperty('href') && entity.hasOwnProperty('name')) {
      result = '<a href="' + entity.href + '">' + entity.name + '</a>';
    }
    return result;
  };

  /*
   * Function: discr="function", name, staging, is-closed, _links.{lead.title, homepage.href?}.
   * User: discr="user", family, given, id, name, work-title?, _links.self.href.
   * Participation: created, individual, _links.(group.(href, title), self.href, user.(href, title)?, organization.(href, title)?).
   * Group: discr="w3cgroup", description, id, name, type.
   * Affiliation: discr="affiliation"|"organization", id, name.
   * Spec: shortname, title, description?.
   * Version: {_embedded.versions}[date, status, _links.self.href].
   * Service: link, type, shortdesc?.
   * Charter: start, end, initial-end.
   *
   * f=all: functions.
   * g=all: groups.
   * s=all: specs.
   * a=all: affiliations.
   * f=6823109: users, services.
   * g=68239: users x 3, services, specs, charters, participations.
   * g=46300&c=155: (none).
   * s=dwbp: versions.
   * s=2dcontext&v=20110525: groups, users, versions x 2.
   * u=ggdj8tciu9kwwc4o4ww888ggkwok0c8: participations, groups, specs, affiliations.
   * x=1913: groups.
   * p=1503: users.
   * a=52794: users, groups.
   */

  /**
   * @TODO
   */

  var renderItem = function(entity, type) {
      if (!entity)
          return window.alert('Error: tried to render an undefined item')
      var result;
      if ('function' === entity.discr) {
          // Function:
          result = `<li class="list-group-item">
              <a href="${buildLink(entity._links.self.href)}">
                  ${entity.name}<span class="suffix">, led by ${entity._links.lead.title}</span>
              </a>
          </li>`;
      } else if ('user' === entity.discr) {
          // User:
          var prefix = entity['work-title'] ? `<span class="suffix">, ${entity['work-title']}` : '';
          result = `<li class="list-group-item">\
              <a href="${buildLink(entity._links.self.href)}">\
                  ${entity.name}${prefix}\
              </a>\
          </li>`;
      } else if (entity.hasOwnProperty('created') && entity.hasOwnProperty('individual')) {
          // Participation:
          var label;
          if (TYPE_GROUP === type) {
              // We're interested in organisations and users:
              if (entity.individual)
                  // Person:
                  label = `${entity._links.user.title} <span class="suffix">(individual)</span>`;
              else
                  // Organisation:
                  label = `${entity._links.organization.title} <span class="suffix">(organization)</span>`;
          } else
              // TYPE_USER === type || TYPE_AFFILIATION === type; we're interested in groups:
              label = entity._links.group.title;
          result = `<li class="list-group-item">\
              <a href="${buildLink(entity._links.self.href)}">\
                  ${label}\
              </a>\
          </li>`;
      } else if ('w3cgroup' === entity.discr) {
          // Group:
          var descr = entity.description ? ` title="${escapeHTML(entity.description)}"` : '',
              type = '';
          result = `<li class="list-group-item">\
              <a${descr} href="${buildLink(entity.id, 'group')}">\
                  ${entity.name}${type}\
              </a>\
          </li>`;
      } else if (entity.hasOwnProperty('discr') && ('affiliation' === entity.discr || 'organization' === entity.discr)) {
          // Affiliation:
          result = `<li class="list-group-item">\
              <a href="${buildLink(entity.id, 'affiliation')}">\
                  ${entity.name}\
              </a>\
          </li>`;
      } else if (entity.hasOwnProperty('shortname') && entity.hasOwnProperty('title')) {
          // Spec:
          var descr = entity.description ? ` title="${escapeHTML(entity.description)}"` : '';
          result = `<li class="list-group-item">\
              <a${descr} href="${buildLink(entity.shortname, 'spec')}">\
                  ${entity.title} <span class="suffix">(<code>${entity.shortname}</code>)</suffix>\
              </a>\
          </li>`;
      } else if (entity.hasOwnProperty('date') && entity.hasOwnProperty('status')) {
          // Version:
          result = `<li class="list-group-item">\
              <a href="${buildLink(entity._links.self.href)}">\
                  ${entity.date} <span class="suffix">(${entity.status})</suffix>\
              </a>\
          </li>`;
      } else if (entity.hasOwnProperty('link') && entity.hasOwnProperty('type')) {
          // Service:
          if ('lists' === entity.type && entity.hasOwnProperty('shortdesc')) {
              // Mailing list:
              result = `<li class="list-group-item">
                  <a href="${buildLink(entity._links.self.href)}">
                      <code>${entity.shortdesc}</code>
                      <span class="suffix">(mailing list)</span>
                  </a>
              </li>`;
          } else if ('blog' === entity.type && entity.hasOwnProperty('shortdesc')) {
              // Blog:
              result = `<li class="list-group-item">
                  <a href="${buildLink(entity._links.self.href)}">
                      ${entity.shortdesc}
                      <span class="suffix">(blog)</span>
                  </a>
              </li>`;
          } else if ('tracker' === entity.type || 'repository' === entity.type || 'wiki' === entity.type || 'chat' === entity.type) {
              // Tracker, repo, wiki or chat:
              result = `<li class="list-group-item">
                  <a href="${buildLink(entity._links.self.href)}">
                      <code>${normaliseURI(entity.link)}</code>
                      <span class="suffix">(${entity.type})</span>
                  </a>
              </li>`;
          } else if ('rss' === entity.type) {
              // RSS:
              result = `<li class="list-group-item">
                  <a href="${buildLink(entity._links.self.href)}">
                      <code>${normaliseURI(entity.link)}</code>
                      <span class="suffix">(RSS)</span>
                  </a>
              </li>`;
          } else {
              result = `<li class="list-group-item">[Unknown type of service]</li>\n`;
          }
      } else if (entity.hasOwnProperty('start') && entity.hasOwnProperty('end')) {
          // Charter:
          result = `<li class="list-group-item">\
              <a href="${buildLink(entity._links.self.href)}">\
                  ${entity.start} &ndash; ${entity.end}\
              </a>\
          </li>`;
      } else
          return '<li class="list-group-item">[Type of item not supported yet]</li>\n';
      return result;
  };

  /**
   * Inject values retrieved from the API into the relevant elements of the DOM.
   *
   * @param {String} key        ID of the placeholder.
   * @param {Object} value      actual value for that piece of data.
   * @param {Array}  expression list of fields to use (optional).
   *
   * @alias injectValues
   * @memberOf Apiary
   */
  var injectValues = function(key, value, expression) {
    if (MODE_DEBUG === mode)
      console.debug(`injectValues:\n${JSON.stringify(key)}\n${JSON.stringify(value)}\n${JSON.stringify(expression)}`);
    var chunk;
    if ('string' === typeof value || 'number' === typeof value) {
      chunk = String(value);
    } else if (value instanceof Array) {
      chunk = getLargestPhoto(value);
      if (!chunk) {
        chunk = '<ul>';
        for (var i = 0; i < value.length; i ++)
          chunk += formatEntity(value[i], expression);
        chunk += '</ul>';
      }
    } else if ('object' === typeof value) {
      chunk = formatEntity(value, expression);
    }
    for (var i in placeholders[key]) {
      placeholders[key][i].innerHTML = chunk;
      placeholders[key][i].classList.add('apiary-done');
    }
    delete placeholders[key];
  };

  /**
   * GET data from the API, using the API key, and process the flattened version.
   *
   * @param {String} url target URL, including base URL and parameters, but not an API key.
   *
   * @alias get
   * @memberOf Apiary
   */
  var get = function(url) {
    if (MODE_DEBUG === mode)
      console.debug('get:\n' + JSON.stringify(url));
    var newUrl = url;
    if (-1 === newUrl.indexOf('?')) {
      newUrl += '?apikey=' + apiKey + '&embed=true';
    } else {
      newUrl += '&apikey=' + apiKey + '&embed=true';
    }
    if (cache.hasOwnProperty(newUrl)) {
      crawl(cache[newUrl]);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', newUrl);
      xhr.addEventListener('loadend', function(event) {
        var result = JSON.parse(xhr.response);
        var i, j;
        for (i of ['_links', '_embedded']) {
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
        crawl(result);
      });
      xhr.send();
    }
  };

  /**
   * Find the largest photo available from an array of them, and return an IMG element.
   *
   * @param   {Array}  data list of photos provided.
   * @returns {String}      chunk of text corresponding to a new <code>&lt;img&gt;</code> node with the photo.
   *
   * @alias getLargestPhoto
   * @memberOf Apiary
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
  if (window.addEventListener)
    window.addEventListener('load', process);
  else if (window.attachEvent)
    window.attachEvent('onload', process);

})(window);
