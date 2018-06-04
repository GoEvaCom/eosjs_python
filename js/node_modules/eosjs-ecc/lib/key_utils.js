'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var base58 = require('bs58');
var assert = require('assert');
var randomBytes = require('randombytes');

var hash = require('./hash');

module.exports = {
    random32ByteBuffer: random32ByteBuffer,
    addEntropy: addEntropy,
    cpuEntropy: cpuEntropy,
    entropyCount: function entropyCount() {
        return _entropyCount;
    },
    checkDecode: checkDecode,
    checkEncode: checkEncode
};

var entropyPos = 0,
    _entropyCount = 0;

var externalEntropyArray = randomBytes(101);

/**
    Additional forms of entropy are used.  A week random number generator can run out of entropy.  This should ensure even the worst random number implementation will be reasonably safe.

    @arg {number} [cpuEntropyBits = 0] generate entropy on the fly.  This is
    not required, entropy can be added in advanced via addEntropy or initialize().

    @arg {boolean} [safe = true] false for testing, otherwise this will be
    true to ensure initialize() was called.

    @return a random buffer obtained from the secure random number generator.  Additional entropy is used.
*/
function random32ByteBuffer() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$cpuEntropyBits = _ref.cpuEntropyBits,
        cpuEntropyBits = _ref$cpuEntropyBits === undefined ? 0 : _ref$cpuEntropyBits,
        _ref$safe = _ref.safe,
        safe = _ref$safe === undefined ? true : _ref$safe;

    assert(typeof cpuEntropyBits === 'undefined' ? 'undefined' : _typeof(cpuEntropyBits), 'number', 'cpuEntropyBits');
    assert(typeof safe === 'undefined' ? 'undefined' : _typeof(safe), 'boolean', 'boolean');

    if (safe) {
        assert(_entropyCount >= 128, 'Call initialize() to add entropy');
    }

    // if(entropyCount > 0) {
    //     console.log(`Additional private key entropy: ${entropyCount} events`)
    // }

    var hash_array = [];
    hash_array.push(randomBytes(32));
    hash_array.push(Buffer.from(cpuEntropy(cpuEntropyBits)));
    hash_array.push(externalEntropyArray);
    hash_array.push(browserEntropy());
    return hash.sha256(Buffer.concat(hash_array));
}

