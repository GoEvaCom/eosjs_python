'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _require = require('eosjs-ecc'),
    Signature = _require.Signature,
    PublicKey = _require.PublicKey;

var Fcbuffer = require('fcbuffer');
var ByteBuffer = require('bytebuffer');
var assert = require('assert');

var json = { schema: require('./schema') };

var _require2 = require('./format'),
    isName = _require2.isName,
    encodeName = _require2.encodeName,
    decodeName = _require2.decodeName,
    UDecimalPad = _require2.UDecimalPad,
    UDecimalImply = _require2.UDecimalImply,
    UDecimalUnimply = _require2.UDecimalUnimply,
    parseExtendedAsset = _require2.parseExtendedAsset;

/** Configures Fcbuffer for EOS specific structs and types. */


module.exports = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var extendedSchema = arguments[1];

  var structLookup = function structLookup(lookupName, account) {
    var cachedCode = new Set(['eosio', 'eosio.token']);
    if (cachedCode.has(account)) {
      return structs[lookupName];
    }
    var abi = config.abiCache.abi(account);
    var struct = abi.structs[lookupName];
    if (struct != null) {
      return struct;
    }
    // TODO: move up (before `const struct = abi.structs[lookupName]`)
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = abi.abi.actions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var action = _step.value;
        var name = action.name,
            type = action.type;

        if (name === lookupName) {
          var _struct = abi.structs[type];
          if (_struct != null) {
            return _struct;
          }
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

    throw new Error('Missing ABI struct or action: ' + lookupName);
  };

  // If nodeos does not have an ABI setup for a certain action.type, it will throw
  // an error: `Invalid cast from object_type to string` .. forceActionDataHex
  // may be used to until native ABI is added or fixed.
  var forceActionDataHex = config.forceActionDataHex != null ? config.forceActionDataHex : true;

  var override = Object.assign({}, authorityOverride, abiOverride(structLookup), wasmCodeOverride(config), actionDataOverride(structLookup, forceActionDataHex), config.override);

  var _config = config,
      assetCache = _config.assetCache;


  var eosTypes = {
    name: function name() {
      return [Name];
    },
    public_key: function public_key() {
      return [variant(PublicKeyEcc)];
    },

    symbol: function symbol() {
      return [_Symbol(assetCache)];
    },
    extended_symbol: function extended_symbol() {
      return [ExtendedSymbol(assetCache)];
    },

    asset: function asset() {
      return [Asset(assetCache)];
    }, // After Symbol: amount, precision, symbol, contract
    extended_asset: function extended_asset() {
      return [ExtendedAsset(assetCache)];
    }, // After Asset: amount, precision, symbol, contract

    signature: function signature() {
      return [variant(SignatureType)];
    }
  };

  var customTypes = Object.assign({}, eosTypes, config.customTypes);
  config = Object.assign({ override: override }, { customTypes: customTypes }, config);

  // Do not sort transaction actions
  config.sort = Object.assign({}, config.sort);
  config.sort['action.authorization'] = true;
  config.sort['signed_transaction.signature'] = true;
  config.sort['authority.accounts'] = true;
  config.sort['authority.keys'] = true;

  var schema = Object.assign({}, json.schema, extendedSchema);

  var _Fcbuffer = Fcbuffer(schema, config),
      structs = _Fcbuffer.structs,
      types = _Fcbuffer.types,
      errors = _Fcbuffer.errors,
      fromBuffer = _Fcbuffer.fromBuffer,
      toBuffer = _Fcbuffer.toBuffer;

  if (errors.length !== 0) {
    throw new Error(JSON.stringify(errors, null, 4));
  }

  return { structs: structs, types: types, fromBuffer: fromBuffer, toBuffer: toBuffer };
};

/**
  Name eos::types native.hpp
*/
var Name = function Name(validation) {
  return {
    fromByteBuffer: function fromByteBuffer(b) {
      var n = decodeName(b.readUint64(), false); // b is already in littleEndian
      // if(validation.debug) {
      //   console.error(`${n}`, '(Name.fromByteBuffer)')
      // }
      return n;
    },
    appendByteBuffer: function appendByteBuffer(b, value) {
      // if(validation.debug) {
      //   console.error(`${value}`, (Name.appendByteBuffer))
      // }
      b.writeUint64(encodeName(value, false)); // b is already in littleEndian
    },
    fromObject: function fromObject(value) {
      return value;
    },
    toObject: function toObject(value) {
      if (validation.defaults && value == null) {
        return '';
      }
      return value;
    }
  };
};

