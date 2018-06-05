// to run:  npm install qtimeit qunpack ieee754 @protobufjs/float ; npm run benchmark

'use strict';

var qtimeit = require('qtimeit');

var fp = require('./');
try { var qunpack = require('qunpack') } catch (e) { }
try { var ieee754 = require('ieee754') } catch (e) { }
try { var jsfloat = require('@protobufjs/float') } catch (e) { }


var ix = 0;
var buf1 = new Buffer(10), buf2 = new Buffer(10);
buf1.writeFloatBE(3.5, 2);
buf2.writeFloatBE(7.5, 2);
var getBuff = function(){ return (ix++ & 1) ? buf2 : buf1 };
var bigbuf1 = new Buffer(10), bigbuf2 = new Buffer(10);
bigbuf1.writeDoubleBE(3.5, 2);
bigbuf2.writeDoubleBE(7.5, 2);
var getBigBuff = function(){ return (ix++ & 1) ? bigbuf2 : bigbuf1 };

var arr1 = new Array(buf1.length);
var arr2 = new Array(buf2.length);
for (var i=0; i<buf1.length; i++) { arr1[i] = buf1[i]; arr2[i] = buf2[i] }
var getArr = function(){ return (ix++ & 1) ? arr2 : arr1 };

var getValue = function(){ return (ix++ & 1) ? 3.5 : 7.5 };
var getBigValue = function(){ return ix++ & 1 ? 1e20 : 2e20 };

// test with uniformly distributed numbers
var di, dataset = new Array(), bufset = new Array(), bigbufset = new Array();
for (var i=-200; i<200; i++) {
    var val = Math.pow(10, i);
    dataset.push(val);
    var buf = new Buffer(8); buf.writeFloatBE(val, 0);
    bufset.push(buf);
    var buf = new Buffer(8); buf.writeDoubleBE(val, 0);
    bigbufset.push(buf);
}
function getValue(){ return di < dataset.length ? dataset[di++] : dataset[di = 0] }
function getBuf(){ return di < bufset.length ? bufset[di++] : bufset[di = 0] }
function getBigBuf(){ return di < bigbufset.length ? bigbufset[di++] : bigbufset[di = 0] }

