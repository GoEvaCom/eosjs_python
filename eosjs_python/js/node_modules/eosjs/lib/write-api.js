'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var assert = require('assert');
var ecc = require('eosjs-ecc');
var Fcbuffer = require('fcbuffer');
var createHash = require('create-hash');

var _require = require('eosjs-api'),
    processArgs = _require.processArgs;

var Structs = require('./structs');
var AssetCache = require('./asset-cache');

module.exports = writeApiGen;

var sign = ecc.sign;


function writeApiGen(Network, network, structs, config, schemaDef) {
  if (typeof config.chainId !== 'string') {
    throw new TypeError('config.chainId is required');
  }

  var writeApi = WriteApi(Network, network, config, structs.transaction);
  var reserveFunctions = new Set(['transaction', 'contract']);
  var merge = {};

  // sends transactions, also a action collecting wrapper functions
  merge.transaction = writeApi.genTransaction(structs, merge);

  // Immediate send operations automatically calls merge.transaction
  for (var type in schemaDef) {
    var schema = schemaDef[type];
    if (schema.action == null) {
      continue;
    }
    var actionName = schema.action.name;
    if (reserveFunctions.has(actionName)) {
      throw new TypeError('Conflicting Api function: ' + type);
    }

    var struct = structs[type];
    if (struct == null) {
      continue;
    }
    var definition = schemaFields(schemaDef, type);
    merge[actionName] = writeApi.genMethod(type, definition, merge.transaction, schema.action.account);
  }

  /**
    Immedate send contract actions.
     @example eos.contract('mycontract', [options], [callback])
    @example eos.contract('mycontract').then(mycontract => mycontract.action(...))
  */
  merge.contract = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _processArgs = processArgs(args, ['account'], 'contract', optionsFormatter),
        params = _processArgs.params,
        options = _processArgs.options,
        returnPromise = _processArgs.returnPromise,
        callback = _processArgs.callback;

    var account = params.account;

    // sends transactions via its own transaction function

    writeApi.genContractActions(account).then(function (r) {
      callback(null, r);
    }).catch(function (r) {
      callback(r);
    });

    return returnPromise;
  };

  return merge;
}

