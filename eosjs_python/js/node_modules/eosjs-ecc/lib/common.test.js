'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-env mocha */
var assert = require('assert');

var ecc = require('.');

var wif = '5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss';

describe('Common API', function () {
  it('unsafeRandomKey', async function () {
    var pvt = await ecc.unsafeRandomKey();
    assert.equal(typeof pvt === 'undefined' ? 'undefined' : _typeof(pvt), 'string', 'pvt');
    assert(/^5[HJK]/.test(wif));
    // assert(/^PVT_K1_/.test(pvt)) // todo
  });

  it('seedPrivate', function () {
    assert.equal(ecc.seedPrivate(''), wif);
    // assert.equal(ecc.seedPrivate(''), 'PVT_K1_2jH3nnhxhR3zPUcsKaWWZC9ZmZAnKm3GAnFD1xynGJE1Znuvjd')
  });

  it('privateToPublic', function () {
    // const pub = 'PUB_K1_859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2Ht7beeX'
    var pub = 'EOS859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2HqhToVM';
    assert.equal(ecc.privateToPublic(wif), pub);
  });

  it('isValidPublic', function () {
    var keys = [[true, 'PUB_K1_859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2Ht7beeX'], [true, 'EOS859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2HqhToVM'], [false, 'MMM859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2HqhToVM'], [false, 'EOS859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2HqhToVm']];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        assert.equal(key[0], ecc.isValidPublic(key[1]), key[1]);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });

  it('isValidPrivate', function () {
    var keys = [[true, '5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss'], [false, '5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjsm']];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var key = _step2.value;

        assert.equal(key[0], ecc.isValidPrivate(key[1]), key[1]);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  });

  it('hashs', function () {
    var hashes = [
    // ['sha1', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'],
    ['sha256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = hashes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var hash = _step3.value;

        assert.equal(ecc[hash[0]](''), hash[1]);
        assert.equal(ecc[hash[0]](Buffer.from('')), hash[1]);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  });

  it('signatures', function () {
    var pvt = ecc.seedPrivate('');
    var pubkey = ecc.privateToPublic(pvt);

    var data = 'hi';
    var dataSha256 = ecc.sha256(data);

    var sigs = [ecc.sign(data, pvt), ecc.signHash(dataSha256, pvt)];

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = sigs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var sig = _step4.value;

        assert(ecc.verify(sig, data, pubkey), 'verify data');
        assert(ecc.verifyHash(sig, dataSha256, pubkey), 'verify hash');
        assert.equal(pubkey, ecc.recover(sig, data), 'recover from data');
        assert.equal(pubkey, ecc.recoverHash(sig, dataSha256), 'recover from hash');
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  });
});

describe('Common API (initialized)', function () {
  it('initialize', function () {
    return ecc.initialize();
  });

  it('randomKey', function () {
    var cpuEntropyBits = 1;
    ecc.key_utils.addEntropy(1, 2, 3);
    var pvt = ecc.unsafeRandomKey().then(function (pvt) {
      assert.equal(typeof pvt === 'undefined' ? 'undefined' : _typeof(pvt), 'string', 'pvt');
      assert(/^5[HJK]/.test(wif));
      // assert(/^PVT_K1_/.test(pvt))
    });
  });
});