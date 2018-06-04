'use strict';

/* eslint-env mocha */
var assert = require('assert');
var camelCase = require('camel-case');

var apiVersions = {
  v1: require('./api/v1')

  /**
    API implementations may combine all methods into one object for a better UX.  This will alert us of duplicate method names.  A methodName attribute can be added in the json definition that will rename the API method without affecting the request sent to the server.
  */
};describe('no duplicate method names', function () {
  var _loop = function _loop(version) {
    describe(version, function () {
      var dups = {};
      var definitions = apiVersions[version];

      var _loop2 = function _loop2(apiGroup) {
        describe(apiGroup, function () {
          var _loop3 = function _loop3(apiMethod) {
            it(apiMethod, function () {
              var methodName = camelCase(apiMethod);
              var methodRename = definitions[apiGroup][apiMethod].methodName;
              var name = methodRename != null ? methodRename : methodName;
              var dup = dups[name];
              assert(!dup, 'Duplicate method api/' + version + '/' + apiGroup + '.json::' + apiMethod);
              dups[name] = true;
            });
          };

          for (var apiMethod in definitions[apiGroup]) {
            _loop3(apiMethod);
          }
        });
      };

      for (var apiGroup in definitions) {
        _loop2(apiGroup);
      }
    });
  };

  for (var version in apiVersions) {
    _loop(version);
  }
});