function WriteApi(Network, network, config, Transaction) {
  /**
    @arg {array} [args.contracts]
    @arg {callback|object} args.transaction tr => {tr.transfer .. }
    @arg {object} [args.options]
    @arg {function} [args.callback]
  */
  var genTransaction = function genTransaction(structs, merge) {
    return function _callee() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var contracts, options, callback, isContractArray, accounts, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, action, abiPromises, cachedCode, arg, contractPromises, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, account;

      return regeneratorRuntime.async(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              contracts = void 0, options = void 0, callback = void 0;


              if (args[args.length - 1] == null) {
                // callback may be undefined
                args = args.slice(0, args.length - 1);
              }

              isContractArray = isStringArray(args[0]);

              if (!isContractArray) {
                _context.next = 8;
                break;
              }

              contracts = args[0];
              args = args.slice(1);
              _context.next = 39;
              break;

            case 8:
              if (!(typeof args[0] === 'string')) {
                _context.next = 13;
                break;
              }

              contracts = [args[0]];
              args = args.slice(1);
              _context.next = 39;
              break;

            case 13:
              if (!(_typeof(args[0]) === 'object' && _typeof(Array.isArray(args[0].actions)))) {
                _context.next = 39;
                break;
              }

              // full transaction, lookup ABIs used by each action
              accounts = new Set(); // make a unique list

              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 18;
              for (_iterator = args[0].actions[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                action = _step.value;

                accounts.add(action.account);
              }

              _context.next = 26;
              break;

            case 22:
              _context.prev = 22;
              _context.t0 = _context['catch'](18);
              _didIteratorError = true;
              _iteratorError = _context.t0;

            case 26:
              _context.prev = 26;
              _context.prev = 27;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 29:
              _context.prev = 29;

              if (!_didIteratorError) {
                _context.next = 32;
                break;
              }

              throw _iteratorError;

            case 32:
              return _context.finish(29);

            case 33:
              return _context.finish(26);

            case 34:
              abiPromises = [];
              // Eos contract operations are cached (efficient and offline transactions)

              cachedCode = new Set(['eosio', 'eosio.token']);

              accounts.forEach(function (account) {
                if (!cachedCode.has(account)) {
                  abiPromises.push(config.abiCache.abiAsync(account));
                }
              });
              _context.next = 39;
              return regeneratorRuntime.awrap(Promise.all(abiPromises));

            case 39:

              if (args.length > 1 && typeof args[args.length - 1] === 'function') {
                callback = args.pop();
              }

              if (args.length > 1 && _typeof(args[args.length - 1]) === 'object') {
                options = args.pop();
              }

              assert.equal(args.length, 1, 'transaction args: contracts<string|array>, transaction<callback|object>, [options], [callback]');
              arg = args[0];

              if (!contracts) {
                _context.next = 67;
                break;
              }

              assert(!callback, 'callback with contracts are not supported');
              assert.equal('function', typeof arg === 'undefined' ? 'undefined' : _typeof(arg), 'provide function callback following contracts array parameter');

              contractPromises = [];
              _iteratorNormalCompletion2 = true;
              _didIteratorError2 = false;
              _iteratorError2 = undefined;
              _context.prev = 50;

              for (_iterator2 = contracts[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                account = _step2.value;

                // setup wrapper functions to collect contract api calls
                contractPromises.push(genContractActions(account, merge.transaction));
              }

              _context.next = 58;
              break;

            case 54:
              _context.prev = 54;
              _context.t1 = _context['catch'](50);
              _didIteratorError2 = true;
              _iteratorError2 = _context.t1;

            case 58:
              _context.prev = 58;
              _context.prev = 59;

              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }

            case 61:
              _context.prev = 61;

              if (!_didIteratorError2) {
                _context.next = 64;
                break;
              }

              throw _iteratorError2;

            case 64:
              return _context.finish(61);

            case 65:
              return _context.finish(58);

            case 66:
              return _context.abrupt('return', Promise.all(contractPromises).then(function (actions) {
                var merges = {};
                actions.forEach(function (m, i) {
                  merges[contracts[i]] = m;
                });
                var param = isContractArray ? merges : merges[contracts[0]];
                // collect and invoke api calls
                return trMessageCollector(arg, options, param);
              }));

            case 67:
              if (!(typeof arg === 'function')) {
                _context.next = 69;
                break;
              }

              return _context.abrupt('return', trMessageCollector(arg, options, merge));

            case 69:
              if (!((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object')) {
                _context.next = 71;
                break;
              }

              return _context.abrupt('return', transaction(arg, options, callback));

            case 71:
              throw new Error('first transaction argument unrecognized', arg);

            case 72:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this, [[18, 22, 26, 34], [27,, 29, 33], [50, 54, 58, 66], [59,, 61, 65]]);
    };
  };

  function genContractActions(account) {
    var transaction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    return config.abiCache.abiAsync(account).then(function (cache) {
      assert(Array.isArray(cache.abi.actions) && cache.abi.actions.length, 'No actions');

      var contractMerge = {};
      contractMerge.transaction = transaction ? transaction : genTransaction(cache.structs, contractMerge);

      cache.abi.actions.forEach(function (_ref) {
        var name = _ref.name,
            type = _ref.type;

        var definition = schemaFields(cache.schema, type);
        contractMerge[name] = genMethod(type, definition, contractMerge.transaction, account, name);
      });

      contractMerge.fc = cache;

      return contractMerge;
    });
  }

  function genMethod(type, definition, transactionArg) {
    var account = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'eosio.token';
    var name = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : type;

    return function () {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (args.length === 0) {
        console.error(usage(type, definition, Network, account, config));
        return;
      }

      // Special case like multi-action transactions where this lib needs
      // to be sure the broadcast is off.
      var optionOverrides = {};
      var lastArg = args[args.length - 1];
      if ((typeof lastArg === 'undefined' ? 'undefined' : _typeof(lastArg)) === 'object' && _typeof(lastArg.__optionOverrides) === 'object') {
        // pop() fixes the args.length
        Object.assign(optionOverrides, args.pop().__optionOverrides);
      }

      var processedArgs = processArgs(args, Object.keys(definition), type, optionsFormatter);

      var options = processedArgs.options;
      var params = processedArgs.params,
          returnPromise = processedArgs.returnPromise,
          callback = processedArgs.callback;


      var optionDefaults = { // From config and configDefaults
        broadcast: config.broadcast,
        sign: config.sign

        // internal options (ex: multi-action transaction)
      };options = Object.assign({}, optionDefaults, options, optionOverrides);
      if (optionOverrides.noCallback && !returnPromise) {
        throw new Error('Callback during a transaction are not supported');
      }

      var addDefaultAuths = options.authorization == null;

      var authorization = [];
      if (options.authorization) {
        if (typeof options.authorization === 'string') {
          options.authorization = [options.authorization];
        }
        options.authorization.forEach(function (auth) {
          if (typeof auth === 'string') {
            var _auth$split = auth.split('@'),
                _auth$split2 = _slicedToArray(_auth$split, 2),
                actor = _auth$split2[0],
                _auth$split2$ = _auth$split2[1],
                permission = _auth$split2$ === undefined ? 'active' : _auth$split2$;

            authorization.push({ actor: actor, permission: permission });
          } else if ((typeof auth === 'undefined' ? 'undefined' : _typeof(auth)) === 'object') {
            authorization.push(auth);
          }
        });
        assert.equal(authorization.length, options.authorization.length, 'invalid authorization in: ' + JSON.stringify(options.authorization));
      }

      var tr = {
        actions: [{
          account: account,
          name: name,
          authorization: authorization,
          data: params
        }]
      };

      if (addDefaultAuths) {
        var fieldKeys = Object.keys(definition);
        var f1 = fieldKeys[0];

        if (definition[f1] === 'account_name') {
          // Default authorization (since user did not provide one)
          tr.actions[0].authorization.push({
            actor: params[f1],
            permission: 'active'
          });
        }
      }

      tr.actions[0].authorization.sort(function (a, b) {
        return a.actor > b.actor ? 1 : a.actor < b.actor ? -1 : 0;
      });

      // multi-action transaction support
      if (!optionOverrides.messageOnly) {
        transactionArg(tr, options, callback);
      } else {
        callback(null, tr);
      }

      return returnPromise;
    };
  }

  /**
    Transaction Message Collector
     Wrap merge.functions adding optionOverrides that will suspend
    transaction broadcast.
  */
  function trMessageCollector(trCallback) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var merges = arguments[2];

    assert.equal('function', typeof trCallback === 'undefined' ? 'undefined' : _typeof(trCallback), 'trCallback');
    assert.equal('object', typeof options === 'undefined' ? 'undefined' : _typeof(options), 'options');
    assert.equal('object', typeof merges === 'undefined' ? 'undefined' : _typeof(merges), 'merges');
    assert(!Array.isArray(merges), 'merges should not be an array');
    assert.equal('function', typeof transaction === 'undefined' ? 'undefined' : _typeof(transaction), 'transaction');

    var messageList = [];
    var messageCollector = {};

    var wrap = function wrap(opFunction) {
      return function () {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        // call the original function but force-disable a lot of stuff
        var ret = opFunction.apply(undefined, args.concat([{
          __optionOverrides: {
            broadcast: false,
            messageOnly: true,
            noCallback: true
          }
        }]));
        if (ret == null) {
          // double-check (code can change)
          throw new Error('Callbacks can not be used when creating a multi-action transaction');
        }
        messageList.push(ret);
      };
    };

    // merges can be an object of functions (as in the main eos contract)
    // or an object of contract names with functions under those
    for (var key in merges) {
      var value = merges[key];
      var variableName = key.replace(/\./, '_');
      if (typeof value === 'function') {
        // Native operations (eos contract for example)
        messageCollector[variableName] = wrap(value);
      } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
        // other contract(s) (currency contract for example)
        if (messageCollector[variableName] == null) {
          messageCollector[variableName] = {};
        }
        for (var key2 in value) {
          if (key2 === 'transaction') {
            continue;
          }
          messageCollector[variableName][key2] = wrap(value[key2]);
        }
      }
    }

    var promiseCollector = void 0;
    try {
      // caller will load this up with actions
      promiseCollector = trCallback(messageCollector);
    } catch (error) {
      promiseCollector = Promise.reject(error);
    }

    return Promise.resolve(promiseCollector).then(function () {
      return Promise.all(messageList).then(function (resolvedMessageList) {
        var actions = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = resolvedMessageList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var m = _step3.value;

            var _m$actions = _slicedToArray(m.actions, 1),
                action = _m$actions[0];

            actions.push(action);
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

        var trObject = {};
        trObject.actions = actions;
        return transaction(trObject, options);
      });
    });
  }

  function transaction(arg, options, callback) {
    var defaultExpiration = config.expireInSeconds ? config.expireInSeconds : 60;
    var optionDefault = { expireInSeconds: defaultExpiration, broadcast: true, sign: true };
    options = Object.assign({} /*clone*/, optionDefault, options);

    var returnPromise = void 0;
    if (typeof callback !== 'function') {
      returnPromise = new Promise(function (resolve, reject) {
        callback = function callback(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        };
      });
    }

    if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) !== 'object') {
      throw new TypeError('First transaction argument should be an object or function');
    }

    if (!Array.isArray(arg.actions)) {
      throw new TypeError('Expecting actions array');
    }

    if (config.transactionLog) {
      // wrap the callback with the logger
      var superCallback = callback;
      callback = function callback(error, tr) {
        if (error) {
          config.transactionLog(error);
        } else {
          config.transactionLog(null, tr);
        }
        superCallback(error, tr);
      };
    }

    arg.actions.forEach(function (action) {
      if (!Array.isArray(action.authorization)) {
        throw new TypeError('Expecting action.authorization array', action);
      }
    });

    if (options.sign && typeof config.signProvider !== 'function') {
      throw new TypeError('Expecting config.signProvider function (disable using {sign: false})');
    }

    var headers = config.transactionHeaders ? config.transactionHeaders : network.createTransaction;

    headers(options.expireInSeconds, checkError(callback, function _callee2(rawTx) {
      var txObject, buf, tr, transactionId, sigs, chainIdBuf, signBuf;
      return regeneratorRuntime.async(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // console.log('rawTx', rawTx)
              assert.equal(typeof rawTx === 'undefined' ? 'undefined' : _typeof(rawTx), 'object', 'expecting transaction header object');
              assert.equal(_typeof(rawTx.expiration), 'string', 'expecting expiration: iso date time string');
              assert.equal(_typeof(rawTx.ref_block_num), 'number', 'expecting ref_block_num number');
              assert.equal(_typeof(rawTx.ref_block_prefix), 'number', 'expecting ref_block_prefix number');

              rawTx = Object.assign({}, rawTx);

              rawTx.actions = arg.actions;

              // Resolve shorthand, queue requests
              txObject = Transaction.fromObject(rawTx);

              // After fromObject ensure any async actions are finished

              if (!AssetCache.pending()) {
                _context2.next = 11;
                break;
              }

              _context2.next = 10;
              return regeneratorRuntime.awrap(AssetCache.resolve());

            case 10:

              // Create the object again with resolved data
              txObject = Transaction.fromObject(rawTx);

            case 11:
              buf = Fcbuffer.toBuffer(Transaction, txObject);
              tr = Transaction.toObject(txObject);
              transactionId = createHash('sha256').update(buf).digest().toString('hex');
              sigs = [];

              if (options.sign) {
                chainIdBuf = new Buffer(config.chainId, 'hex');
                signBuf = Buffer.concat([chainIdBuf, buf, new Buffer(new Uint8Array(32))]);

                sigs = config.signProvider({ transaction: tr, buf: signBuf, sign: sign });
                if (!Array.isArray(sigs)) {
                  sigs = [sigs];
                }
              }

              // sigs can be strings or Promises
              Promise.all(sigs).then(function (sigs) {
                sigs = [].concat.apply([], sigs); // flatten arrays in array

                for (var i = 0; i < sigs.length; i++) {
                  var sig = sigs[i];
                  // normalize (hex to base58 format for example)
                  if (typeof sig === 'string' && sig.length === 130) {
                    sigs[i] = ecc.Signature.from(sig).toString();
                  }
                }

                var packedTr = {
                  compression: 'none',
                  transaction: tr,
                  signatures: sigs
                };

                var mock = config.mockTransactions ? config.mockTransactions() : null;
                if (mock != null) {
                  assert(/pass|fail/.test(mock), 'mockTransactions should return a string: pass or fail');
                  if (mock === 'pass') {
                    callback(null, {
                      transaction_id: transactionId,
                      mockTransaction: true,
                      broadcast: false,
                      transaction: packedTr
                    });
                  }
                  if (mock === 'fail') {
                    console.error('[push_transaction mock error] \'fake error\', digest \'' + buf.toString('hex') + '\'');
                    callback('fake error');
                  }
                  return;
                }

                if (!options.broadcast) {
                  callback(null, {
                    transaction_id: transactionId,
                    broadcast: false,
                    transaction: packedTr
                  });
                } else {
                  network.pushTransaction(packedTr, function (error) {
                    if (!error) {
                      callback(null, {
                        transaction_id: transactionId,
                        broadcast: true,
                        transaction: packedTr
                      });
                    } else {
                      console.error('[push_transaction error] \'' + error.message + '\', transaction \'' + buf.toString('hex') + '\'');
                      callback(error.message);
                    }
                  });
                }
              }).catch(function (error) {
                console.error(error);
                callback(error);
              });

            case 17:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this);
    }));
    return returnPromise;
  }

  // return WriteApi
  return {
    genTransaction: genTransaction,
    genContractActions: genContractActions,
    genMethod: genMethod
  };
}

