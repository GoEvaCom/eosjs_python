/**
 * single- and double-precision floating point implementation test
 *
 * Copyright (C) 2017 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */ 

'use strict';

var fp = require('./');

var isBigeCpu;

var testValues = [

    0, -0, 1, -1, 1e10, -1e10, 1e-10, -1e-10, 123e10, -123e10, 123e-10, -123e-10,
    0.25, Math.pow(2, 40), NaN, Infinity, -Infinity,
    1 * Math.pow(2, 129), 1 * Math.pow(2, -129),
    1.0171355313990822e-45,     // tiny denorm, just 1 bit
    1.102423499998344e-38,      // large denorm, 1.111 2e-127
    6.3382528129361155e+29,     // mantissa carry-out rounding error
    4.2199627472983003e-11,     // FloatLE rounding error
    5e-324,
    1.206082573339918e-308,

    1024,
    192648575.99999553,
    1e203,
    Math.pow(2, 10), Math.pow(2, 100),

    1.1754942807573643e-38,     // 0xFFFFFF / 0x1000000 * Math.pow(2, -126), denorm float that rounds to norm
    8.758115402030107e-47,      // Math.pow(2, -126-27), undersmall value that rounds to zero
    1 + (0xffffffffff / 0x10000000000),                 // 1.ffffffffff, overflows into hidden 1s bit after rounding
];

var tmpbuf = new Buffer(10);
var fpbuf = new Buffer(tmpbuf);
//
// Check that the value val as read/written by nodejs is bit-for-bit identical to ieee-float.
// Type is the operation to tests, one of 'FloatLE', 'FloatBE', 'DoubleLE' or 'DoubleBE'.
//
function checkValue( t, val, type ) {
    var read = 'read' + type;
    var write = 'write' + type;

    if (typeof val === 'number') {
        // nodejs stores NaN from the math library as received, which can be
        // positive/negative/signaling/non-signaling.  Normalize them all to
        // the standard javascript NaN so the bit patterns are identical.
        if (!val && val !== 0) val = NaN;

        tmpbuf[write](val, 0);
        var expect = tmpbuf[read](0);
        fp[write](fpbuf, val);
    }
    else {
        for (var i=0; i<8; i++) tmpbuf[i] = val[i];
        var expect = tmpbuf[read](0);
        fp[write](fpbuf, expect);
    }

    var v2 = fp[read](tmpbuf, 0);
    if (!expect) {
        if (expect !== 0) t.ok(isNaN(v2), "wanted NaN: " + v2);
        else if (expect == 0 && 1/expect < 0) { t.equal(v2, 0); t.equal(1/v2, -Infinity, "wanted -0: " + v2 + ", " + 1/v2); }
        else if (expect == 0 && 1/expect > 0) { t.equal(v2, 0); t.equal(1/v2, +Infinity, "wanted +0: " + v2 + ", " + 1/v2); }
    }
    else t.equal(v2, expect);

    if (expect) {
        // compare non-NaN values directly
        // the compareBytes loop is faster than deepEqual, but use deepEqual for the error message
        if (!compareBytes(fpbuf, tmpbuf, "")) t.deepEqual(fpbuf, tmpbuf, write + " " + expect);
    }
    else {
        // there are many flavors of NaN, check stored (normalized) bit patterns
        // avoid isNaN, it slows the test greatly
        tmpbuf[write](expect, 0);
        if (!compareBytes(fpbuf, tmpbuf, "")) t.deepEqual(fpbuf, tmpbuf, write + " " + expect);
    }
}

function compareBytes( a, b ) {
    for (var i=0; i<8; i++) if (a[i] !== b[i]) return false;
    return true;
}

