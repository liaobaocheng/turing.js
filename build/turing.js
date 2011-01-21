/*!
 * Turing Core
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * A private namespace to set things up against the global object.
 */
(function(global) {
  /**
   * The turing object.  Use `turing('selector')` for quick DOM access when built with the DOM module.
   *
   * @returns {Object} The turing object, run through `init`
   */
  function turing() {
    return turing.init.apply(turing, arguments);
  }

  turing.VERSION = '0.0.47';
  turing.lesson = 'Part 47: Writing Documentation';

  /**
   * This alias will be used as an alternative to `turing()`.
   * If `__turing_alias` is present in the global scope this will be used instead. 
   * 
   */
  turing.alias = global.__turing_alias || '$t';
  global[turing.alias] = turing;

  /**
   * Determine if an object is an `Array`.
   *
   * @param {Object} object An object that may or may not be an array
   * @returns {Boolean} True if the parameter is an array
   */
  turing.isArray = Array.isArray || function(object) {
    return !!(object && object.concat
              && object.unshift && !object.callee);
  };

  /**
   * Convert an `Array`-like collection into an `Array`.
   *
   * @param {Object} collection A collection of items that responds to length
   * @returns {Array} An `Array` of items
   */
  turing.toArray = function(collection) {
    var results = [];
    for (var i = 0; i < collection.length; i++) {
      results.push(collection[i]);
    }
    return results;
  };

  // This can be overriden by libraries that extend turing(...)
  turing.init = function() { };

  /**
   * Determines if an object is a `Number`.
   *
   * @param {Object} object A value to test
   * @returns {Boolean} True if the object is a Number
   */
  turing.isNumber = function(object) {
    return (object === +object) || (toString.call(object) === '[object Number]');
  };

  /**
   * Binds a function to an object.
   *
   * @param {Function} fn A function
   * @param {Object} object An object to bind to
   * @returns {Function} A rebound method
   */
  turing.bind = function(fn, object) {
    var slice = Array.prototype.slice,
        args  = slice.apply(arguments, [2]);
    return function() {
      return fn.apply(object || {}, args.concat(slice.apply(arguments)));
    };
  };

  var testCache = {},
      detectionTests = {};

  /**
   * Used to add feature-detection methods.
   *
   * @param {String} name The name of the test
   * @param {Function} fn The function that performs the test
   */
  turing.addDetectionTest = function(name, fn) {
    if (!detectionTests[name])
      detectionTests[name] = fn;
  };

  /**
   * Run a feature detection name.
   *
   * @param {String} name The name of the test
   * @returns {Boolean} The outcome of the test
   */
  turing.detect = function(testName) {
    if (typeof testCache[testCache] === 'undefined') {
      testCache[testName] = detectionTests[testName]();
    }
    return testCache[testName];
  };

  if (global.turing) {
    throw new Error('turing has already been defined');
  } else {
    global.turing = turing;
    if (typeof exports !== 'undefined') exports.turing = turing;
  }
})(typeof window === 'undefined' ? this : window);


/*!
 * Turing OO
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * The Turing Class:
 * 
 *     User = turing.Class({
 *       initialize: function(name, age) {
 *         this.name = name;
 *         this.age  = age;
 *       }
 *     });
 *
 *     new User('Alice', '26');
 *
 * Inheritance:
 *
 * Pass an object to `turing.Class` to inherit from it.
 *
 *     SuperUser = turing.Class(User, {
 *       initialize: function() {
 *         this.$super('initialize', arguments);
 *       },
 *
 *       toString: function() {
 *         return "SuperUser: " + this.$super('toString');
 *       }
 *     });
 *
 * Mixins: 
 * 
 * Objects can be embedded within each other:
 *
 *     MixinUser = turing.Class({
 *       include: User,
 *
 *       initialize: function(log) {
 *         this.log = log;
 *       }
 *     });
 *
 **/
turing.Class = function() {
  return turing.oo.create.apply(this, arguments);
}

turing.oo = {
  create: function() {
    var methods = null,
        parent  = undefined,
        klass   = function() {
          this.$super = function(method, args) { return turing.oo.$super(this.$parent, this, method, args); };
          this.initialize.apply(this, arguments);
        };

    if (typeof arguments[0] === 'function') {
      parent = arguments[0];
      methods = arguments[1];
    } else {
      methods = arguments[0];
    }

    if (typeof parent !== 'undefined') {
      turing.oo.extend(klass.prototype, parent.prototype);
      klass.prototype.$parent = parent.prototype;
    }

    turing.oo.mixin(klass, methods);
    turing.oo.extend(klass.prototype, methods);
    klass.prototype.constructor = klass;

    if (!klass.prototype.initialize)
      klass.prototype.initialize = function(){};

    return klass;
  },

  mixin: function(klass, methods) {
    if (typeof methods.include !== 'undefined') {
      if (typeof methods.include === 'function') {
        turing.oo.extend(klass.prototype, methods.include.prototype);
      } else {
        for (var i = 0; i < methods.include.length; i++) {
          turing.oo.extend(klass.prototype, methods.include[i].prototype);
        }
      }
    }
  },

  extend: function(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  },
  $super: function(parentClass, instance, method, args) {
    return parentClass[method].apply(instance, args);
  }
};
/*!
 * Turing Enumerable
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * The Turing Enumerable module.
 */
