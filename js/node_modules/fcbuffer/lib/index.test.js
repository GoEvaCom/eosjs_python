'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-env mocha */
var assert = require('assert');
var ByteBuffer = require('bytebuffer');

var Fcbuffer = require('.');
var Types = require('./types');
var Struct = require('./struct');

var _require = require('./fcbuffer'),
    create = _require.create;

describe('API', function () {
  it('bytes', function () {
    var _Types = Types(),
        bytes = _Types.bytes;

    var type = bytes();
    assertSerializer(type, '00aaeeff');
    assertRequired(type);
  });

  it('string', function () {
    var _Types2 = Types(),
        string = _Types2.string;

    var type = string();
    assertSerializer(type, '爱');
    assertRequired(type);
  });

  it('vector', function () {
    var _Types3 = Types(),
        vector = _Types3.vector,
        string = _Types3.string;

    throws(function () {
      return vector('string');
    }, /vector type should be a serializer/);
    var unsortedVector = vector(string(), false);

    assert.deepEqual(unsortedVector.fromObject(['z', 'z']), ['z', 'z']); // allows duplicates
    assert.deepEqual(unsortedVector.fromObject(['z', 'a']), ['z', 'a']); // does not sort
    assertSerializer(unsortedVector, ['z', 'a']);

    var sortedVector = vector(string(), true);
    assert.deepEqual(sortedVector.fromObject(['z', 'a']), ['a', 'z']); //sorts
    assertSerializer(sortedVector, ['a', 'z']);

    // null object converts to an empty vector
    var stringVector = vector(string());
    var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    stringVector.appendByteBuffer(b, null);
    assert.deepEqual(stringVector.fromObject(null), []);
    assert.deepEqual(stringVector.toObject(null), []);
  });

  it('FixedBytes', function () {
    var _Types4 = Types(),
        fixed_bytes16 = _Types4.fixed_bytes16;

    var type = fixed_bytes16();
    assertSerializer(type, Array(16 + 1).join('ff')); // hex string
    throws(function () {
      return assertSerializer(type, Array(17 + 1).join('ff'));
    }, /fixed_bytes16 length 17 does not equal 16/);
    assertRequired(type);
  });

  it('FixedString', function () {
    var _Types5 = Types(),
        fixed_string16 = _Types5.fixed_string16;

    var type = fixed_string16();
    assertSerializer(type, '1234567890123456');
    throws(function () {
      return assertSerializer(type, '12345678901234567');
    }, /exceeds maxLen 16/);
    assertRequired(type);
  });

  it('TypesAll', function () {
    var types = Types({ defaults: true });
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(types)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var typeName = _step.value;

        if (typeName === 'config') {
          continue;
        }
        var fn = types[typeName];
        var type = null;
        if (typeName === 'map') {
          type = fn([types.string(), types.string()]);
          assertSerializer(type, { 'abc': 'def' });
        } else if (typeName === 'static_variant') {
          type = fn([types.string(), types.string()]);
          assertSerializer(type, [0, 'abc']);
        } else if (typeof fn === 'function') {
          type = fn(types.string());
          assertSerializer(type, type.toObject());
        }
        if (type === null) {
          assert(false, 'Skipped type ' + typeName);
        }
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

  it('time', function () {
    var _Types6 = Types(),
        time = _Types6.time;

    var type = time();

    throws(function () {
      return type.fromObject({});
    }, /Unknown date type/);
    type.fromObject(new Date());
    type.fromObject(1000);
    type.fromObject('1970-01-01T00:00:00');

    assertSerializer(type, '1970-01-01T00:00:00');
    assertSerializer(type, '2106-02-07T06:28:15');
    throws(function () {
      return assertSerializer(type, '1969-12-31T23:59:59Z');
    }, /format/); // becomes -1
    throws(function () {
      return assertSerializer(type, '2106-02-07T06:28:16Z');
    }, /Overflow/);
    assertRequired(type);
  });

  it('optional', function () {
    var _Types7 = Types(),
        optional = _Types7.optional,
        string = _Types7.string;

    var type = optional(string());
    throws(function () {
      return optional('string');
    }, /optional parameter should be a serializer/);
    assertSerializer(type, 'str');
    assertSerializer(type, null);
    assertSerializer(type, undefined);
  });

  describe('uint', function () {
    var _Types8 = Types(),
        uint8 = _Types8.uint8,
        vector = _Types8.vector;

    var type = uint8();

    it('serializes', function () {
      assertSerializer(type, 0, '00');
      assertSerializer(type, 255, 'ff');
      throws(function () {
        return assertSerializer(type, 256);
      }, /Overflow/);
      throws(function () {
        return assertSerializer(type, -1);
      }, /format/);
      assertRequired(type);
    });

    it('sorts', function () {
      var typeVector = vector(type);
      var unsortedValue = [1, 0];
      var sortedValue = [0, 1];
      assertSerializerSort(typeVector, unsortedValue, sortedValue);
    });
  });

  it('uint64', function () {
    var _Types9 = Types(),
        uint64 = _Types9.uint64;

    var type = uint64();

    assertSerializer(type, '18446744073709551615', 'ffffffffffffffff');
    assertSerializer(type, '0', '0000000000000000');
    throws(function () {
      return assertSerializer(type, '18446744073709551616');
    }, /Overflow/);
    throws(function () {
      return assertSerializer(type, '-1');
    }, /format/);
    assertRequired(type);
  });

  it('uint128', function () {
    var _Types10 = Types(),
        uint128 = _Types10.uint128;

    var type = uint128();

    assertSerializer(type, '340282366920938463463374607431768211455', // (2^128)-1
    'ffffffffffffffffffffffffffffffff');
    assertSerializer(type, '0', '00000000000000000000000000000000');
    throws(function () {
      return assertSerializer(type, '340282366920938463463374607431768211456');
    }, /Overflow/);
    throws(function () {
      return assertSerializer(type, '-1');
    }, /format/);
    assertRequired(type);
  });

  it('int', function () {
    var _Types11 = Types(),
        int8 = _Types11.int8;

    var type = int8();

    assertSerializer(type, -128, '80');
    assertSerializer(type, 127, '7f');

    var serializerType = _typeof(assertSerializer(type, 0));
    assert.equal(serializerType, 'number', 'expecting number type when bits <= 53');

    throws(function () {
      return assertSerializer(type, -129);
    }, /Overflow/);
    throws(function () {
      return assertSerializer(type, 128);
    }, /Overflow/);
    assertRequired(type);
  });

  it('int64', function () {
    var _Types12 = Types(),
        int64 = _Types12.int64;

    var type = int64();

    assertSerializer(type, '9223372036854775807', 'ffffffffffffff7f');
    assertSerializer(type, '-9223372036854775808', '0000000000000080');

    var serializerType = _typeof(assertSerializer(type, '0'));
    assert.equal(serializerType, 'string', 'expecting string type when bits > 53');

    throws(function () {
      return assertSerializer(type, '9223372036854775808');
    }, /Overflow/);
    throws(function () {
      return assertSerializer(type, '-9223372036854775809');
    }, /Overflow/);
    assertRequired(type);
  });

  it('int128', function () {
    var _Types13 = Types(),
        int128 = _Types13.int128;

    var type = int128();

    assertSerializer(type, '0', '00000000000000000000000000000000');
    assertSerializer(type, '170141183460469231731687303715884105727', 'ffffffffffffffffffffffffffffff7f');
    assertSerializer(type, '-170141183460469231731687303715884105728', '00000000000000000000000000000080');
    throws(function () {
      return assertSerializer(type, '170141183460469231731687303715884105728');
    }, /Overflow/);
    throws(function () {
      return assertSerializer(type, '-170141183460469231731687303715884105729');
    }, /Overflow/);
    assertRequired(type);
  });

  describe('struct', function () {
    var _Types14 = Types(),
        vector = _Types14.vector,
        uint16 = _Types14.uint16,
        fixed_bytes33 = _Types14.fixed_bytes33;

    var KeyPermissionWeight = Struct('KeyPermissionWeight');
    KeyPermissionWeight.add('key', fixed_bytes33());
    KeyPermissionWeight.add('weight', uint16());

    var type = vector(KeyPermissionWeight);

    it('serializes', function () {
      assertSerializer(type, [{ key: Array(33 + 1).join('00'), weight: 1 }, { key: Array(33 + 1).join('00'), weight: 1 }]);
    });

    it('sorts', function () {
      var unsortedValue = [{ key: Array(33 + 1).join('11'), weight: 1 }, { key: Array(33 + 1).join('00'), weight: 1 }];

      var sortedValue = [unsortedValue[1], unsortedValue[0]];
      assertSerializerSort(type, unsortedValue, sortedValue);
    });
  });
});

describe('JSON', function () {
  it('Structure', function () {
    assertCompile({ Struct: { fields: { checksum32: 'fixed_bytes32' } } });
    throws(function () {
      return assertCompile({ Struct: {} });
    }, /Expecting Struct.fields or Struct.base/);
    throws(function () {
      return assertCompile({ Struct: { base: { obj: 'val' } } });
    }, /Expecting string/);
    throws(function () {
      return assertCompile({ Struct: { fields: 'string' } });
    }, /Expecting object/);
    throws(function () {
      return assertCompile({ Struct: { fields: { name: { obj: 'val' } } } });
    }, /Expecting string in/);
    throws(function () {
      return assertCompile({ Struct: 0 });
    }, /Expecting object or string/);
  });

  it('Debug', function () {
    assertCompile({ name: 'string', Person: { fields: { name: 'name' } } }, { defaults: true, debug: true });
  });

  it('typedef', function () {
    throws(function () {
      return assertCompile({ Type: 'UnknownType' });
    }, /Unrecognized type/);
    assertCompile({ name: 'string', Person: { fields: { name: 'name' } } });
    assertCompile({ name: 'string', MyName: 'name', Person: { fields: { name: 'MyName' } } });
  });

  it('typedef', function () {
    assertCompile({ Event: { fields: { time: 'time' } } });
  });

  it('Inherit', function () {
    throws(function () {
      return assertCompile({ Struct: { fields: { name: 'name' } } });
    }, /Missing name/);
    throws(function () {
      return assertCompile({ Struct: { base: 'string' } });
    }, /Missing string in Struct.base/);
    throws(function () {
      return assertCompile({
        Person: { base: 'Human', fields: { name: 'string' } } });
    }, /Missing Human/);

    throws(function () {
      return assertCompile({
        Human: 'string', // Human needs to be struct not a type
        Person: { base: 'Human', fields: { name: 'string' } } });
    }, /Missing Human/);

    var schema = assertCompile({
      Boolean: 'uint8',
      Human: { fields: { Alive: 'Boolean', Gender: 'string' } },
      Person: { base: 'Human', fields: { name: 'string' } }
    });
    var person = { Alive: 1, Gender: 'f', name: 'jim' };
    assert.deepEqual(schema.Person.toObject(person), person);
  });

  it('optional', function () {
    var _assertCompile = assertCompile({ Person: { fields: { name: 'string?' } } }, { defaults: false }),
        Person = _assertCompile.Person;

    assertSerializer(Person, { name: 'Jane' });
    assertSerializer(Person, { name: null });
    assertSerializer(Person, { name: undefined });
    // assertSerializer(Person, {})  {"name": [null]} // TODO ???
  });

  it('Vectors', function () {
    throws(function () {
      return assertCompile({ Person: { fields: { name: 'vector[TypeArg]' } } });
    }, /Missing TypeArg/);
    throws(function () {
      return assertCompile({ Person: { fields: { name: 'BaseType[]' } } });
    }, /Missing BaseType/);
    throws(function () {
      return assertCompile({ Person: { fields: { name: 'BaseType[string]' } } });
    }, /Missing BaseType/);
    assertCompile({ Person: { fields: { name: 'vector[string]' } } });
    assertCompile({ Person: { fields: { name: 'string' } }, Conference: { fields: { attendees: 'Person[]' } } });

    var _assertCompile2 = assertCompile({ Person: { fields: { friends: 'string[]' } } }),
        Person = _assertCompile2.Person;

    assertSerializer(Person, { friends: ['Jane', 'Dan'] });
    assertSerializer(Person, { friends: ['Dan', 'Jane'] }); // un-sorted

    Person = assertCompile({ Person: { fields: { friends: 'string[]' } } }, { sort: { 'Person.friends': true } }).Person;
    assertSerializer(Person, { friends: ['Dan', 'Jane'] });
    assert.throws(function () {
      return assertSerializer(Person, { friends: ['Jane', 'Dan'] });
    }, /serialize object/);
  });

  it('Errors', function () {
    var _create = create({ Struct: { fields: { age: 'string' } } }, Types({ defaults: true })),
        structs = _create.structs;

    var type = structs.Struct;
    throws(function () {
      return Fcbuffer.fromBuffer(type, Buffer.from(''));
    }, /Illegal offset/);
  });
});

describe('Override', function () {

  it('type', function () {
    var definitions = {
      asset: {
        fields: {
          amount: 'string', // another definition (like transfer)
          symbol: 'string'
        }
      }
    };
    var override = {
      'asset.fromObject': function assetFromObject(value) {
        var _value$split = value.split(' '),
            _value$split2 = _slicedToArray(_value$split, 2),
            amount = _value$split2[0],
            symbol = _value$split2[1];

        return { amount: amount, symbol: symbol };
      },
      'asset.toObject': function assetToObject(value) {
        var amount = value.amount,
            symbol = value.symbol;

        return amount + ' ' + symbol;
      }
    };

    var _create2 = create(definitions, Types({ override: override })),
        structs = _create2.structs,
        errors = _create2.errors;

    assert.equal(errors.length, 0);
    var asset = structs.asset.fromObject('1 EOS');
    assert.deepEqual(asset, { amount: 1, symbol: 'EOS' });
    assert.deepEqual('1 EOS', structs.asset.toObject(asset));
  });

  it('field', function () {
    var definitions = {
      message: {
        fields: {
          type: 'string', // another definition (like transfer)
          data: 'bytes'
        }
      },
      transfer: {
        fields: {
          from: 'string',
          to: 'string'
        }
      }
    };
    var override = {
      'message.data.fromByteBuffer': function messageDataFromByteBuffer(_ref) {
        var fields = _ref.fields,
            object = _ref.object,
            b = _ref.b,
            config = _ref.config;

        var ser = (object.type || '') == '' ? fields.data : structs[object.type];
        b.readVarint32();
        object.data = ser.fromByteBuffer(b, config);
      },
      'message.data.appendByteBuffer': function messageDataAppendByteBuffer(_ref2) {
        var fields = _ref2.fields,
            object = _ref2.object,
            b = _ref2.b;

        var ser = (object.type || '') == '' ? fields.data : structs[object.type];
        var b2 = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        ser.appendByteBuffer(b2, object.data);
        b.writeVarint32(b2.offset);
        b.append(b2.copy(0, b2.offset), 'binary');
      },
      'message.data.fromObject': function messageDataFromObject(_ref3) {
        var fields = _ref3.fields,
            object = _ref3.object,
            result = _ref3.result;
        var data = object.data,
            type = object.type;

        var ser = (type || '') == '' ? fields.data : structs[type];
        result.data = ser.fromObject(data);
      },
      'message.data.toObject': function messageDataToObject(_ref4) {
        var fields = _ref4.fields,
            object = _ref4.object,
            result = _ref4.result,
            config = _ref4.config;

        var _ref5 = object || {},
            data = _ref5.data,
            type = _ref5.type;

        var ser = (type || '') == '' ? fields.data : structs[type];
        result.data = ser.toObject(data, config);
      }
    };

    var _create3 = create(definitions, Types({ override: override, debug: true })),
        structs = _create3.structs,
        errors = _create3.errors;

    assert.equal(errors.length, 0);
    assertSerializer(structs.message, {
      type: 'transfer',
      data: {
        from: 'slim',
        to: 'luke'
      }
    });
  });
});

describe('Custom Type', function () {
  it('Implied Decimal', function () {

    var customTypes = {
      implied_decimal: function implied_decimal() {
        return [ImpliedDecimal, { decimals: 4 }];
      }
    };

    var definitions = {
      asset: {
        fields: {
          amount: 'implied_decimal',
          symbol: 'string'
        }
      }
    };

    var ImpliedDecimal = function ImpliedDecimal(_ref6) {
      var decimals = _ref6.decimals;

      return {
        fromByteBuffer: function fromByteBuffer(b) {
          return b.readVString();
        },
        appendByteBuffer: function appendByteBuffer(b, value) {
          b.writeVString(value.toString());
        },
        fromObject: function fromObject(value) {
          var _value$split3 = value.split('.'),
              _value$split4 = _slicedToArray(_value$split3, 2),
              _value$split4$ = _value$split4[0],
              num = _value$split4$ === undefined ? '' : _value$split4$,
              _value$split4$2 = _value$split4[1],
              dec = _value$split4$2 === undefined ? '' : _value$split4$2;
          // if(dec.length > decimals) { throw TypeError(`Adjust precision to only ${decimals} decimal places.`) }


          dec += '0'.repeat(decimals - dec.length);
          return num + '.' + dec;
        },

        toObject: function toObject(value) {
          return value;
        }
      };
    };

    var _Fcbuffer = Fcbuffer(definitions, { customTypes: customTypes }),
        structs = _Fcbuffer.structs,
        errors = _Fcbuffer.errors,
        fromBuffer = _Fcbuffer.fromBuffer,
        toBuffer = _Fcbuffer.toBuffer;

    assert.equal(errors.length, 0);
    var asset = structs.asset.fromObject({ amount: '1', symbol: 'EOS' });
    assert.deepEqual(asset, { amount: '1.0000', symbol: 'EOS' });

    var buf = toBuffer('asset', asset);
    assert.deepEqual(fromBuffer('asset', buf), asset);
    assert.deepEqual(fromBuffer('asset', buf.toString('hex')), asset);

    // toBuffer and fromBuffer for a simple type
    // assert.equal(fromBuffer('uint8', toBuffer('uint8', 1)), 1)
  });

  it('Struct Typedef', function () {
    var definitions = {
      name: 'string', // typedef based on a struct
      names: 'string[]', // typedef based on a struct
      assets: 'asset[]', // typedef based on a struct
      asset: {
        fields: {
          amount: 'uint64',
          symbol: 'string'
        }
      }
    };

    var _Fcbuffer2 = Fcbuffer(definitions),
        structs = _Fcbuffer2.structs,
        types = _Fcbuffer2.types,
        errors = _Fcbuffer2.errors;

    assert.equal(errors.length, 0, JSON.stringify(errors));

    assertSerializer(types.name(), 'annunaki');
    assertSerializer(structs.names, ['annunaki']);
    assertSerializer(structs.assets, [{ amount: 1, symbol: 'CUR' }]);
  });
});

function assertCompile(definitions, config) {
  config = Object.assign({ defaults: true, debug: false }, config);

  var _create4 = create(definitions, Types(config)),
      errors = _create4.errors,
      structs = _create4.structs;

  assert.equal(errors.length, 0, errors[0]);
  assert(Object.keys(structs).length > 0, 'expecting struct(s)');
  for (var struct in structs) {
    var type = structs[struct];
    // console.log(struct, JSON.stringify(structs[struct].toObject(), null, 0), '\n')
    assertSerializer(type, type.toObject());
  }
  return structs;
}

function assertSerializer(type, value, bufferHex) {
  var obj = type.fromObject(value); // tests fromObject
  var buf = Fcbuffer.toBuffer(type, obj); // tests appendByteBuffer
  if (bufferHex != null) {
    assert.equal(buf.toString('hex'), bufferHex);
  }
  var obj2 = Fcbuffer.fromBuffer(type, buf); // tests fromByteBuffer
  var obj3 = type.toObject(obj); // tests toObject
  deepEqual(value, obj3, 'serialize object');
  deepEqual(obj3, obj2, 'serialize buffer');
  return value;
}

function assertSerializerSort(type, unsortedValue, sortedValue) {
  var obj = type.fromObject(unsortedValue); // tests fromObject
  var obj2 = type.toObject(obj); // tests toObject

  deepEqual(obj2, sortedValue, 'fromObject sorts');

  var buf = Fcbuffer.toBuffer(type, obj2); // tests appendByteBuffer
  var obj3 = Fcbuffer.fromBuffer(type, buf); // tests fromByteBuffer
  deepEqual(obj3, obj3, 'serialize buffer');
}

function assertRequired(type) {
  throws(function () {
    return assertSerializer(type, null);
  }, /Required/);
  throws(function () {
    return assertSerializer(type, undefined);
  }, /Required/);
}

/* istanbul ignore next */
function deepEqual(arg1, arg2, message) {
  try {
    assert.deepEqual(arg1, arg2, message);
    // console.log('deepEqual arg1', arg1, '\n', JSON.stringify(arg1))
    // console.log('deepEqual arg2', arg2, '\n', JSON.stringify(arg2))
  } catch (error) {
    // console.error('deepEqual arg1', arg1, '\n', JSON.stringify(arg1))
    // console.error('deepEqual arg2', arg2, '\n', JSON.stringify(arg2))
    throw error;
  }
}

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