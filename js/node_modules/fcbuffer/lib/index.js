'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Types = require('./types');
var Fcbuffer = require('./fcbuffer');
var assert = require('assert');

var create = Fcbuffer.create;

/**
  @typedef {object} SerializerConfig
  @property {boolean} [SerializerConfig.defaults = false] - Insert in defaults (like 0, false, '000...', or '') for any missing values.  This helps test and inspect what a definition should look like.  Do not enable in production.
  @property {boolean} [SerializerConfig.debug = false] - Prints lots of HEX and field-level information to help debug binary serialization.
  @property {object} [customTypes] - Add or overwrite low level types (see ./src/types.js `const types = {...}`).
*/

/**
  @typedef {object} CreateStruct
  @property {Array<String>} CreateStruct.errors - If any errors exists, no struts will be created.
  @property {Object} CreateStruct.struct - Struct objects keyed by definition name.
  @property {String} CreateStruct.struct.structName - Struct object that will serialize this type.
  @property {Struct} CreateStruct.struct.struct - Struct object that will serialize this type (see ./src/struct.js).
*/

/**
  @arg {object} definitions - examples https://github.com/EOSIO/eosjs-json/blob/master/schema
  @arg {SerializerConfig} config
  @return {CreateStruct}
*/

module.exports = function (definitions) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if ((typeof definitions === 'undefined' ? 'undefined' : _typeof(definitions)) !== 'object') {
    throw new TypeError('definitions is a required parameter');
  }

  if (config.customTypes) {
    definitions = Object.assign({}, definitions); //clone
    for (var key in config.customTypes) {
      // custom types overwrite definitions
      delete definitions[key];
    }
  }

  var types = Types(config);

  var _create = create(definitions, types),
      errors = _create.errors,
      structs = _create.structs;

  /** Extend with more JSON schema and type definitions */


  var _extend = function _extend(parent, child) {
    var combined = Object.assign({}, parent, child);

    var _create2 = create(combined, types),
        structs = _create2.structs,
        errors = _create2.errors;

    return {
      errors: errors,
      structs: structs,
      extend: function extend(child) {
        return _extend(combined, child);
      },
      fromBuffer: fromBuffer(types, structs),
      toBuffer: toBuffer(types, structs)
    };
  };

  return {
    errors: errors,
    structs: structs,
    types: types,
    extend: function extend(child) {
      return _extend(definitions, child);
    },

    /**
      @arg {string} typeName lookup struct or type by name
      @arg {Buffer} buf serialized data to be parsed
      @return {object} deserialized object
    */
    fromBuffer: fromBuffer(types, structs),

    /**
      @arg {string} typeName lookup struct or type by name
      @arg {Object} object for serialization
      @return {Buffer} serialized object
    */
    toBuffer: toBuffer(types, structs)
  };
};

var fromBuffer = function fromBuffer(types, structs) {
  return function (typeName, buf) {
    assert.equal(typeof typeName === 'undefined' ? 'undefined' : _typeof(typeName), 'string', 'typeName (type or struct name)');
    if (typeof buf === 'string') {
      buf = Buffer.from(buf, 'hex');
    }
    assert(Buffer.isBuffer(buf), 'expecting buf<hex|Buffer>');

    var type = types[typeName];
    if (type) {
      type = type();
    } else {
      type = structs[typeName];
    }
    assert(type, 'missing type or struct: ' + typeName);
    return Fcbuffer.fromBuffer(type, buf);
  };
};

var toBuffer = function toBuffer(types, structs) {
  return function (typeName, object) {
    assert.equal(typeof typeName === 'undefined' ? 'undefined' : _typeof(typeName), 'string', 'typeName (type or struct name)');
    assert.equal(typeof object === 'undefined' ? 'undefined' : _typeof(object), 'object', 'object');

    var type = types[typeName];
    if (type) {
      type = type();
    } else {
      type = structs[typeName];
    }
    assert(type, 'missing type or struct: ' + typeName);
    return Fcbuffer.toBuffer(type, object);
  };
};

module.exports.fromBuffer = Fcbuffer.fromBuffer;
module.exports.toBuffer = Fcbuffer.toBuffer;