turing.enumerable = {
  /**
   * Throw to break out of iterators.
   */
  Break: {},

  /**
   * Iterates using a function over a set of items.  Example:
   *
   *      turing.enumerable.each([1, 2, 3], function(n) {
   *        console.log(n);
   *      });
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback The function to run
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Object} The passed in enumerable object
   */
  each: function(enumerable, callback, context) {
    try {
      if (Array.prototype.forEach && enumerable.forEach === Array.prototype.forEach) {
        enumerable.forEach(callback, context);
      } else if (turing.isNumber(enumerable.length)) {
        for (var i = 0, l = enumerable.length; i < l; i++) callback.call(enumerable, enumerable[i], i, enumerable);
      } else {
        for (var key in enumerable) {
          if (hasOwnProperty.call(enumerable, key)) callback.call(context, enumerable[key], key, enumerable);
        }
      }
    } catch(e) {
      if (e != turing.enumerable.Break) throw e;
    }

    return enumerable;
  },

  /**
   * Changes a set of item using a function. Example:
   *
   *      turing.enumerable.map([1, 2, 3], function(n) {
   *        return n + 1;
   *      });
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback The function to run over each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Array} The changed items
   */
  map: function(enumerable, callback, context) {
    if (Array.prototype.map && enumerable.map === Array.prototype.map) return enumerable.map(callback, context);
    var results = [];
    turing.enumerable.each(enumerable, function(value, index, list) {
      results.push(callback.call(context, value, index, list));
    });
    return results;
  },

  /**
   * Removes items based on a callback.  For example:
   *
   *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
   *      turing.enumerable.filter(a, function(n) {
   *        return n % 2 === 0;
   *      });
   *
   *      => [2, 4, 6, 8]
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback The function to run over each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Array} The filtered items
   */
  filter: function(enumerable, callback, context) {
    if (Array.prototype.filter && enumerable.filter === Array.prototype.filter)
      return enumerable.filter(callback, context);
    var results   = [],
        pushIndex = !turing.isArray(enumerable);
    turing.enumerable.each(enumerable, function(value, index, list) {
      if (callback.call(context, value, index, list)) {
        if (pushIndex) {
          results.push([index, value]);
        } else {
          results.push(value);
        }
      }
    });
    return results;
  },

  /**
   * The opposite of filter.  For example:
   *
   *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
   *      turing.enumerable.reject(a, function(n) {
   *        return n % 2 === 0;
   *      });
   *
   *      => [1, 3, 5, 7]
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback The function to run over each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Array} The rejected items
   */
  reject: function(enumerable, callback, context) {
    return this.filter(enumerable, function() {
      return !callback.apply(context, arguments);
    }, context);
  },

  /**
   * Find a single item.  For example:
   *
   *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
   *      turing.enumerable.detect(a, function(n) {
   *        return n === 3;
   *      });
   *
   *      => 3
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback The function to run over each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Object} The item, if found
   */
  detect: function(enumerable, callback, context) {
    var result;
    turing.enumerable.each(enumerable, function(value, index, list) {
      if (callback.call(context, value, index, list)) {
        result = value;
        throw turing.enumerable.Break;
      }
    });
    return result;
  },

  /**
   * Runs a function over each item, collecting the results:
   *
   *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
   *      turing.enumerable.reduce(a, 0, function(memo, n) {
   *        return memo + n;
   *      });
   *
   *      => 36
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Object} memo The initial accumulator value
   * @param {Function} callback The function to run over each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Object} The accumulated results
   */
  reduce: function(enumerable, memo, callback, context) {
    if (Array.prototype.reduce && enumerable.reduce === Array.prototype.reduce)
      return enumerable.reduce(turing.bind(callback, context), memo);
    turing.enumerable.each(enumerable, function(value, index, list) {
      memo = callback.call(context, memo, value, index, list);
    });
    return memo;
  },

  /**
   * Flattens multidimensional arrays:
   *
   *      turing.enumerable.flatten([[2, 4], [[6], 8]]);
   *
   *      => [2, 4, 6, 8]
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @returns {Object} The flat array
   */
  flatten: function(array) {
    return turing.enumerable.reduce(array, [], function(memo, value) {
      if (turing.isArray(value)) return memo.concat(turing.enumerable.flatten(value));
      memo.push(value);
      return memo;
    });
  },

  /**
   * Return the last items from a list:
   *
   *      turing.enumerable.tail([1, 2, 3, 4, 5], 3);
   *
   *      => [4, 5]
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Number} start The index of the item to 'cut' the array
   * @returns {Object} A list of items
   */
  tail: function(enumerable, start) {
    start = typeof start === 'undefined' ? 1 : start;
    return Array.prototype.slice.apply(enumerable, [start]);
  },

  /**
   * Invokes `method` on a list of items:
   *
   *      turing.enumerable.invoke(['hello', 'world'], 'substring', 0, 3);
   *
   *      => ['hel', 'wor']
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} method The method to invoke on each item
   * @returns {Object} The changed list
   */
  invoke: function(enumerable, method) {
    var args = turing.enumerable.tail(arguments, 2); 
    return turing.enumerable.map(enumerable, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
  },

  /**
   * Pluck a property from each item of a list:
   *
   *      turing.enumerable.pluck(['hello', 'world'], 'length');
   *
   *      => [5, 5]
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {String} key The property to pluck
   * @returns {Object} The plucked properties
   */
  pluck: function(enumerable, key) {
    return turing.enumerable.map(enumerable, function(value) {
      return value[key];
    });
  },

  /**
   * Determines if a list matches some items based on a callback:
   *
   *      turing.enumerable.some([1, 2, 3], function(value) {
   *        return value === 3;
   *      });
   *
   *      => true
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback A function to run against each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Boolean} True if an item was matched
   */
  some: function(enumerable, callback, context) {
    callback = callback || turing.enumerable.identity;
    if (Array.prototype.some && enumerable.some === Array.prototype.some)
      return enumerable.some(callback, context);
    var result = false;
    turing.enumerable.each(enumerable, function(value, index, list) {
      if (result = callback.call(context, value, index, list)) {
        throw turing.enumerable.Break;
      }
    });
    return result;
  },

  /**
   * Checks if all items match the callback:
   *
   *      turing.enumerable.all([1, 2, 3], function(value) {
   *        return value < 4;
   *      })
   *
   *      => true
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Function} callback A function to run against each item
   * @param {Object} [context] An optional parameter to determine `this` in the callback
   * @returns {Boolean} True if all items match
   */
  all: function(enumerable, callback, context) {
    callback = callback || turing.enumerable.identity;
    if (Array.prototype.every && enumerable.every === Array.prototype.every)
      return enumerable.every(callback, context);
    var result = true;
    turing.enumerable.each(enumerable, function(value, index, list) {
      if (!(result = result && callback.call(context, value, index, list))) {
        throw turing.enumerable.Break;
      }
    });
    return result;
  },

  /**
   * Checks if one item matches a value:
   *
   *      turing.enumerable.include([1, 2, 3], 3);
   *
   *      => true
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @param {Object} target A value to find
   * @returns {Boolean} True if an item was found
   */
  include: function(enumerable, target) {
    if (Array.prototype.indexOf && enumerable.indexOf === Array.prototype.indexOf)
      return enumerable.indexOf(target) != -1;
    var found = false;
    turing.enumerable.each(enumerable, function(value, key) {
      if (found = value === target) {
        throw turing.enumerable.Break;
      }
    });
    return found;
  },

  /**
   * Chain enumerable calls:
   *
   *      turing.enumerable.chain([1, 2, 3, 4])
   *        .filter(function(n) { return n % 2 == 0; })
   *        .map(function(n) { return n * 10; })
   *        .values();
   *
   *      => [20, 40]
   *
   * @param {Object} enumerable A set of items that responds to `length`
   * @returns {Object} The chained enumerable API
   */
  chain: function(enumerable) {
    return new turing.enumerable.Chainer(enumerable);
  },

  identity: function(value) {
    return value;
  }
};

// Aliases
turing.enumerable.select = turing.enumerable.filter;
turing.enumerable.collect = turing.enumerable.map;
turing.enumerable.inject = turing.enumerable.reduce;
turing.enumerable.rest = turing.enumerable.tail;
turing.enumerable.any = turing.enumerable.some;
turing.enumerable.every = turing.enumerable.all;
turing.chainableMethods = ['map', 'collect', 'detect', 'filter', 'reduce',
                           'tail', 'rest', 'reject', 'pluck', 'any', 'some'];

// Chainer class
turing.enumerable.Chainer = function(values) {
  this.results = values;
};

turing.enumerable.Chainer.prototype.values = function() {
  return this.results;
};

turing.enumerable.each(turing.chainableMethods, function(methodName) {
  var method = turing.enumerable[methodName];
  turing.enumerable.Chainer.prototype[methodName] = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.results);
    this.results = method.apply(this, args);
    return this;
  }
});
/*!
 * Turing Functional
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * Turing Functional helpers.
 */
