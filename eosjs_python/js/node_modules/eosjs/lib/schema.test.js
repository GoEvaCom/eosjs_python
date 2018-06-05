'use strict';

/* eslint-env mocha */

var assert = require('assert');
var Fcbuffer = require('fcbuffer');
var schema = require('./schema');

describe('schema', function () {
  it('parses', function () {
    var fcbuffer = Fcbuffer(schema);
    var errors = JSON.stringify(fcbuffer.errors, null, 4);
    assert.equal(errors, '[]');
  });
});