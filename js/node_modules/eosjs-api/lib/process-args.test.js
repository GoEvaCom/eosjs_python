'use strict';

/* eslint-env mocha */
var assert = require('assert');
var processArgs = require('./process-args');

describe('Process Args', function () {

  var args = [1, 2];
  var argNames = ['arg1', 'arg2'];

  it('promise', function () {
    var r = processArgs(args, argNames);
    r.callback();
    return r.returnPromise;
  });

  it('arg array', function () {
    var r1 = processArgs(args, argNames, 'method');
    assert.equal(r1.params.arg1, 1);
    assert.equal(r1.params.arg2, 2);
  });

  it('arg object', function () {
    var r1 = processArgs([{ arg1: 1, arg2: 2 }], argNames, 'method');
    assert.equal(r1.params.arg1, 1);
    assert.equal(r1.params.arg2, 2);
  });

  it('options', function () {
    var argsOption = [1, 2, { options: true }];

    // has option but no optionFormater
    throws(function () {
      return processArgs(argsOption, argNames, 'method');
    }, /expecting 2 parameters but 3 where provided/);

    var optionsFormatter = function optionsFormatter(option) {
      return option;
    };

    var r = processArgs(argsOption, argNames, 'method', optionsFormatter);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2 });
    assert.deepEqual(r.options, { options: true });
  });

  it('callback', function (done) {
    var callback = function callback(err, res) {
      if (!err) {
        done();
      } else {
        console.error(err);
      }
    };
    var argsCallback = [1, 2, callback];

    var r = processArgs(argsCallback, argNames);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2 });
    r.callback();
  });

  it('callback object', function (done) {
    var callback = function callback(err, res) {
      if (!err) {
        done();
      } else {
        console.error(err);
      }
    };
    var argsCallback = [{ arg1: 1, arg2: 2, arg3: 3 }, callback];

    var r = processArgs(argsCallback, ['arg1', 'arg2', 'arg3']);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2, arg3: 3 });
    r.callback();
  });

  it('callback error', function (done) {
    var callback = function callback(err, res) {
      if (err) {} else {
        throw 'expecting error';
      }
    };
    var argsCallback = [1, 2, callback];

    var r = processArgs(argsCallback, argNames);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2 });
    r.callback('error');
    done();
    // r.returnPromise.catch(error => {done()})
  });

  it('array with options and callback', function (done) {
    var callback = function callback(err, res) {
      if (!err) {
        done();
      } else {
        console.error(err);
      }
    };
    var argsOptionCallback = [1, 2, { options: true }, callback];
    var optionsFormatter = function optionsFormatter(option) {
      return option;
    };

    var r = processArgs(argsOptionCallback, argNames, 'method', optionsFormatter);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2 });
    assert.equal(r.options.options, true);
    r.callback();
  });

  it('object with options and callback', function (done) {
    var callback = function callback(err, res) {
      if (!err) {
        done();
      } else {
        console.error(err);
      }
    };
    var argsOptionCallback = [{ arg1: 1, arg2: 2 }, { options: true }, callback];
    var optionsFormatter = function optionsFormatter(option) {
      return option;
    };

    var r = processArgs(argsOptionCallback, argNames, 'method', optionsFormatter);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2 });
    assert.equal(r.options.options, true);
    r.callback();
  });

  it('object with missing options', function () {
    var argsOptionCallback = [{ arg1: 1, arg2: 2 }];
    var optionsFormatter = function optionsFormatter(option) {
      return option;
    };

    var r = processArgs(argsOptionCallback, argNames, 'method', optionsFormatter);
    assert.deepEqual(r.params, { arg1: 1, arg2: 2 });
    r.callback();
    return r.returnPromise;
  });
});

/* istanbul ignore next */
function throws(fn, match) {
  try {
    fn();
    assert(false, 'Expecting error');
  } catch (error) {
    if (!match.test(error)) {
      error.message = 'Error did not match ' + match + '\n' + error.message;
      throw error;
    }
  }
}