turing.functional = {
  curry: turing.bind,

  memoize: function(memo, fn) {
    var wrapper = function(n) {
      var result = memo[n];
      if (typeof result !== 'number') {
        result = fn(wrapper, n);
        memo[n] = result;
      }
      return result;
    };
    return wrapper;
  } 
};
/*!
 * Turing DOM
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * The Turing DOM module.
 */
(function() {
  var dom = {}, InvalidFinder = Error, macros, rules, tokenMap,
      find, matchMap, findMap, filter, scannerRegExp;

  macros = {
    'nl':        '\n|\r\n|\r|\f',
    'w':         '[\s\r\n\f]*',
    'nonascii':  '[^\0-\177]',
    'num':       '-?([0-9]+|[0-9]*\.[0-9]+)',
    'unicode':   '\\[0-9A-Fa-f]{1,6}(\r\n|[\s\n\r\t\f])?',
    'escape':    '#{unicode}|\\[^\n\r\f0-9A-Fa-f]',
    'nmchar':    '[_A-Za-z0-9-]|#{nonascii}|#{escape}',
    'nmstart':   '[_A-Za-z]|#{nonascii}|#{escape}',
    'ident':     '[-@]?(#{nmstart})(#{nmchar})*',
    'name':      '(#{nmchar})+',
    'string1':   '"([^\n\r\f"]|#{nl}|#{nonascii}|#{escape})*"',
    'string2':   "'([^\n\r\f']|#{nl}|#{nonascii}|#{escape})*'",
    'string':    '#{string1}|#{string2}'
  };

  rules = {
    'name and id':    '(#{ident}##{ident})',
    'id':             '(##{ident})',
    'class':          '(\\.#{ident})',
    'name and class': '(#{ident}\\.#{ident})',
    'element':        '(#{ident})',
    'pseudo class':   '(:#{ident})'
  };

  function scanner() {
    function replacePattern(pattern, patterns) {
      var matched = true, match;
      while (matched) {
        match = pattern.match(/#\{([^}]+)\}/);
        if (match && match[1]) {
          pattern = pattern.replace(new RegExp('#\{' + match[1] + '\}', 'g'), patterns[match[1]]);
          matched = true;
        } else {
          matched = false;
        }
      }
      return pattern;
    }

    function escapePattern(text) {
      return text.replace(/\//g, '//');
    }

    function convertPatterns() {
      var key, pattern, results = {}, patterns, source;

      if (arguments.length === 2) {
        source = arguments[0];
        patterns = arguments[1];
      } else {
        source = arguments[0];
        patterns = arguments[0];
      }

      for (key in patterns) {
        pattern = escapePattern(replacePattern(patterns[key], source));
        results[key] = pattern;
      }

      return results;
    }

    function joinPatterns(regexps) {
      var results = [], key;
      for (key in regexps) {
        results.push(regexps[key]);
      }
      return new RegExp(results.join('|'), 'g');
    }

    return joinPatterns(
      convertPatterns(convertPatterns(macros), rules)
    );
  }

  scannerRegExp = scanner();

  find = {
    byId: function(root, id) {
      if (root === null) return [];
      return [root.getElementById(id)];
    },

    byNodeName: function(root, tagName) {
      if (root === null) return [];
      var i, results = [], nodes = root.getElementsByTagName(tagName);
      for (i = 0; i < nodes.length; i++) {
        results.push(nodes[i]);
      }
      return results;
    },

    byClassName: function(root, className) {
      if (root === null) return [];
      var i, results = [], nodes = root.getElementsByTagName('*');
      for (i = 0; i < nodes.length; i++) {
        if (nodes[i].className.match('\\b' + className + '\\b')) {
          results.push(nodes[i]);
        }
      }
      return results;
    }
  };

  findMap = {
    'id': function(root, selector) {
      selector = selector.split('#')[1];
      return find.byId(root, selector);
    },

    'name and id': function(root, selector) {
      var matches = selector.split('#'), name, id;
      name = matches[0];
      id = matches[1];
      return filter.byAttr(find.byId(root, id), 'nodeName', name.toUpperCase());
    },

    'name': function(root, selector) {
      return find.byNodeName(root, selector);
    },

    'class': function(root, selector) {
      selector = selector.split('\.')[1];
      return find.byClassName(root, selector);
    },

    'name and class': function(root, selector) {
      var matches = selector.split('\.'), name, className;
      name = matches[0];
      className = matches[1];
      return filter.byAttr(find.byClassName(root, className), 'nodeName', name.toUpperCase());
    }
  };

  if (typeof document.getElementsByClassName !== 'undefined') {
    find.byClassName = function(root, className) {
      return root.getElementsByClassName(className);
    };
  }

  filter = {
    byAttr: function(elements, attribute, value) {
      var key, results = [];
      for (key in elements) {
        if (elements[key] && elements[key][attribute] === value) {
          results.push(elements[key]);
        }
      }
      return results;
    }
  };

  matchMap = {
    'id': function(element, selector) {
      selector = selector.split('#')[1];
      return element && element.id === selector;
    },

    'name': function(element, nodeName) {
      return element.nodeName === nodeName.toUpperCase();
    },

    'name and id': function(element, selector) {
      return matchMap.id(element, selector) && matchMap.name(element, selector.split('#')[0]);
    },

    'class': function(element, selector) {
      if (element && element.className) {
        selector = selector.split('\.')[1];
        return element.className.match('\\b' + selector + '\\b'); 
      }
    },

    'name and class': function(element, selector) {
      return matchMap['class'](element, selector) && matchMap.name(element, selector.split('\.')[0]);
    }
  };

  function Searcher(root, tokens) {
    this.root = root;
    this.key_selector = tokens.pop();
    this.tokens = tokens;
    this.results = [];
  }

  Searcher.prototype.matchesToken = function(element, token) {
    if (!matchMap[token.finder]) {
      throw new InvalidFinder('Invalid matcher: ' + token.finder); 
    }
    return matchMap[token.finder](element, token.identity);
  };

  Searcher.prototype.find = function(token) {
    if (!findMap[token.finder]) {
      throw new InvalidFinder('Invalid finder: ' + token.finder); 
    }
    return findMap[token.finder](this.root, token.identity); 
  };

  Searcher.prototype.matchesAllRules = function(element) {
    var tokens = this.tokens.slice(), token = tokens.pop(),
        matchFound = false;
    if (!token || !element) return false;

    while (element && token) {
      if (this.matchesToken(element, token)) {
        matchFound = true;
        token = tokens.pop();
      }
      element = element.parentNode;
    }

    return matchFound && tokens.length === 0;
  };

  Searcher.prototype.parse = function() {
    // Find all elements with the key selector
    var i, element, elements = this.find(this.key_selector), results = [];

    // Traverse upwards from each element to see if it matches all of the rules
    for (i = 0; i < elements.length; i++) {
      element = elements[i];
      if (this.tokens.length > 0) {
        if (this.matchesAllRules(element.parentNode)) {
          results.push(element);
        }
      } else {
        if (this.matchesToken(element, this.key_selector)) {
          results.push(element);
        }
      }
    }
    return results;
  };

  Searcher.prototype.values = function() {
    return this.results;
  };

  function normalize(text) {
    return text.replace(/^\s+|\s+$/g, '').replace(/[ \t\r\n\f]+/g, ' ');
  }

  // Tokens are used by the Tokenizer
  function Token(identity, finder) {
    this.identity = identity;
    this.finder   = finder;
  }

  Token.prototype.toString = function() {
    return 'identity: ' + this.identity + ', finder: ' + this.finder;
  };

  // Tokenizer: classify sections of the scanner output
  function Tokenizer(selector) {
    this.selector = normalize(selector);
    this.tokens = [];
    this.tokenize();
  }

  Tokenizer.prototype.tokenize = function() {
    var match, r, finder;

    r = scannerRegExp;
    r.lastIndex = 0;

    while (match = r.exec(this.selector)) {
      finder = null;

      if (match[10]) {
        finder = 'id';
      } else if (match[1]) {
        finder = 'name and id';
      } else if (match[29]) {
        finder = 'name';
      } else if (match[15]) {
        finder = 'class';
      } else if (match[20]) {
        finder = 'name and class';
      }
      this.tokens.push(new Token(match[0], finder));
    }
    return this.tokens;
  };

  Tokenizer.prototype.finders = function() {
    var i, results = [];
    for (i in this.tokens) {
      results.push(this.tokens[i].finder);
    }
    return results;
  };

  dom.tokenize = function(selector) {
    var tokenizer = new Tokenizer(selector);
    return tokenizer;
  };

  function get(selector, root) {
    var tokens = dom.tokenize(selector).tokens,
        searcher = new Searcher(root, tokens);
    return searcher.parse();
  }

  turing.addDetectionTest('querySelectorAll', function() {
    var div = document.createElement('div');
    div.innerHTML = '<p class="TEST"></p>';

    // Some versions of Safari can't handle uppercase in quirks mode
    if (div.querySelectorAll) {
      if (div.querySelectorAll('.TEST').length === 0) return false;
      return true;
    }

    // Helps IE release memory associated with the div
    div = null;
    return false;
  });

  /**
   * Finds DOM elements based on a CSS selector.
   *
   * @param {String} selector A CSS selector
   * @returns {Array} The elements
   */
  dom.get = function(selector) {
    var root = typeof arguments[1] === 'undefined' ? document : arguments[1];
    return turing.toArray(turing.detect('querySelectorAll') ?
      root.querySelectorAll(selector) : get(selector, root));
  };

  /**
   * Does an element satify a selector, based on root element?
   *
   * @param {Object} element A DOM element
   * @param {String} selector A CSS selector
   * @param {Object} root The root DOM element
   * @returns {Object} The matching DOM element
   */
  dom.findElement = function(element, selector, root) {
    var tokens = dom.tokenize(selector).tokens,
        searcher = new Searcher(root, []);
    searcher.tokens = tokens;
    while (element) {
      if (searcher.matchesAllRules(element)) {
        return element;
      }
      element = element.parentNode;
    }
  };

  // Chained calls
  turing.init = function(selector) {
    return new turing.domChain.init(selector);
  };

  turing.domChain = {
    init: function(selector) {
      this.selector = selector;
      this.length = 0;
      this.prevObject = null;
      this.elements = [];

      if (!selector) {
        return this;
      } else {
        return this.find(selector);
      }
    },

    writeElements: function() {
      for (var i = 0; i < this.elements.length; i++) {
        this[i] = this.elements[i];
      }
    },

    first: function() {
      return this.elements.length === 0 ? null : this.elements[0];
    },

    find: function(selector) {
      var elements = [],
          ret = turing(),
          root = document;

      if (this.prevObject) {
        if (this.prevObject.elements.length > 0) {
          root = this.prevObject.elements[0];
        } else {
          root = null;
        }
      }

      elements = dom.get(selector, root);
      this.elements = elements;
      ret.elements = elements;
      ret.selector = selector;
      ret.length = elements.length;
      ret.prevObject = this;
      ret.writeElements();
      return ret;
    }
  };

  turing.domChain.init.prototype = turing.domChain;

  turing.dom = dom;
})();

/*!
 * Turing Events
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * The Turing Events module.
 */
(function() {
  var events = {}, cache = [], onReadyBound = false, isReady = false, DOMContentLoaded, readyCallbacks = [];

  function isValidElement(element) {
    return element.nodeType !== 3 && element.nodeType !== 8;
  }

  function stop(event) {
    event.preventDefault(event);
    event.stopPropagation(event);
  }

  function fix(event, element) {
    if (!event) var event = window.event;

    event.stop = function() { stop(event); };

    if (typeof event.target === 'undefined')
      event.target = event.srcElement || element;

    if (!event.preventDefault)
      event.preventDefault = function() { event.returnValue = false; };

    if (!event.stopPropagation)
      event.stopPropagation = function() { event.cancelBubble = true; };

    if (event.target && event.target.nodeType === 3)
      event.target = event.target.parentNode;

    if (event.pageX == null && event.clientX != null) {
      var doc = document.documentElement, body = document.body;
      event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
    }

    return event;
  }

  function createResponder(element, handler) {
    return function(event) {
      fix(event, element);
      return handler(event);
    };
  }

  function removeCachedResponder(element, type, handler) {
    var i = 0, responder, j = 0;
    for (j = 0; j < cache.length; j++) {
      if (cache[j].element !== element
          && cache[j].type !== type
          && cache[j].handler !== handler) {
        cache[i++] = cache[j];
      } else {
        responder = cache[j].responder;
      }
    }
    cache.length = i;
    return responder;
  }

  function ready() {
    if (!isReady) {
      // Make sure body exists
      if (!document.body) {
        return setTimeout(ready, 13);
      }

      isReady = true;

      for (var i in readyCallbacks) {
        readyCallbacks[i]();
      }

      readyCallbacks = null;

      // TODO:
      // When custom events work properly in IE:
      // events.fire(document, 'dom:ready');
    }
  }

  // This checks if the DOM is ready recursively
  function DOMReadyScrollCheck() {
    if (isReady) {
      return;
    }

    try {
      document.documentElement.doScroll('left');
    } catch(e) {
      setTimeout(DOMReadyScrollCheck, 1);
      return;
    }

    ready();
  }

  // DOMContentLoaded cleans up listeners
  if (document.addEventListener) {
    DOMContentLoaded = function() {
      document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
      ready();
    };
  } else if ( document.attachEvent ) {
    DOMContentLoaded = function() {
      if (document.readyState === 'complete') {
        document.detachEvent('onreadystatechange', DOMContentLoaded);
        ready();
      }
    };
  }

  function bindOnReady() {
    if (onReadyBound) return;
    onReadyBound = true;

    if (document.readyState === 'complete') {
      ready();
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', DOMContentLoaded, false );
      window.addEventListener('load', ready, false);
    } else if (document.attachEvent) {
      document.attachEvent('onreadystatechange', DOMContentLoaded);

      window.attachEvent('onload', ready);

      // Check to see if the document is ready
      var toplevel = false;
      try {
        toplevel = window.frameElement == null;
      } catch(e) {}

      if (document.documentElement.doScroll && toplevel) {
        DOMReadyScrollCheck();
      }
    }
  }

  function IEType(type) {
    if (type.match(/:/)) {
      return type;
    }
    return 'on' + type;
  }

  /**
   * Bind an event to an element.
   *
   *      turing.events.add(element, 'click', function() {
   *        console.log('Clicked');
   *      });
   *
   * @param {Object} element A DOM element
   * @param {String} type The event name
   * @param {Function} handler The event handler
   */
  events.add = function(element, type, handler) {
    if (!isValidElement(element)) return;

    var responder = createResponder(element, handler);
    cache.push({ element: element, type: type, handler: handler, responder: responder });

    if (type.match(/:/) && element.attachEvent) {
      element.attachEvent('ondataavailable', responder);
    } else {
      if (element.addEventListener) {
        element.addEventListener(type, responder, false);
      } else if (element.attachEvent) {
        element.attachEvent(IEType(type), responder);
      }
    }
  };

  /**
   * Remove an event from an element.
   *
   *      turing.events.add(element, 'click', callback);
   *
   * @param {Object} element A DOM element
   * @param {String} type The event name
   * @param {Function} handler The event handler
   */
  events.remove = function(element, type, handler) {
    if (!isValidElement(element)) return;
    var responder = removeCachedResponder(element, type, handler);

    if (document.removeEventListener) {
      element.removeEventListener(type, responder, false);
    } else {
      element.detachEvent(IEType(type), responder);
    }
  };

  /**
   * Fires an event.
   *
   *      turing.events.fire(element, 'click');
   *
   * @param {Object} element A DOM element
   * @param {String} type The event name
   * @returns {Object} The browser's `fireEvent` or `dispatchEvent` result
   */
  events.fire = function(element, type) {
    var event;
    if (document.createEventObject) {
      event = document.createEventObject();
      fix(event, element);

      // This isn't quite ready
      if (type.match(/:/)) {
        event.eventName = type;
        event.eventType = 'ondataavailable';
        return element.fireEvent(event.eventType, event)
      } else {
        return element.fireEvent(IEType(type), event)
      }
    } else {
      event = document.createEvent('HTMLEvents');
      fix(event, element);
      event.eventName = type;
      event.initEvent(type, true, true);
      return !element.dispatchEvent(event);
    }
  };

  /**
   * Add a 'DOM ready' callback.
   *
   *      turing.events.ready(function() {
   *        // The DOM is ready
   *      });
   *
   * @param {Function} callback A callback to run
   */
  events.ready = function(callback) {
    bindOnReady();
    readyCallbacks.push(callback);
  };

  if (turing.dom !== 'undefined') {
    events.delegate = function(element, selector, type, handler) {
      return events.add(element, type, function(event) {
        var matches = turing.dom.findElement(event.target, selector, event.currentTarget);
        if (matches) {
          handler(event);
        }
      });
    };
  }

  /**
    * Events can be chained with DOM calls:
    *
    *       turing('p').bind('click', function(e) {
    *         alert('ouch');
    *       });
    *
    */
  events.addDOMethods = function() {
    if (typeof turing.domChain === 'undefined') return;

    turing.domChain.bind = function(type, handler) {
      var element = this.first();
      for (var i = 0; i < this.length; i++) {
        element = this[i];
        if (handler) {
          turing.events.add(element, type, handler);
        } else {
          turing.events.fire(element, type);
        }
      }
      return this;
    };

    var chainedAliases = ('click dblclick mouseover mouseout mousemove ' +
                          'mousedown mouseup blur focus change keydown ' +
                          'keypress keyup resize scroll').split(' ');

    for (var i = 0; i < chainedAliases.length; i++) {
      (function(name) {
        turing.domChain[name] = function(handler) {
          return this.bind(name, handler);
        };
      })(chainedAliases[i]);
    }
  };

  events.addDOMethods();

  turing.events = events;

  if (typeof window !== 'undefined' && window.attachEvent && !window.addEventListener) {
    window.attachEvent('onunload', function() {
      for (var i = 0; i < cache.length; i++) {
        try {
          events.remove(cache[i].element, cache[i].type);
          cache[i] = null;
        } catch(e) {}
      }
    });
  }
})();

/*!
 * Turing Net
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * The Turing Net module (Ajax).
 */
(function() {
  var net = {};

  /**
    * Ajax request options:
    *
    *   - `method`: {String} HTTP method - GET, POST, etc.
    *   - `asynchronous`: {Boolean} Defaults to asynchronous
    *   - `postBody`: {String} The HTTP POST body
    *   - `success`: {Function} A callback to run when a request is successful
    *   - `error`: {Function} A callback to run when the request fails
    *
    */

  function xhr() {
    if (typeof XMLHttpRequest !== 'undefined' && (window.location.protocol !== 'file:' || !window.ActiveXObject)) {
      return new XMLHttpRequest();
    } else {
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.6.0');
      } catch(e) { }
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.3.0');
      } catch(e) { }
      try {
        return new ActiveXObject('Msxml2.XMLHTTP');
      } catch(e) { }
    }
    return false;
  }

  function successfulRequest(request) {
    return (request.status >= 200 && request.status < 300) ||
        request.status == 304 ||
        (request.status == 0 && request.responseText);
  }

  function ajax(url, options) {
    var request = xhr();

    function respondToReadyState(readyState) {
      if (request.readyState == 4) {
        if (successfulRequest(request)) {
          if (options.success) options.success(request);
        } else {
          if (options.error) options.error(request);
        }
      }
    }

    // The HTTP headers to accept
    function setHeaders() {
      var headers = {
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
      };

      /**
       * Set other headers
       */

      for (var name in headers) {
        request.setRequestHeader(name, headers[name]);
      }
    }

    if (typeof options === 'undefined') options = {};
    options.method = options.method ? options.method.toLowerCase() : 'get';
    options.asynchronous = options.asynchronous || true;
    options.postBody = options.postBody || '';

    request.onreadystatechange = respondToReadyState;
    request.open(options.method, url, options.asynchronous);
    setHeaders();

    try {
      request.send(options.postBody);
    } catch (e) {
      if (options.error) {
        options.error();
      }
    }

    return request;
  }

  function JSONPCallback(url, success, failure) {
    var self = this;
    this.url = url;
    this.methodName = '__turing_jsonp_' + parseInt(new Date().getTime());
    this.success = success;
    this.failure = failure;

    function runCallback(json) {
      self.success(json);
      self.teardown();
    }

    window[this.methodName] = runCallback;
  }

  JSONPCallback.prototype.run = function() {
    this.scriptTag = document.createElement('script');
    this.scriptTag.id = this.methodName;
    this.scriptTag.src = this.url.replace('{callback}', this.methodName);
    document.body.appendChild(this.scriptTag);
  }

  JSONPCallback.prototype.teardown = function() {
    window[this.methodName] = null;
    delete window[this.methodName];
    if (this.scriptTag) {
      document.body.removeChild(this.scriptTag);
    }
  }

  /**
   * An Ajax GET request.
   *
   * @param {String} url The URL to request
   * @param {Object} options The Ajax request options
   * @returns {Object} The Ajax request object
   */
  net.get = function(url, options) {
    options.method = 'get';
    return ajax(url, options);
  };

  /**
   * An Ajax POST request.
   *
   * @param {String} url The URL to request
   * @param {Object} options The Ajax request options (`postBody` may come in handy here)
   * @returns {Object} The Ajax request object
   */
  net.post = function(url, options) {
    options.method = 'post';
    return ajax(url, options);
  };

  /**
   * A jsonp request.  Example:
   *
   *     var url = 'http://feeds.delicious.com/v1/json/';
   *     url += 'alex_young/javascript?callback={callback}';
   *
   *     turing.net.jsonp(url, {
   *       success: function(json) {
   *         console.log(json);
   *       }
   *     });
   *
   * @param {String} url The URL to request
   * @param {Object} options The Ajax request options
   */
  net.jsonp = function(url, options) {
    if (typeof options === 'undefined') options = {};
    var callback = new JSONPCallback(url, options.success, options.failure);
    callback.run();
  };

  net.ajax = ajax;
  turing.net = net;
})();

