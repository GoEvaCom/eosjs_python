'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var assert = require('assert');
var Structs = require('./structs');

module.exports = AssetCache;

function AssetCache(network) {
  var cache = {
    'SYS@eosio.token': { precision: 4 },
    'EOS@eosio.token': { precision: 4 }

    /**
      @return {Promise} {precision}
      @throws AssertionError
    */
  };function lookupAsync(symbol, contract) {
    assert(symbol, 'required symbol');
    assert(contract, 'required contract');

    if (contract === 'eosio') {
      contract = 'eosio.token';
    }

    var extendedAsset = symbol + '@' + contract;

    if (cache[extendedAsset] != null) {
      return Promise.resolve(cache[extendedAsset]);
    }

    var statsPromise = network.getCurrencyStats(contract, symbol).then(function (result) {
      var stats = result[symbol];
      if (!stats) {
        cache[extendedAsset] = null; // retry (null means no asset was observed)
        // console.log(`Missing currency stats for asset: ${extendedAsset}`)
        return;
      }

      var max_supply = stats.max_supply;


      assert.equal(typeof max_supply === 'undefined' ? 'undefined' : _typeof(max_supply), 'string', 'Expecting max_supply string in currency stats: ' + result);

      assert(new RegExp('^[0-9]+(.[0-9]+)? ' + symbol + '$').test(max_supply), 'Expecting max_supply string like 10000.0000 SYS, instead got: ' + max_supply);

      var _max_supply$split = max_supply.split(' '),
          _max_supply$split2 = _slicedToArray(_max_supply$split, 1),
          supply = _max_supply$split2[0];

      var _supply$split = supply.split('.'),
          _supply$split2 = _slicedToArray(_supply$split, 2),
          _supply$split2$ = _supply$split2[1],
          decimalstr = _supply$split2$ === undefined ? '' : _supply$split2$;

      var precision = decimalstr.length;

      assert(precision >= 0 && precision <= 18, 'unable to determine precision from string: ' + max_supply);

      return cache[extendedAsset] = { precision: precision };
    });

    promises.push(statsPromise);

    return cache[extendedAsset] = statsPromise;
  }

  /**
    @return {Object} {precision}, or null asset did not exist,
      or undefined = unknown if asset exists (call lookupAsync)
  */
  function lookup(symbol, contract) {
    assert(symbol, 'required symbol');
    assert(contract, 'required contract');

    if (contract === 'eosio') {
      contract = 'eosio.token';
    }

    var extendedAsset = symbol + '@' + contract;

    var c = cache[extendedAsset];

    if (c instanceof Promise) {
      return undefined; // pending
    }

    return c;
  }

  return {
    lookupAsync: lookupAsync,
    lookup: lookup
  };
}

var promises = [];

AssetCache.resolve = function _callee() {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(Promise.all(promises));

        case 2:
          promises = [];

        case 3:
        case 'end':
          return _context.stop();
      }
    }
  }, null, this);
};

AssetCache.pending = function () {
  return promises.length !== 0;
};