module.exports = {

    before: function(done) {
        isBigeCpu = fp._getBigeCpu();
        done();
    },

    beforeEach: function(done) {
        // clear temps used by checkValue doubles
        for (var i=0; i<10; i++) {
            tmpbuf[i] = 0;
            fpbuf[i] = 0;
        }
        done();
    },

    'should export expected functions': function(t) {
        var fp = require('./');
        var funcs = ['readWord', 'writeWord', 'writeDoubleWord',
                     'readFloatLE', 'readFloatBE', 'readDoubleLE', 'readDoubleBE',
                     'writeFloatLE', 'writeFloatBE', 'writeDoubleLE', 'writeDoubleBE'];
        for (var i=0; i<funcs.length; i++) {
            t.equal(typeof fp[funcs[i]], 'function');
        }
        t.done();
    },

    'word': {
        'should read word': function(t) {
            var buf = [ 1, 2, 3, 4, 5, 6 ];
            t.equal(fp.readWord(buf, 0), 0x04030201);
            t.equal(fp.readWord(buf, 1), 0x05040302);
            t.equal(fp.readWord(buf, 2), 0x06050403);
            t.ok(isNaN(fp.readWord(buf, 3)));
            t.done();
        },

        'should write word': function(t) {
            var buf = [];
            fp.writeWord(buf, 0x12345678, 1);
            t.deepEqual(buf, [ , 0x78, 0x56, 0x34, 0x12 ]);

            var buf = [];
            fp.writeWord(buf, 0x12345678, 2, 'bige');
            t.deepEqual(buf, [ , , 0x12, 0x34, 0x56, 0x78 ]);

            t.done();
        },

        'should write double word': function(t) {
            var buf = [];
            fp.writeDoubleWord(buf, 0x01020304, 0x05060708, 1);
            t.deepEqual(buf, [ , 8, 7, 6, 5, 4, 3, 2, 1 ]);

            var buf = [];
            fp.writeDoubleWord(buf, 0x01020304, 0x05060708, 3, 'bige');
            t.deepEqual(buf, [ , , , 1, 2, 3, 4, 5, 6, 7, 8 ]);

            t.done();
        },
    },

    'floatArray little-e': {
        'before': function(done) {
            fp._setBigeCpu(false);
            fp._useFloatArray('full');
            done();
        },

        'should read and write values': function(t) {
            var tests = testValues;

            for (var i=0; i<tests.length; i++) {
                checkValue(t, tests[i], 'FloatLE');
                checkValue(t, tests[i], 'FloatBE');
                checkValue(t, tests[i], 'DoubleLE');
                checkValue(t, tests[i], 'DoubleBE');
            }

            t.done();
        },

        'should return zero when reading from out of bounds': function(t) {
            var data = [1,1,1,1];
            var data8 = [1,1,1,1,1,1,1,1];

            t.equal(fp.readFloatLE(data, 1), 0);
            t.equal(fp.readFloatBE(data, 1), 0);
            t.equal(fp.readDoubleLE(data8, 1), 0);
            t.equal(fp.readDoubleBE(data8, 1), 0);

            t.done();
        },
    },

    'floatArray big-e': {
        'before': function(done) {
            fp._setBigeCpu(true);
            fp._useFloatArray('full');
            done();
        },

        'should read and write values': function(t) {
            var data = [0,0,0,0];
            var data8 = [0,0,0,0,0,0,0,0];

            // if the code believes the cpu is big-endian, all BE values will be
            // in storage native (little-e) order, and LE values will be flipped.
            if (isBigeCpu) {
                t.deepEqual((fp.writeFloatLE(data, -1), data), [0, 0, 128, 191]);
                t.deepEqual((fp.readFloatLE(data)), -1);
                t.deepEqual((fp.writeFloatBE(data, -1), data), [191, 128, 0, 0]);
                t.deepEqual((fp.readFloatBE(data)), -1);
                t.deepEqual((fp.writeDoubleLE(data8, -1), data8), [0, 0, 0, 0, 0, 0, 240, 191]);
                t.deepEqual((fp.readDoubleLE(data8)), -1);
                t.deepEqual((fp.writeDoubleBE(data8, -1), data8), [191, 240, 0, 0, 0, 0, 0, 0]);
                t.deepEqual((fp.readDoubleBE(data8)), -1);
            } else {
                t.deepEqual((fp.writeFloatLE(data, -1), data), [0, 0, 128, 191].reverse());
                t.deepEqual((fp.readFloatLE(data)), -1);
                t.deepEqual((fp.writeFloatBE(data, -1), data), [191, 128, 0, 0].reverse());
                t.deepEqual((fp.readFloatBE(data)), -1);
                t.deepEqual((fp.writeDoubleLE(data8, -1), data8), [0, 0, 0, 0, 0, 0, 240, 191].reverse());
                t.deepEqual((fp.readDoubleLE(data8)), -1);
                t.deepEqual((fp.writeDoubleBE(data8, -1), data8), [191, 240, 0, 0, 0, 0, 0, 0].reverse());
                t.deepEqual((fp.readDoubleBE(data8)), -1);
            }

            t.done();
        },

        'should return zero when reading from out of bounds': function(t) {
            var data = [1,1,1,1];
            var data8 = [1,1,1,1,1,1,1,1];

            t.equal(fp.readFloatLE(data, 1), 0);
            t.equal(fp.readFloatBE(data, 1), 0);
            t.equal(fp.readDoubleLE(data8, 1), 0);
            t.equal(fp.readDoubleBE(data8, 1), 0);

            t.done();
        },
    },

    'js': {
        'before': function(done) {
            fp._setBigeCpu(false);
            fp._useFloatArray(false);
            done();
        },

        'read and write float': function(t) {
            var tests = testValues;

            for (var i=0; i<tests.length; i++) {
                checkValue(t, tests[i], 'FloatLE');
                checkValue(t, tests[i], 'FloatBE');
            }

            t.done();
        },

        'read and write double': function(t) {
            var tests = testValues;

            for (var i=0; i<tests.length; i++) {
                checkValue(t, tests[i], 'DoubleLE');
                checkValue(t, tests[i], 'DoubleBE');
            }

            t.done();
        },

        'synthetic dataset': function(t) {
            // suffix bits xxx to form to binary fractions 1.xxx, eg 1.001, 1.010, 1.100, 1.110, 1.111.
            // The suffix bits are positioned 1-3, 18-21, 19-22 etc binary places after the fraction point.
            var bitset = [0, 0x001, 0x010, 0x100, 0x110, 0x111];
            // Suffix bit positions to test mantissa encoding, 32-bit float rounding
            var bitoffsets = [3, 21, 22, 23, 31, 32, 33, 51, 52, 53];

            for (var base = -1078; base < 1025; base++) {
                for (var bits=0; bits<bitset.length; bits++) {
                    for (var bitoffs=0; bitoffs<bitoffsets.length; bitoffs++) {
                        // test with a walking "1.00...0xxx" pattern, with bitpos fraction digits
                        var bitval = bitset[bits];
                        var bitpos = bitoffsets[bitoffs];

                        var val = (1 + bitval * Math.exp(2, -bitpos)) * Math.pow(2, base);
                        checkValue(t, val, 'FloatLE');
                        checkValue(t, val, 'FloatBE');
                        checkValue(t, val, 'DoubleLE');
                        checkValue(t, val, 'DoubleBE');

                        // test with the bit pattern itself
                        var val = (bitval) * Math.pow(2, base);
                        checkValue(t, val, 'FloatLE');
                        checkValue(t, val, 'FloatBE');
                        checkValue(t, val, 'DoubleLE');
                        checkValue(t, val, 'DoubleBE');
                    }
                }
            }

            t.done();
        },

        'fuzz test float': function(t) {
            for (var pow = -128; pow <= 128; pow++) {
                for (var i=0; i<1000; i++) {
                    // generate a random value between 2^(pow-3) and 2^(pow+3)
                    var val = Math.pow(2, pow + ((Math.random() + 1) * 4) - 5);
                    checkValue(t, val, 'FloatLE');
                }
            }
            // denorms
            for (var pow = -151; pow <= -126; pow++) {
                for (var i=0; i<1000; i++) {
                    var val = Math.pow(2, pow + ((Math.random() + 1) * 4) - 5);
                    checkValue(t, val, 'FloatBE');
                }
            }
            t.done();
        },

        'fuzz test double': function(t) {
            for (var pow = -1024; pow <= 1024; pow++) {
                for (var i=0; i<400; i++) {
                    var val = Math.pow(2, pow + ((Math.random() + 1) * 4) - 5);
                    checkValue(t, val, 'DoubleLE');
                }
            }
            // denorms
            for (var pow = -1076; pow <= -1024; pow++) {
                for (var i=0; i<1000; i++) {
                    var val = Math.pow(2, pow + ((Math.random() + 1) * 4) - 5);
                    checkValue(t, val, 'DoubleBE');
                }
            }
            t.done();
        },

        'edge cases': {
            'read float from past buffer bounds': function(t) {
                var buf = [0x3f, 0xc0, 0, 0];  // 1.5
                t.equal(fp.readFloatBE(buf, 0), 1.5);
                t.equal(fp.readFloatBE(buf, -1), 0);
                t.equal(fp.readFloatBE(buf, 1), 0);
                t.done();
            },

            'read double from past buffer bounds': function(t) {
                var buf = [0x3f, 0xf8, 0, 0, 0, 0, 0, 0];  // 1.5
                t.equal(fp.readDoubleBE(buf, 0), 1.5);
                t.equal(fp.readDoubleBE(buf, -1), 0);
                t.equal(fp.readDoubleBE(buf, 1), 0);
                t.done();
            },

            'rounded denorm float overflows into hidden 1 bit': function(t) {
                var buf = [0, 0, 0, 0];
                var x = (0xFFFFFF / 0x1000000) * Math.pow(2, -126);
                t.notEqual(x, Math.pow(2, -126));
                fp.writeFloatBE(buf, x);
                t.equal(fp.readFloatBE(buf).toString(16), Math.pow(2, -126).toString(16));
                t.done();
            },
        },

        'comprehensive test float': function(t) {
            // 2017-12-24:  all 2^32 bit patterns:  X exhaustive test float (4559260.818ms)

            var a, b, c, d, ci, di;
            var midDigits = [ 0, 1, 2, 127, 128, 129, 254, 255 ];
            var valbuf = new Buffer([0,0,0,0,0,0,0,0]);

            // test read/write of all floating-point values [ 0x12, 0x34, 0x56, 0x78 ]
            // float32: 1 sign + 8 exponent + (1 implied mantissa 1 bit) + 23 stored mantissa bits
            // As an optimization, omit testing most of the redundant middle digit possibilities,
            // focus on zero and carry-out.
            for (a=0; a<128; a++) {
            for (b=0; b<256; b+=64) {
            for (ci=0; ci<midDigits.length; ci++) {
                c = midDigits[ci];
            for (di=0; di<midDigits.length; di++) {
                d = midDigits[di];

                valbuf[0] = a; valbuf[1] = b; valbuf[2] = c; valbuf[3] = d;
                checkValue(t, valbuf, 'FloatBE');

                valbuf[0] = d; valbuf[1] = c; valbuf[2] = b; valbuf[3] = a;
                checkValue(t, valbuf, 'FloatLE');
            }}}
            }

            t.done();
        },

        'comprehensive test double': function(t) {
            var a, b, c, d, e, f, g, h, ai, bi, ci, di, ei, fi, gi, hi;
            // mantissa digits to test with
            // faster with fewer digits; per a:  6=17 sec, 5=5.47 sec, 4=2.12, 3=0.27, 2=0.03
            var highDigits = [ 0, 1, 2, 127, 128, 129, 254, 255 ];
            var midDigits = [ 0, 1, 128, 254, 255 ];
            var midDigits = [ 0, 255 ];
            // exponent least significant digits to test with
            var exponentDigits = [ 0, 1, 2, 3, 4, 7, 15, 63, 127, 128, 252, 253, 254, 255 ];
            var valbuf = new Buffer([0,0,0,0,0,0,0,0]);

            // double64: 1 bit sign + 11 bits exponent + (1 implied mantissa 1 bit) + 52 stored mantissa bits
            // float is 1 sign + 8 exponent + (1 implied mantissa 1 bit) + 23 stored mantissa bits
            // As an optimization, omit testing most of the redundant middle digit possibilities,
            // focus on zero and carry-out.
            for (a=0; a<128; a++) {                         // sign and exponent high bits
            for (bi=0; bi<exponentDigits.length; bi++) {    // exponent low bits
                b = exponentDigits[bi];
            for (ci=0; ci<highDigits.length; ci++) {        // mantissa high bits
                c = highDigits[ci];
            for (di=0; di<midDigits.length; di++) {         // mantissa bits
                d = midDigits[di];
            for (ei=0; ei<midDigits.length; ei++) {
                e = midDigits[ei];
            for (fi=0; fi<midDigits.length; fi++) {
                f = midDigits[fi];
            for (gi=0; gi<midDigits.length; gi++) {
                g = midDigits[gi];
            for (hi=0; hi<midDigits.length; hi++) {         // mantissa lsb bits
                h = midDigits[hi];

                valbuf[0] = a; valbuf[1] = b; valbuf[2] = c; valbuf[3] = d;
                valbuf[4] = e; valbuf[5] = f; valbuf[6] = g; valbuf[7] = h;
                checkValue(t, valbuf, 'DoubleBE');

                valbuf[0] = h; valbuf[1] = g; valbuf[2] = f; valbuf[3] = e;
                valbuf[4] = d; valbuf[5] = c; valbuf[6] = b; valbuf[7] = a;
                checkValue(t, valbuf, 'DoubleLE');
            }}}}}}}
            }

            t.done();
        },
    },
}