/*!
 * Turing Touch
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * Support for touchscreen devices.  Run `turing.touch.register()` to get touch event support.
 *
 * Tap:
 *
 *     turing.events.add(element, 'tap', function(e) {
 *       alert('tap');
 *     });
 *
 * Swipe:
 *
 *     turing.events.add(element, 'swipe', function(e) {
 *       alert('swipe');
 *     });
 *
 * Orientation Changes:
 *
 * Device orientation is available in `turing.touch.orientation()`.
 *
 *     turing.events.add(element, 'orientationchange', function(e) {
 *       alert('Orientation is now: ' + turing.touch.orientation());
 *     });
 */
(function() {
  var touch = {}, state = {};

  touch.swipeThreshold = 50;

  // Returns [orientation angle, orientation string]
  touch.orientation = function() {
    var orientation = window.orientation,
        orientationString = '';
    switch (orientation) {
      case 0:
        orientationString += 'portrait';
      break;

      case -90:
        orientationString += 'landscape right';
      break;

      case 90:
        orientationString += 'landscape left';
      break;

      case 180:
        orientationString += 'portrait upside-down';
      break;
    }
    return [orientation, orientationString];
  };

  function touchStart(e) {
    state.touches = e.touches;
    state.startTime  = (new Date).getTime();
    state.x = e.changedTouches[0].clientX;
    state.y = e.changedTouches[0].clientY;
    state.startX = state.x;
    state.startY = state.y;
    state.target = e.target;
    state.duration = 0;
  }

  function touchEnd(e) {
    var x = e.changedTouches[0].clientX,
        y = e.changedTouches[0].clientY;

    if (state.x === x && state.y === y && state.touches.length == 1) {
      turing.events.fire(e.target, 'tap');
    }
  }

  function touchMove(e) {
    var moved = 0, touch = e.changedTouches[0];
    state.duration = (new Date).getTime() - state.startTime;
    state.x = state.startX - touch.pageX;
    state.y = state.startY - touch.pageY;
    moved = Math.sqrt(Math.pow(Math.abs(state.x), 2) + Math.pow(Math.abs(state.y), 2));

    if (state.duration < 1000 && moved > turing.touch.swipeThreshold) {
      turing.events.fire(e.target, 'swipe');
    }
  }

  // register must be called to register for touch event helpers
  touch.register = function() {
    turing.events.add(document, 'touchstart', touchStart);
    turing.events.add(document, 'touchmove', touchMove);
    turing.events.add(document, 'touchend', touchEnd);
    turing.touch.swipeThreshold = screen.width / 5;
  };

  turing.touch = touch;
})();

