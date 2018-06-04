'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var assert = require('assert');
var ecurve = require('ecurve');
var BigInteger = require('bigi');
var secp256k1 = ecurve.getCurveByName('secp256k1');

var hash = require('./hash');
var keyUtils = require('./key_utils');

var G = secp256k1.G;
var n = secp256k1.n;

module.exports = PublicKey;

/** @param {ecurve.Point} public key */
function PublicKey(Q) {
    if (typeof Q === 'string') {
        var publicKey = PublicKey.fromString(Q);
        assert(publicKey != null, 'Invalid public key');
        return publicKey;
    } else if (Buffer.isBuffer(Q)) {
        return PublicKey.fromBuffer(Q);
    } else if ((typeof Q === 'undefined' ? 'undefined' : _typeof(Q)) === 'object' && Q.Q) {
        return PublicKey(Q.Q);
    }

    assert.equal(typeof Q === 'undefined' ? 'undefined' : _typeof(Q), 'object', 'Invalid public key');
    assert.equal(_typeof(Q.compressed), 'boolean', 'Invalid public key');

    function toBuffer() {
        var compressed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Q.compressed;

        return Q.getEncoded(compressed);
    }

    var pubdata = void 0; // cache

    // /**
    //     @todo secp224r1
    //     @return {string} PUB_K1_base58pubkey..
    // */
    // function toString() {
    //     if(pubdata) {
    //         return pubdata
    //     }
    //     pubdata = `PUB_K1_` + keyUtils.checkEncode(toBuffer(), 'K1')
    //     return pubdata;
    // }

    /** @todo rename to toStringLegacy */
    function toString() {
        return 'EOS' + keyUtils.checkEncode(toBuffer());
    }

    function toUncompressed() {
        var buf = Q.getEncoded(false);
        var point = ecurve.Point.decodeFrom(secp256k1, buf);
        return PublicKey.fromPoint(point);
    }

    /** @deprecated */
    function child(offset) {
        console.error('Deprecated warning: PublicKey.child');

        assert(Buffer.isBuffer(offset), "Buffer required: offset");
        assert.equal(offset.length, 32, "offset length");

        offset = Buffer.concat([toBuffer(), offset]);
        offset = hash.sha256(offset);

        var c = BigInteger.fromBuffer(offset);

        if (c.compareTo(n) >= 0) throw new Error("Child offset went out of bounds, try again");

        var cG = G.multiply(c);
        var Qprime = Q.add(cG);

        if (secp256k1.isInfinity(Qprime)) throw new Error("Child offset derived to an invalid key, try again");

        return PublicKey.fromPoint(Qprime);
    }

    function toHex() {
        return toBuffer().toString('hex');
    }

    return {
        Q: Q,
        toString: toString,
        // toStringLegacy,
        toUncompressed: toUncompressed,
        toBuffer: toBuffer,
        child: child,
        toHex: toHex
    };
}

PublicKey.isValid = function (text) {
    try {
        PublicKey(text);
        return true;
    } catch (e) {
        return false;
    }
};

PublicKey.fromBinary = function (bin) {
    return PublicKey.fromBuffer(new Buffer(bin, 'binary'));
};

PublicKey.fromBuffer = function (buffer) {
    return PublicKey(ecurve.Point.decodeFrom(secp256k1, buffer));
};

PublicKey.fromPoint = function (point) {
    return PublicKey(point);
};

/**
    @arg {string} public_key - like PUB_K1_base58pubkey..
    @return PublicKey or `null` (invalid)
*/
PublicKey.fromString = function (public_key) {
    try {
        return PublicKey.fromStringOrThrow(public_key);
    } catch (e) {
        return null;
    }
};

/**
    @arg {string} public_key - like PUB_K1_base58pubkey..
    @throws {Error} if public key is invalid
    @return PublicKey
*/
PublicKey.fromStringOrThrow = function (public_key) {
    assert(typeof public_key === 'undefined' ? 'undefined' : _typeof(public_key), 'string', 'public_key');
    var match = public_key.match(/^PUB_([A-Za-z0-9]+)_([A-Za-z0-9]+)$/);
    if (match === null) {
        // legacy
        if (/^EOS/.test(public_key)) {
            public_key = public_key.substring(3);
        }
        return PublicKey.fromBuffer(keyUtils.checkDecode(public_key));
    }
    assert(match.length === 3, 'Expecting public key like: PUB_K1_base58pubkey..');

    var _match = _slicedToArray(match, 3),
        keyType = _match[1],
        keyString = _match[2];

    assert.equal(keyType, 'K1', 'K1 private key expected');
    return PublicKey.fromBuffer(keyUtils.checkDecode(keyString, keyType));
};

PublicKey.fromHex = function (hex) {
    return PublicKey.fromBuffer(new Buffer(hex, 'hex'));
};

PublicKey.fromStringHex = function (hex) {
    return PublicKey.fromString(new Buffer(hex, 'hex'));
};