/**
  A variant is like having a version of an object.  A varint comes
  first and identifies which type of object this is.

  @arg {Array} variantArray array of types
*/
var variant = function variant() {
  for (var _len = arguments.length, variantArray = Array(_len), _key = 0; _key < _len; _key++) {
    variantArray[_key] = arguments[_key];
  }

  return function (validation, baseTypes, customTypes) {
    var variants = variantArray.map(function (Type) {
      return Type(validation, baseTypes, customTypes);
    });
    var staticVariant = baseTypes.static_variant(variants);

    return {
      fromByteBuffer: function fromByteBuffer(b) {
        return staticVariant.fromByteBuffer(b);
      },
      appendByteBuffer: function appendByteBuffer(b, value) {
        if (!Array.isArray(value)) {
          value = [0, value];
        }
        staticVariant.appendByteBuffer(b, value);
      },
      fromObject: function fromObject(value) {
        if (!Array.isArray(value)) {
          value = [0, value];
        }
        return staticVariant.fromObject(value)[1];
      },
      toObject: function toObject(value) {
        if (!Array.isArray(value)) {
          value = [0, value];
        }
        return staticVariant.toObject(value)[1];
      }
    };
  };
};

var PublicKeyEcc = function PublicKeyEcc(validation) {
  return {
    fromByteBuffer: function fromByteBuffer(b) {
      var bcopy = b.copy(b.offset, b.offset + 33);
      b.skip(33);
      var pubbuf = Buffer.from(bcopy.toBinary(), 'binary');
      return PublicKey.fromBuffer(pubbuf).toString();
    },
    appendByteBuffer: function appendByteBuffer(b, value) {
      // if(validation.debug) {
      //   console.error(`${value}`, 'PublicKeyType.appendByteBuffer')
      // }
      var buf = PublicKey.fromStringOrThrow(value).toBuffer();
      b.append(buf.toString('binary'), 'binary');
    },
    fromObject: function fromObject(value) {
      return value;
    },
    toObject: function toObject(value) {
      if (validation.defaults && value == null) {
        return 'EOS6MRy..';
      }
      return value;
    }
  };
};

/** @private */
function precisionCache(assetCache, value) {
  var symbolInfo = parseExtendedAsset(value);
  var contract = symbolInfo.contract || 'eosio.token';

  var precision = void 0;

  if (contract) {
    var asset = assetCache.lookup(symbolInfo.symbol, contract);

    if (asset != null) {
      if (symbolInfo.precision != null) {
        assert.equal(asset.precision, symbolInfo.precision, 'Precision mismatch for asset: ' + value);
      }
      precision = asset.precision;
    } else {
      // Lookup for later (appendByteBuffer)
      assetCache.lookupAsync(symbolInfo.symbol, contract);

      // asset === null is a confirmation that the asset did not exist on the blockchain
      if (asset === null) {
        if (symbolInfo.precision == null && symbolInfo.amount != null) {
          // no blockchain asset, no explicit precision .. derive from amount
          var _symbolInfo$amount$sp = symbolInfo.amount.split('.'),
              _symbolInfo$amount$sp2 = _slicedToArray(_symbolInfo$amount$sp, 2),
              _symbolInfo$amount$sp3 = _symbolInfo$amount$sp2[1],
              decimalstr = _symbolInfo$amount$sp3 === undefined ? '' : _symbolInfo$amount$sp3;

          precision = decimalstr.length;
          // console.log('derivied precision for new asset: ' + precision + ',' + symbolInfo.symbol)
        }
      }
    }
  }

  if (precision == null) {
    precision = symbolInfo.precision;
  }

  var pc = Object.assign({}, symbolInfo, { contract: contract });
  if (precision != null) {
    pc.precision = precision;
  }
  // console.log('precisionCache', pc)
  return pc;
}