/*!
 * Turing Anim
 * Copyright (C) 2010-2011 Alex R. Young
 * MIT Licensed
 */

/**
 * The main animation method is `turing.anim.animate`.  The animate method animates CSS properties.
 *
 * There are also animation helper methods, like `turing.anim.fadeIn` and `turing.anim.move`.  
 *
 * Animation Examples:
 *
 * Turn a paragraph red:
 *
 *      turing.anim.animate($t('p')[0], 2000, {
 *        'color': '#ff0000'
 *      });
 *
 * Move a paragraph:
 *
 *      turing.anim.animate($t('p')[0], 2000, {
 *        'margin-left': '400px'
 *      });
 *
 * It's possible to chain animation module calls with `turing.anim.chain`, but it's easier to use the DOM chained methods:
 *
 *      turing('p').fadeIn(2000).animate(1000, {
 *        'margin-left': '200px'
 *      })
 *
 * Or:
 *
 *      $t('p').fadeIn(2000).animate(1000, {
 *        'margin-left': '200px'
 *      })
 *
 */

(function() {
  var anim = {},
      easing = {},
      Chainer,
      opacityType,
      CSSTransitions = {};

  // These CSS related functions should be moved into turing.css
  function camelize(property) {
    return property.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function getOpacityType() {
    return (typeof document.body.style.opacity !== 'undefined') ? 'opacity' : 'filter';
  }

  function Colour(value) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.value = this.normalise(value);
    this.parse();
  }

  // Based on: http://www.phpied.com/rgb-color-parser-in-javascript/
  Colour.matchers = [
    {
      re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
      example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
      process: function (bits){
        return [
          parseInt(bits[1]),
          parseInt(bits[2]),
          parseInt(bits[3])
        ];
      }
    },
    {
      re: /^(\w{2})(\w{2})(\w{2})$/,
      example: ['#00ff00', '336699'],
      process: function (bits){
        return [
          parseInt(bits[1], 16),
          parseInt(bits[2], 16),
          parseInt(bits[3], 16)
        ];
      }
    },
    {
      re: /^(\w{1})(\w{1})(\w{1})$/,
      example: ['#fb0', 'f0f'],
      process: function (bits) {
        return [
          parseInt(bits[1] + bits[1], 16),
          parseInt(bits[2] + bits[2], 16),
          parseInt(bits[3] + bits[3], 16)
        ];
      }
    }
  ];

  Colour.prototype.normalise = function(value) {
    value.replace(/ /g, '');
    if (value.charAt(0) == '#') {
      value = value.substr(1, 6);
    }
    return value;
  }

  Colour.prototype.parse = function() {
    var channels = [], i;
    for (i = 0; i < Colour.matchers.length; i++) {
      channels = this.value.match(Colour.matchers[i].re);
      if (channels) {
        channels = Colour.matchers[i].process(channels);
        this.r = channels[0];
        this.g = channels[1];
        this.b = channels[2];
        break;
      }
    }
    this.validate();
  }

  Colour.prototype.validate = function() {
    this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
    this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
    this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);
  }

  Colour.prototype.sum = function() {
    return this.r + this.g + this.b;
  }

  Colour.prototype.toString = function() {
    return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
  }

  function isColour(value) {
    return typeof value === 'string' && value.match(/(#[a-f|A-F|0-9]|rgb)/);
  }
  
  function parseColour(value) {
    return { value: new Colour(value), units: '', transform: colourTransform };
  }

  function numericalTransform(parsedValue, position, easingFunction) {
    return (easingFunction(position) * parsedValue.value);
  }

  function colourTransform(v, position, easingFunction) {
    var colours = [];
    colours[0] = Math.round(v.base.r + (v.direction[0] * (Math.abs(v.base.r - v.value.r) * easingFunction(position))));
    colours[1] = Math.round(v.base.g + (v.direction[1] * (Math.abs(v.base.g - v.value.g) * easingFunction(position))));
    colours[2] = Math.round(v.base.b + (v.direction[2] * (Math.abs(v.base.b - v.value.b) * easingFunction(position))));
    return 'rgb(' + colours.join(', ') + ')';
  }

  function parseNumericalValue(value) {
    var n = (typeof value === 'string') ? parseFloat(value) : value,
        units = (typeof value === 'string') ? value.replace(n, '') : '';
    return { value: n, units: units, transform: numericalTransform };
  }

  function parseCSSValue(value, element, property) {
    if (isColour(value)) {
      var colour = parseColour(value), i;
      colour.base = new Colour(element.style[property]);
      colour.direction = [colour.base.r < colour.value.r ? 1 : -1,
                          colour.base.g < colour.value.g ? 1 : -1,
                          colour.base.b < colour.value.b ? 1 : -1];
      return colour;
    } else {
      return parseNumericalValue(value);
    }
  }

  function setCSSProperty(element, property, value) {
    if (property == 'opacity' && opacityType == 'filter') {
      element.style[opacityType] = 'alpha(opacity=' + Math.round(value * 100) + ')';
      return element;
    }
    element.style[property] = value;
    return element;
  }

  easing.linear = function(position) {
    return position;
  };

  easing.sine = function(position) {
    return (-Math.cos(position * Math.PI) / 2) + 0.5;
  };

  easing.reverse = function(position) {
    return 1.0 - position;
  };

  easing.spring = function(position) {
    return 1 - (Math.cos(position * Math.PI * 4) * Math.exp(-position * 6))
  };

  easing.bounce = function(position) {
    if (position < (1 / 2.75)) {
      return 7.6 * position * position;
    } else if (position < (2 /2.75)) {
      return 7.6 * (position -= (1.5 / 2.75)) * position + 0.74;
    } else if (position < (2.5 / 2.75)) {
      return 7.6 * (position -= (2.25 / 2.75)) * position + 0.91;
    } else {
      return 7.6 * (position -= (2.625 / 2.75)) * position + 0.98;
    }
  };


  /**
   * Animates an element using CSS properties.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} properties CSS properties to animate, for example: `{ width: '20px' }`
   * @param {Object} options Currently accepts an easing function or built-in easing method name (linear, sine, reverse, spring, bounce)
   */
  anim.animate = function(element, duration, properties, options) {
    var duration = duration,
        start = (new Date).valueOf(),
        finish = start + duration,
        easingFunction = easing.linear,
        interval;

    if (!opacityType) {
      opacityType = getOpacityType();
    }

    options = options || {};
    if (options.hasOwnProperty('easing')) {
      if (typeof options.easing === 'string') {
        easingFunction = easing[options.easing];
      } else if (options.easing) {
        easingFunction = options.easing;
      }
    }

    for (var property in properties) {
      if (properties.hasOwnProperty(property)) {
        properties[property] = parseCSSValue(properties[property], element, property);
        if (property == 'opacity' && opacityType == 'filter') {
          element.style.zoom = 1;
        } else if (CSSTransitions.vendorPrefix && property == 'left' || property == 'top') {
          CSSTransitions.start(element, duration, property, properties[property].value + properties[property].units, options.easing);
          setTimeout(function() { CSSTransitions.end(element, property); }, duration);
          return;
        }
      }
    }

    interval = setInterval(function() {
      var time = (new Date).valueOf(), position = time > finish ? 1 : (time - start) / duration;

      for (var property in properties) {
        if (properties.hasOwnProperty(property)) {
          setCSSProperty(
            element,
            property,
            properties[property].transform(properties[property], position, easingFunction) + properties[property].units);
        }
      }

      if (time > finish) {
        clearInterval(interval);
      }
    }, 10);
  };

  CSSTransitions = {
    // CSS3 vendor detection
    vendors: {
      // Opera Presto 2.3
      'opera': {
        'prefix': '-o-',
        'detector': function() {
          try {
            document.createEvent('OTransitionEvent');
            return true;
          } catch(e) {
            return false;
          }
        }
      },

      // Chrome 5, Safari 4
      'webkit': {
        'prefix': '-webkit-',
        'detector': function() {
          try {
            document.createEvent('WebKitTransitionEvent');
            return true;
          } catch(e) {
            return false;
          }
        }
      },

      // Firefox 4
      'firefox': {
        'prefix': '-moz-',
        'detector': function() {
          var div = document.createElement('div'),
              supported = false;
          if (typeof div.style.MozTransition !== 'undefined') {
            supported = true;
          }
          div = null;
          return supported;
        }
      }
    },

    findCSS3VendorPrefix: function() {
      for (var detector in CSSTransitions.vendors) {
        detector = this.vendors[detector];
        if (detector['detector']()) {
          return detector['prefix'];
        }
      }
    },

    vendorPrefix: null,

    // CSS3 Transitions
    start: function(element, duration, property, value, easing) {
      element.style[camelize(this.vendorPrefix + 'transition')] = property + ' ' + duration + 'ms ' + (easing || 'linear');
      element.style[property] = value;
    },

    end: function(element, property) {
      element.style[camelize(this.vendorPrefix + 'transition')] = null;
    }
  };

  CSSTransitions.vendorPrefix = CSSTransitions.findCSS3VendorPrefix();

  /**
   * Fade an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options to, from, easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.fade = function(element, duration, options) {
    element.style.opacity = options.from;
    return anim.animate(element, duration, { 'opacity': options.to }, { 'easing': options.easing });
  };

  /**
   * Fade in an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options May include an easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.fadeIn = function(element, duration, options) {
    options = options || {};
    options.from = options.from || 0.0;
    options.to = options.to || 1.0;
    return anim.fade(element, duration, options);
  };

  /**
   * Fade out an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options May include an easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.fadeOut = function(element, duration, options) {
    var from;
    options = options || {};
    options.from = options.from || 1.0;
    options.to = options.to || 0.0;

    // Swap from and to
    from = options.from;
    options.from = options.to;
    options.to = from;

    // This easing function reverses the position value and adds from
    options.easing = function(p) { return (1.0 - p) + options.from; };

    return anim.fade(element, duration, options);
  };

  /**
   * Highlight an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options May include an easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.highlight = function(element, duration, options) {
    var style = element.currentStyle ? element.currentStyle : getComputedStyle(element, null);
    options = options || {};
    options.from = options.from || '#ff9';
    options.to = options.to || style.backgroundColor;
    options.easing = options.easing || easing.sine;
    duration = duration || 500;
    element.style.backgroundColor = options.from;
    return setTimeout(function() {
      anim.animate(element, duration, { 'backgroundColor': options.to, 'easing': options.easing })
    }, 200);
  };

  /**
   * Move an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options Position and easing, for example: `{ left: 100, top: 50, easing: 'sine' }`
   */
  anim.move = function(element, duration, options) {
    return anim.animate(element, duration, { 'left': options.x, 'top': options.y }, { 'easing': options.easing || easing.sine });
  };

  /**
   * Parse colour strings.  For example:
   *
   *      assert.equal('rgb(255, 0, 255)',
   *                   turing.anim.parseColour('#ff00ff').toString());
   *
   * @param {String} colourString A hex colour string
   * @returns {String} RGB string
   */
  anim.parseColour = function(colourString) { return new Colour(colourString); };
  anim.pause = function(element, duration, options) {};

  /**
   * Easing functions: linear, sine, reverse, spring, bounce.
   */
  anim.easing = easing;

  Chainer = function(element) {
    this.element = element;
    this.position = 0;
  };

  for (methodName in anim) {
    (function(methodName) {
      var method = anim[methodName];
      Chainer.prototype[methodName] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this.element);
        // Note: the duration needs to be communicated another way
        // because of defaults (like highlight())
        this.position += args[1] || 0;
        setTimeout(function() {
          method.apply(null, args);
        }, this.position);
        return this;
      };
    })(methodName);
  }

  /**
   * Chain animation module calls, for example:
   *
   *     turing.anim.chain(element)
   *       .highlight()
   *       .pause(250)
   *       .move(100, { x: '100px', y: '100px', easing: 'ease-in-out' })
   *       .animate(250, { width: '1000px' })
   *       .fadeOut(250)
   *       .pause(250)
   *       .fadeIn(250)
   *       .animate(250, { width: '20px' });
   *
   * @param {Object} element A DOM element
   * @returns {Chainer} Chained API object
   */
  anim.chain = function(element) {
    return new Chainer(element);
  };

  /**
    * Animations can be chained with DOM calls:
    *
    *       turing('p').animate(2000, {
    *         color: '#ff0000'
    *       });
    *
    */
  anim.addDOMethods = function() {
    if (typeof turing.domChain === 'undefined') return;

    var chainedAliases = ('animate fade fadeIn fadeOut highlight ' +
                          'move parseColour pause easing').split(' ');

    for (var i = 0; i < chainedAliases.length; i++) {
      (function(name) {
        turing.domChain[name] = function(handler) {
          var args = turing.toArray(arguments);
          args.unshift(this.first());
          anim[name].apply(this, args);
          return this;
        };
      })(chainedAliases[i]);
    }
  };

  anim.addDOMethods();

  turing.anim = anim;
})();