var isStringArray = function isStringArray(o) {
  return Array.isArray(o) && o.length > 0 && o.findIndex(function (o) {
    return typeof o !== 'string';
  }) === -1;
};

// Normalize the extra optional options argument
var optionsFormatter = function optionsFormatter(option) {
  if ((typeof option === 'undefined' ? 'undefined' : _typeof(option)) === 'object') {
    return option; // {debug, broadcast, etc} (etc my overwrite tr below)
  }
  if (typeof option === 'boolean') {
    // broadcast argument as a true false value, back-end cli will use this shorthand
    return { broadcast: option };
  }
};

function usage(type, definition, Network, account, config) {
  var usage = '';
  var out = function out() {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    usage += str + '\n';
  };
  out('CONTRACT');
  out(account);
  out();

  out('FUNCTION');
  out(type);
  out();

  var struct = void 0;
  if (account === 'eosio' || account === 'eosio.token') {
    var _Structs = Structs(Object.assign({ defaults: true, network: Network }, config)),
        structs = _Structs.structs;

    struct = structs[type];

    out('PARAMETERS');
    out(JSON.stringify(definition, null, 4));
    out();

    out('EXAMPLE');
    out(JSON.stringify(struct.toObject(), null, 4));
  } else {
    var cache = config.abiCache.abi(account);
    out('PARAMETERS');
    out(JSON.stringify(schemaFields(cache.schema, type), null, 4));
    out();

    struct = cache.structs[type];
    out('EXAMPLE');
    out(JSON.stringify(struct.toObject(), null, 4));
  }
  if (struct == null) {
    throw TypeError('Unknown type: ' + type);
  }
  return usage;
}

var checkError = function checkError(parentErr, parrentRes) {
  return function (error, result) {
    if (error) {
      console.log('error', error);
      parentErr(error);
    } else {
      Promise.resolve(parrentRes(result)).catch(function (error) {
        parentErr(error);
      });
    }
  };
};

function schemaFields(schema, type) {
  var _schema$type = schema[type],
      base = _schema$type.base,
      fields = _schema$type.fields;

  var def = {};
  if (base && base !== '') {
    Object.assign(def, schemaFields(schema, base));
  }
  Object.assign(def, fields);
  return def;
}