var x;
var tmpbuf = new Buffer(10);
qtimeit.bench.timeGoal = .2;
qtimeit.bench.showRunDetails = false;
qtimeit.bench.showTestInfo = true;
qtimeit.bench.visualize = true;
qtimeit.bench.baselineAvg = 40000000;
// use callbacks to avoid memory management overhead
var tests = {

    'nodejs read float': function(cb) { x = getBuf().readFloatBE(0); cb(); },
    'ieee-float read float': function(cb) { x = fp.readFloatBE(getBuf(), 0); cb(); },

    'nodejs write float': function(cb) { tmpbuf.writeFloatBE(getValue(), 0); cb(); },
    'ieee-float write float': function(cb) { fp.writeFloatBE(tmpbuf, getValue(), 0); cb(); },

    'nodejs read double': function(cb) { x = getBigBuf().readDoubleBE(0); cb(); },
    'ieee-float read double': function(cb) { x = fp.readDoubleBE(getBigBuf()); cb(); },

    'nodejs write double': function(cb) { tmpbuf.writeDoubleBE(getValue(), 0); cb(); },
    'ieee-float write double': function(cb) { fp.writeDoubleBE(tmpbuf, getValue()); cb(); },

///**
    'nodejs': function(cb) {
        x = getBuff().readFloatBE(2);
        cb();
    },

    'nodejs write': function(cb) {
        x = tmpbuf.writeFloatBE(getValue(), 0);
        cb();
    },

    'nodejs double': function(cb) {
        x = getBigBuff().readDoubleBE(2);
        cb();
    },

    'nodejs double write': function(cb) {
        x = tmpbuf.writeDoubleBE(getValue(), 0);
        cb();
    },

    'nodejs write big': function(cb) {
        x = tmpbuf.writeFloatBE(getBigValue(), 0);
        cb();
    },

    'nodejs write double big': function(cb) {
        x = tmpbuf.writeDoubleBE(getBigValue(), 0);
        cb();
    },

    'fp': function(cb) {
        x = fp.readFloatBE(getBuff(), 2);
        cb();
    },

    'fp write': function(cb) {
        x = fp.writeFloatBE(getBuff(), getValue(), 2);
        cb();
    },

    'fp write big': function(cb) {
        x = fp.writeFloatBE(getBuff(), 1e20, 2);
        cb();
    },

    'fp write huge': function(cb) {
        x = fp.writeFloatBE(getBuff(), 1e100, 2);
        cb();
    },

    'fp write tiny': function(cb) {
        x = fp.writeFloatBE(getBuff(), 1e-20, 2);
        cb();
    },

    'fp double': function(cb) {
        x = fp.readDoubleBE(getBigBuff(), 2);
        cb();
    },

    'fp double write': function(cb) {
        x = fp.writeDoubleBE(getBigBuff(), getValue(), 2);
        cb();
    },

    'fp double write big': function(cb) {
        x = fp.writeDoubleBE(getBigBuff(), 1e20, 2);
        cb();
    },

    'fp double write huge': function(cb) {
        x = fp.writeDoubleBE(getBigBuff(), 1e100, 2);
        cb();
    },

    'fp double write tiny': function(cb) {
        x = fp.writeDoubleBE(getBigBuff(), 1e-20, 2);
        cb();
    },
/**/
};
if (0 && qunpack) {
    tests['qunpack'] = function(cb) {
        x = qunpack.unpack('xxf', getBuff());
        cb();
    };
}
if (0 && jsfloat) {
    tests['jsfloat'] = function(cb) {
        x = jsfloat.readFloatBE(getBuff(), 2);
        cb();
    };

    tests['jsfloat write'] = function(cb) {
        x = jsfloat.writeFloatBE(getValue(), tmpbuf, 2);
        cb();
    };

    tests['jsfloat double'] = function(cb) {
        x = jsfloat.readDoubleBE(getBigBuff(), 2);
        cb();
    };

    tests['jsfloat double write'] = function(cb) {
        x = jsfloat.writeDoubleBE(getValue(), tmpbuf, 2);
        cb();
    };

    tests['jsfloat write big'] = function(cb) {
        x = jsfloat.writeDoubleBE(1e20, tmpbuf, 2);
        cb();
    };

    tests['jsfloat 2'] = function(cb) {
        x = jsfloat.readFloatBE(getBuff(), 2);
        cb();
    };

    tests['jsfloat write 2'] = function(cb) {
        x = jsfloat.writeFloatBE(getValue(), tmpbuf, 2);
        cb();
    };

    tests['jsfloat double 2'] = function(cb) {
        x = jsfloat.readDoubleBE(getBigBuff(), 2);
        cb();
    };

    tests['jsfloat double write 2'] = function(cb) {
        x = jsfloat.writeDoubleBE(getValue(), tmpbuf, 2);
        cb();
    };

    tests['jsfloat write big 2'] = function(cb) {
        x = jsfloat.writeDoubleBE(1e20, tmpbuf, 2);
        cb();
    };
}
if (0 && ieee754) {
    tests['ieee754'] = function(cb) {
        x = ieee754.read(getBuff(), 2, 'big', 23, 4);
        cb();
    };

    tests['ieee754 write'] = function(cb) {
        x = ieee754.write(tmpbuf, getValue(), 2, 'big', 23, 4);
        cb();
    };

    tests['ieee754 double'] = function(cb) {
        x = ieee754.read(getBigBuff(), 2, 'big', 52, 8);
        cb();
    };

    tests['ieee754 double write'] = function(cb) {
        x = ieee754.write(tmpbuf, getValue(), 2, 'big', 52, 8);
        cb();
    };

    tests['ieee754 write big'] = function(cb) {
        x = ieee754.write(tmpbuf, 1e20, 2, 'big', 23, 4);
        cb();
    };
}
qtimeit.bench(tests, function(err) {
//    console.log(x);
});