/**
    Adds entropy.  This may be called many times while the amount of data saved
    is accumulatively reduced to 101 integers.  Data is retained in RAM for the
    life of this module.

    @example React <code>
    componentDidMount() {
        this.refs.MyComponent.addEventListener("mousemove", this.onEntropyEvent, {capture: false, passive: true})
    }
    componentWillUnmount() {
        this.refs.MyComponent.removeEventListener("mousemove", this.onEntropyEvent);
    }
    onEntropyEvent = (e) => {
        if(e.type === 'mousemove')
            key_utils.addEntropy(e.pageX, e.pageY, e.screenX, e.screenY)
        else
            console.log('onEntropyEvent Unknown', e.type, e)
    }
    </code>
*/
function addEntropy() {
    assert.equal(externalEntropyArray.length, 101, 'externalEntropyArray');

    for (var _len = arguments.length, ints = Array(_len), _key = 0; _key < _len; _key++) {
        ints[_key] = arguments[_key];
    }

    _entropyCount += ints.length;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = ints[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var i = _step.value;

            var pos = entropyPos++ % 101;
            var i2 = externalEntropyArray[pos] += i;
            if (i2 > 9007199254740991) externalEntropyArray[pos] = 0;
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
}

/**
    This runs in just under 1 second and ensures a minimum of cpuEntropyBits
    bits of entropy are gathered.

    Based on more-entropy. @see https://github.com/keybase/more-entropy/blob/master/src/generator.iced

    @arg {number} [cpuEntropyBits = 128]
    @return {array} counts gathered by measuring variations in the CPU speed during floating point operations.
*/
function cpuEntropy() {
    var cpuEntropyBits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;

    var collected = [];
    var lastCount = null;
    var lowEntropySamples = 0;
    while (collected.length < cpuEntropyBits) {
        var count = floatingPointCount();
        if (lastCount != null) {
            var delta = count - lastCount;
            if (Math.abs(delta) < 1) {
                lowEntropySamples++;
                continue;
            }
            // how many bits of entropy were in this sample
            var bits = Math.floor(log2(Math.abs(delta)) + 1);
            if (bits < 4) {
                if (bits < 2) {
                    lowEntropySamples++;
                }
                continue;
            }
            collected.push(delta);
        }
        lastCount = count;
    }
    if (lowEntropySamples > 10) {
        var pct = Number(lowEntropySamples / cpuEntropyBits * 100).toFixed(2);
        // Is this algorithm getting inefficient?
        console.warn('WARN: ' + pct + '% low CPU entropy re-sampled');
    }
    return collected;
}

/**
    @private
    Count while performing floating point operations during a fixed time
    (7 ms for example).  Using a fixed time makes this algorithm
    predictable in runtime.
*/
function floatingPointCount() {
    var workMinMs = 7;
    var d = Date.now();
    var i = 0,
        x = 0;
    while (Date.now() < d + workMinMs + 1) {
        x = Math.sin(Math.sqrt(Math.log(++i + x)));
    }
    return i;
}

var log2 = function log2(x) {
    return Math.log(x) / Math.LN2;
};

/**
    @private
    Attempt to gather and hash information from the browser's window, history, and supported mime types.  For non-browser environments this simply includes secure random data.  In any event, the information is re-hashed in a loop for 25 milliseconds seconds.

    @return {Buffer} 32 bytes
*/
function browserEntropy() {
    var entropyStr = Array(randomBytes(101)).join();
    try {
        entropyStr += new Date().toString() + " " + window.screen.height + " " + window.screen.width + " " + window.screen.colorDepth + " " + " " + window.screen.availHeight + " " + window.screen.availWidth + " " + window.screen.pixelDepth + navigator.language + " " + window.location + " " + window.history.length;

        for (var i = 0, mimeType; i < navigator.mimeTypes.length; i++) {
            mimeType = navigator.mimeTypes[i];
            entropyStr += mimeType.description + " " + mimeType.type + " " + mimeType.suffixes + " ";
        }
    } catch (error) {
        //nodejs:ReferenceError: window is not defined
        entropyStr += hash.sha256(new Date().toString());
    }

    var b = new Buffer(entropyStr);
    entropyStr += b.toString('binary') + " " + new Date().toString();

    var entropy = entropyStr;
    var start_t = Date.now();
    while (Date.now() - start_t < 25) {
        entropy = hash.sha256(entropy);
    }return entropy;
}

/**
  @arg {Buffer} keyBuffer data
  @arg {string} keyType = sha256x2, K1, etc
  @return {string} checksum encoded base58 string
*/
function checkEncode(keyBuffer) {
    var keyType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    assert(Buffer.isBuffer(keyBuffer), 'expecting keyBuffer<Buffer>');
    if (keyType === 'sha256x2') {
        // legacy
        var checksum = hash.sha256(hash.sha256(keyBuffer)).slice(0, 4);
        return base58.encode(Buffer.concat([keyBuffer, checksum]));
    } else {
        var check = [keyBuffer];
        if (keyType) {
            check.push(Buffer.from(keyType));
        }
        var _checksum = hash.ripemd160(Buffer.concat(check)).slice(0, 4);
        return base58.encode(Buffer.concat([keyBuffer, _checksum]));
    }
}

/**
  @arg {Buffer} keyString data
  @arg {string} keyType = sha256x2, K1, etc
  @return {string} checksum encoded base58 string
*/
function checkDecode(keyString) {
    var keyType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    assert(keyString != null, 'private key expected');
    var buffer = new Buffer(base58.decode(keyString));
    var checksum = buffer.slice(-4);
    var key = buffer.slice(0, -4);

    var newCheck = void 0;
    if (keyType === 'sha256x2') {
        // legacy
        newCheck = hash.sha256(hash.sha256(key)).slice(0, 4); // WIF (legacy)
    } else {
        var check = [key];
        if (keyType) {
            check.push(Buffer.from(keyType));
        }
        newCheck = hash.ripemd160(Buffer.concat(check)).slice(0, 4); //PVT
    }

    if (checksum.toString() !== newCheck.toString()) {
        throw new Error('Invalid checksum, ' + (checksum.toString('hex') + ' != ' + newCheck.toString('hex')));
    }

    return key;
}