/**
  Internal: precision, symbol
  External: symbol
  @example 'SYS'
*/
var _Symbol = function _Symbol(assetCache) {
  return function (validation) {
    return {
      fromByteBuffer: function fromByteBuffer(b) {
        var bcopy = b.copy(b.offset, b.offset + 8);
        b.skip(8);

        var precision = bcopy.readUint8();
        var bin = bcopy.toBinary();

        var symbol = '';
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = bin[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var code = _step2.value;

            if (code == '\0') {
              break;
            }
            symbol += code;
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

        precisionCache(assetCache, precision + ',' + symbol); // validate
        return precision + ',' + symbol;
      },
      appendByteBuffer: function appendByteBuffer(b, value) {
        var _precisionCache = precisionCache(assetCache, value),
            symbol = _precisionCache.symbol,
            precision = _precisionCache.precision;

        assert(precision != null, 'Precision unknown for asset: ' + value);
        var pad = '\0'.repeat(7 - symbol.length);
        b.append(String.fromCharCode(precision) + symbol + pad);
      },
      fromObject: function fromObject(value) {
        assert(value != null, 'Symbol is required: ' + value);

        var _precisionCache2 = precisionCache(assetCache, value),
            symbol = _precisionCache2.symbol,
            precision = _precisionCache2.precision;

        if (precision == null) {
          return symbol;
        } else {
          // Internal object, this can have the precision prefix
          return precision + ',' + symbol;
        }
      },
      toObject: function toObject(value) {
        if (validation.defaults && value == null) {
          return 'SYS';
        }
        // symbol only (without precision prefix)
        return precisionCache(assetCache, value).symbol;
      }
    };
  };
};

/**
  Internal: precision, symbol, contract
  External: symbol, contract
  @example 'SYS@contract'
*/
var ExtendedSymbol = function ExtendedSymbol(assetCache) {
  return function (validation, baseTypes, customTypes) {
    var symbolType = customTypes.symbol(validation);
    var contractName = customTypes.name(validation);

    return {
      fromByteBuffer: function fromByteBuffer(b) {
        var symbol = symbolType.fromByteBuffer(b);
        var contract = contractName.fromByteBuffer(b);
        return symbol + '@' + contract;
      },
      appendByteBuffer: function appendByteBuffer(b, value) {
        assert.equal(typeof value === 'undefined' ? 'undefined' : _typeof(value), 'string', 'Invalid extended symbol: ' + value);

        var _value$split = value.split('@'),
            _value$split2 = _slicedToArray(_value$split, 2),
            symbol = _value$split2[0],
            contract = _value$split2[1];

        assert(contract != null, 'Missing @contract suffix in extended symbol: ' + value);

        symbolType.appendByteBuffer(b, symbol);
        contractName.appendByteBuffer(b, contract);
      },
      fromObject: function fromObject(value) {
        return value;
      },
      toObject: function toObject(value) {
        if (validation.defaults && value == null) {
          return '4,SYS@contract';
        }
        return value;
      }
    };
  };
};

function toAssetString(value, assetCache) {
  var format = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

  assert.equal(typeof value === 'undefined' ? 'undefined' : _typeof(value), 'string', 'expecting asset string, got ' + (typeof value === 'undefined' ? 'undefined' : _typeof(value)));

  var _precisionCache3 = precisionCache(assetCache, value),
      precision = _precisionCache3.precision,
      symbol = _precisionCache3.symbol,
      amount = _precisionCache3.amount,
      contract = _precisionCache3.contract;

  if (format === 'plain_asset') {
    return UDecimalPad(amount, precision) + ' ' + symbol;
  }

  if (format === 'extended_asset') {
    var contractSuffix = contract ? '@' + contract : '';
    return UDecimalPad(amount, precision) + ' ' + symbol + contractSuffix;
  }

  if (format === 'full_asset') {
    var precisionPrefix = precision != null ? precision + ',' : '';
    var full = UDecimalPad(amount, precision) + ' ' + precisionPrefix + symbol;
    // console.log('full_asset', full)
    return full;
  }

  if (format === 'full_extended_asset') {
    var _contractSuffix = contract ? '@' + contract : '';
    var _precisionPrefix = precision != null ? precision + ',' : '';
    var _full = UDecimalPad(amount, precision) + ' ' + _precisionPrefix + symbol + _contractSuffix;
    // console.log('full_extended_asset', full)
    return _full;
  }

  assert(false, 'format should be: plain, extended, or full');
}

/**
  Internal: amount, precision, symbol, contract
  @example '1.0000 SYS'
*/
var Asset = function Asset(assetCache) {
  return function (validation, baseTypes, customTypes) {
    var amountType = baseTypes.int64(validation);
    var symbolType = customTypes.symbol(validation);

    return {
      fromByteBuffer: function fromByteBuffer(b) {
        var amount = amountType.fromByteBuffer(b);
        var sym = symbolType.fromByteBuffer(b);

        var _precisionCache4 = precisionCache(assetCache, sym),
            precision = _precisionCache4.precision,
            symbol = _precisionCache4.symbol;

        return toAssetString(UDecimalUnimply(amount, precision) + ' ' + precision + ',' + symbol, assetCache, 'full_asset');
      },
      appendByteBuffer: function appendByteBuffer(b, value) {
        assert.equal(typeof value === 'undefined' ? 'undefined' : _typeof(value), 'string', 'expecting asset string, got ' + (typeof value === 'undefined' ? 'undefined' : _typeof(value)));

        var _precisionCache5 = precisionCache(assetCache, value),
            amount = _precisionCache5.amount,
            precision = _precisionCache5.precision,
            symbol = _precisionCache5.symbol;

        assert(precision != null, 'Precision unknown for asset: ' + value);
        amountType.appendByteBuffer(b, UDecimalImply(amount, precision));
        symbolType.appendByteBuffer(b, value);
      },
      fromObject: function fromObject(value) {
        return toAssetString(value, assetCache, 'full_asset');
      },
      toObject: function toObject(value) {
        if (validation.defaults && value == null) {
          return '0.0001 SYS';
        }
        return toAssetString(value, assetCache, 'plain_asset');
      }
    };
  };
};

/**
  @example '1.0000 SYS@contract'
*/
var ExtendedAsset = function ExtendedAsset(assetCache) {
  return function (validation, baseTypes, customTypes) {
    var assetType = customTypes.asset(validation);
    var contractName = customTypes.name(validation);

    return {
      fromByteBuffer: function fromByteBuffer(b) {
        var asset = assetType.fromByteBuffer(b);
        var contract = contractName.fromByteBuffer(b);
        return asset + '@' + contract;
      },
      appendByteBuffer: function appendByteBuffer(b, value) {
        assert.equal(typeof value === 'undefined' ? 'undefined' : _typeof(value), 'string', 'Invalid extended asset: ' + value);

        var _value$split3 = value.split('@'),
            _value$split4 = _slicedToArray(_value$split3, 2),
            asset = _value$split4[0],
            contract = _value$split4[1];

        assert.equal(typeof contract === 'undefined' ? 'undefined' : _typeof(contract), 'string', 'Invalid extended asset: ' + value);

        assetType.appendByteBuffer(b, asset);
        contractName.appendByteBuffer(b, contract);
      },
      fromObject: function fromObject(value) {
        // like: 1.0000 SYS@contract or 1 SYS@contract
        assert(/^\d+(\.\d+)* [A-Z]+@[a-z0-5]+(\.[a-z0-5]+)*$/.test(value), 'Invalid extended asset: ' + value);
        return toAssetString(value, assetCache, 'full_extended_asset');
      },
      toObject: function toObject(value) {
        if (validation.defaults && value == null) {
          return '1.0000 SYS@eosio.token';
        }
        return toAssetString(value, assetCache, 'extended_asset');
      }
    };
  };
};

var SignatureType = function SignatureType(validation, baseTypes) {
  var signatureType = baseTypes.fixed_bytes65(validation);
  return {
    fromByteBuffer: function fromByteBuffer(b) {
      var signatureBuffer = signatureType.fromByteBuffer(b);
      var signature = Signature.from(signatureBuffer);
      return signature.toString();
    },
    appendByteBuffer: function appendByteBuffer(b, value) {
      var signature = Signature.from(value);
      signatureType.appendByteBuffer(b, signature.toBuffer());
    },
    fromObject: function fromObject(value) {
      var signature = Signature.from(value);
      return signature.toString();
    },
    toObject: function toObject(value) {
      if (validation.defaults && value == null) {
        return 'SIG_K1_bas58signature..';
      }
      var signature = Signature.from(value);
      return signature.toString();
    }
  };
};

var authorityOverride = {
  /** shorthand `EOS6MRyAj..` */
  'authority.fromObject': function authorityFromObject(value) {
    if (PublicKey.fromString(value)) {
      return {
        threshold: 1,
        keys: [{ key: value, weight: 1 }]
      };
    }
    if (typeof value === 'string') {
      var _value$split5 = value.split('@'),
          _value$split6 = _slicedToArray(_value$split5, 2),
          account = _value$split6[0],
          _value$split6$ = _value$split6[1],
          permission = _value$split6$ === undefined ? 'active' : _value$split6$;

      return {
        threshold: 1,
        accounts: [{
          permission: {
            actor: account,
            permission: permission
          },
          weight: 1
        }]
      };
    }
  }
};

var abiOverride = function abiOverride(structLookup) {
  return {
    'abi.fromObject': function abiFromObject(value) {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      if (Buffer.isBuffer(value)) {
        return JSON.parse(value.toString());
      }
    },
    'setabi.abi.appendByteBuffer': function setabiAbiAppendByteBuffer(_ref) {
      var fields = _ref.fields,
          object = _ref.object,
          b = _ref.b;

      var ser = structLookup('abi_def', 'eosio');
      var b2 = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
      ser.appendByteBuffer(b2, object.abi);
      b.writeVarint32(b2.offset); // length prefix
      b.append(b2.copy(0, b2.offset), 'binary');
    }
  };
};

var wasmCodeOverride = function wasmCodeOverride(config) {
  return {
    'setcode.code.fromObject': function setcodeCodeFromObject(_ref2) {
      var object = _ref2.object,
          result = _ref2.result;

      try {
        var code = object.code.toString();
        if (/^\s*\(module/.test(code)) {
          var binaryen = config.binaryen;

          assert(binaryen != null, 'required: config.binaryen = require("binaryen")');
          if (config.debug) {
            console.log('Assembling WASM..');
          }
          var wasm = Buffer.from(binaryen.parseText(code).emitBinary());
          result.code = wasm;
        } else {
          result.code = object.code;
        }
      } catch (error) {
        console.error(error, object.code);
        throw error;
      }
    }
  };
};

/**
  Nested serialized structure.  Nested struct may be in HEX or object format.
*/
var actionDataOverride = function actionDataOverride(structLookup, forceActionDataHex) {
  return {
    'action.data.fromByteBuffer': function actionDataFromByteBuffer(_ref3) {
      var fields = _ref3.fields,
          object = _ref3.object,
          b = _ref3.b,
          config = _ref3.config;

      var ser = (object.name || '') == '' ? fields.data : structLookup(object.name, object.account);
      if (ser) {
        b.readVarint32(); // length prefix (usefull if object.name is unknown)
        object.data = ser.fromByteBuffer(b, config);
      } else {
        // console.log(`Unknown Action.name ${object.name}`)
        var lenPrefix = b.readVarint32();
        var bCopy = b.copy(b.offset, b.offset + lenPrefix);
        b.skip(lenPrefix);
        object.data = Buffer.from(bCopy.toBinary(), 'binary');
      }
    },

    'action.data.appendByteBuffer': function actionDataAppendByteBuffer(_ref4) {
      var fields = _ref4.fields,
          object = _ref4.object,
          b = _ref4.b;

      var ser = (object.name || '') == '' ? fields.data : structLookup(object.name, object.account);
      if (ser) {
        var b2 = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        ser.appendByteBuffer(b2, object.data);
        b.writeVarint32(b2.offset);
        b.append(b2.copy(0, b2.offset), 'binary');
      } else {
        // console.log(`Unknown Action.name ${object.name}`)
        var data = typeof object.data === 'string' ? new Buffer(object.data, 'hex') : object.data;
        if (!Buffer.isBuffer(data)) {
          throw new TypeError('Unknown struct \'' + object.name + '\' for contract \'' + object.account + '\', locate this struct or provide serialized action.data');
        }
        b.writeVarint32(data.length);
        b.append(data.toString('binary'), 'binary');
      }
    },

    'action.data.fromObject': function actionDataFromObject(_ref5) {
      var fields = _ref5.fields,
          object = _ref5.object,
          result = _ref5.result;
      var data = object.data,
          name = object.name;

      var ser = (name || '') == '' ? fields.data : structLookup(name, object.account);
      if (ser) {
        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
          result.data = ser.fromObject(data); // resolve shorthand
        } else if (typeof data === 'string') {
          var buf = new Buffer(data, 'hex');
          result.data = Fcbuffer.fromBuffer(ser, buf);
        } else {
          throw new TypeError('Expecting hex string or object in action.data');
        }
      } else {
        // console.log(`Unknown Action.name ${object.name}`)
        result.data = data;
      }
    },

    'action.data.toObject': function actionDataToObject(_ref6) {
      var fields = _ref6.fields,
          object = _ref6.object,
          result = _ref6.result,
          config = _ref6.config;

      var _ref7 = object || {},
          data = _ref7.data,
          name = _ref7.name;

      var ser = (name || '') == '' ? fields.data : structLookup(name, object.account);
      if (!ser) {
        // Types without an ABI will accept hex
        result.data = Buffer.isBuffer(data) ? data.toString('hex') : data;
        return;
      }

      if (forceActionDataHex) {
        var b2 = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        if (data) {
          ser.appendByteBuffer(b2, data);
        }
        result.data = b2.copy(0, b2.offset).toString('hex');
        // console.log('result.data', result.data)
        return;
      }

      // Serializable JSON
      result.data = ser.toObject(data, config);
    }
  };
};