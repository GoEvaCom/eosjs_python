'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-env mocha */
var assert = require('assert');
var fs = require('fs');

var Eos = require('.');
var ecc = Eos.modules.ecc;

var _require = require('eosjs-keygen'),
    Keystore = _require.Keystore;

var wif = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';

describe('version', function () {
  it('exposes a version number', function () {
    assert.ok(Eos.version);
  });
});

describe('offline', function () {
  var headers = {
    expiration: new Date().toISOString().split('.')[0],
    ref_block_num: 1,
    ref_block_prefix: 452435776,
    net_usage_words: 0,
    max_cpu_usage_ms: 0,
    delay_sec: 0,
    context_free_actions: [],
    transaction_extensions: []
  };

  it('transaction', function _callee() {
    var privateKey, eos, memo, trx;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(ecc.unsafeRandomKey());

          case 2:
            privateKey = _context.sent;
            eos = Eos({
              keyProvider: privateKey,
              // httpEndpoint: 'https://doesnotexist.example.org',
              transactionHeaders: function transactionHeaders(expireInSeconds, callback) {
                callback(null /*error*/, headers);
              },
              broadcast: false,
              sign: true
            });
            memo = '';
            _context.next = 7;
            return regeneratorRuntime.awrap(eos.transfer('bankers', 'people', '1000000 SYS', memo));

          case 7:
            trx = _context.sent;


            assert.deepEqual({
              expiration: trx.transaction.transaction.expiration,
              ref_block_num: trx.transaction.transaction.ref_block_num,
              ref_block_prefix: trx.transaction.transaction.ref_block_prefix,
              net_usage_words: 0,
              max_cpu_usage_ms: 0,
              delay_sec: 0,
              context_free_actions: [],
              transaction_extensions: []
            }, headers);

            assert.equal(trx.transaction.signatures.length, 1, 'expecting 1 signature');

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, null, this);
  });
});

// some transactions that don't broadcast may require Api lookups
if (process.env['NODE_ENV'] === 'development') {

  // describe('networks', () => {
  //   it('testnet', (done) => {
  //     const eos = Eos()
  //     eos.getBlock(1, (err, block) => {
  //       if(err) {
  //         throw err
  //       }
  //       done()
  //     })
  //   })
  // })

  describe('Contracts', function () {
    it('Messages do not sort', function _callee2() {
      var local, opts, tx;
      return regeneratorRuntime.async(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              local = Eos();
              opts = { sign: false, broadcast: false };
              _context2.next = 4;
              return regeneratorRuntime.awrap(local.transaction(['currency', 'eosio.token'], function (_ref) {
                var currency = _ref.currency,
                    eosio_token = _ref.eosio_token;

                // make sure {account: 'eosio.token', ..} remains first
                eosio_token.transfer('inita', 'initd', '1.1 SYS', '');

                // {account: 'currency', ..} remains second (reverse sort)
                currency.transfer('inita', 'initd', '1.2 CUR', '');
              }, opts));

            case 4:
              tx = _context2.sent;

              assert.equal(tx.transaction.transaction.actions[0].account, 'eosio.token');
              assert.equal(tx.transaction.transaction.actions[1].account, 'currency');

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this);
    });
  });

  describe('Contract', function () {
    function deploy(contract) {
      var account = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'inita';

      it('deploy ' + contract + '@' + account, function _callee3() {
        var config, eos, wasm, abi, code, diskAbi;
        return regeneratorRuntime.async(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.timeout(4000);
                // console.log('todo, skipping deploy ' + `${contract}@${account}`)
                config = { binaryen: require("binaryen"), keyProvider: wif };
                eos = Eos(config);
                wasm = fs.readFileSync('docker/contracts/' + contract + '/' + contract + '.wasm');
                abi = fs.readFileSync('docker/contracts/' + contract + '/' + contract + '.abi');
                _context3.next = 7;
                return regeneratorRuntime.awrap(eos.setcode(account, 0, 0, wasm));

              case 7:
                _context3.next = 9;
                return regeneratorRuntime.awrap(eos.setabi(account, JSON.parse(abi)));

              case 9:
                _context3.next = 11;
                return regeneratorRuntime.awrap(eos.getCode(account));

              case 11:
                code = _context3.sent;
                diskAbi = JSON.parse(abi);

                delete diskAbi.____comment;
                if (!diskAbi.error_messages) {
                  diskAbi.error_messages = [];
                }

                assert.deepEqual(diskAbi, code.abi);

              case 16:
              case 'end':
                return _context3.stop();
            }
          }
        }, null, this);
      });
    }

    // When ran multiple times, deploying to the same account
    // avoids a same contract version deploy error.
    // TODO: undeploy contract instead (when API allows this)

    deploy('eosio.msig');
    deploy('eosio.token');
    deploy('eosio.bios');
    deploy('eosio.system');
  });

  describe('Contracts Load', function () {
    function load(name) {
      it(name, function _callee4() {
        var eos, contract;
        return regeneratorRuntime.async(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                eos = Eos();
                _context4.next = 3;
                return regeneratorRuntime.awrap(eos.contract(name));

              case 3:
                contract = _context4.sent;

                assert(contract, 'contract');

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, null, this);
      });
    }
    load('eosio');
    load('eosio.token');
  });

  describe('transactions', function () {
    var signProvider = function signProvider(_ref2) {
      var sign = _ref2.sign,
          buf = _ref2.buf;
      return sign(buf, wif);
    };
    var promiseSigner = function promiseSigner(args) {
      return Promise.resolve(signProvider(args));
    };

    it('usage', function () {
      var eos = Eos({ signProvider: signProvider });
      eos.transfer();
    });

    // A keyProvider can return private keys directly..
    it('keyProvider private key', function () {

      // keyProvider should return an array of keys
      var keyProvider = function keyProvider() {
        return [wif];
      };

      var eos = Eos({ keyProvider: keyProvider });

      return eos.transfer('inita', 'initb', '1 SYS', '', false).then(function (tr) {
        assert.equal(tr.transaction.signatures.length, 1);
        assert.equal(_typeof(tr.transaction.signatures[0]), 'string');
      });
    });

    it('keyProvider multiple private keys (get_required_keys)', function () {

      // keyProvider should return an array of keys
      var keyProvider = function keyProvider() {
        return ['5K84n2nzRpHMBdJf95mKnPrsqhZq7bhUvrzHyvoGwceBHq8FEPZ', wif];
      };

      var eos = Eos({ keyProvider: keyProvider });

      return eos.transfer('inita', 'initb', '1.274 SYS', '', false).then(function (tr) {
        assert.equal(tr.transaction.signatures.length, 1);
        assert.equal(_typeof(tr.transaction.signatures[0]), 'string');
      });
    });

    // If a keystore is used, the keyProvider should return available
    // public keys first then respond with private keys next.
    it('keyProvider public keys then private key', function () {
      var pubkey = ecc.privateToPublic(wif);

      // keyProvider should return a string or array of keys.
      var keyProvider = function keyProvider(_ref3) {
        var transaction = _ref3.transaction,
            pubkeys = _ref3.pubkeys;

        if (!pubkeys) {
          assert.equal(transaction.actions[0].name, 'transfer');
          return [pubkey];
        }

        if (pubkeys) {
          assert.deepEqual(pubkeys, [pubkey]);
          return [wif];
        }
        assert(false, 'unexpected keyProvider callback');
      };

      var eos = Eos({ keyProvider: keyProvider });

      return eos.transfer('inita', 'initb', '9 SYS', '', false).then(function (tr) {
        assert.equal(tr.transaction.signatures.length, 1);
        assert.equal(_typeof(tr.transaction.signatures[0]), 'string');
      });
    });

    it('keyProvider from eosjs-keygen', function () {
      var keystore = Keystore('uid');
      keystore.deriveKeys({ parent: wif });
      var eos = Eos({ keyProvider: keystore.keyProvider });
      return eos.transfer('inita', 'initb', '12 SYS', '', true);
    });

    it('keyProvider return Promise', function () {
      var eos = Eos({ keyProvider: new Promise(function (resolve) {
          resolve(wif);
        }) });
      return eos.transfer('inita', 'initb', '1.618 SYS', '', true);
    });

    it('signProvider', function () {
      var customSignProvider = function customSignProvider(_ref4) {
        var buf = _ref4.buf,
            sign = _ref4.sign,
            transaction = _ref4.transaction;


        // All potential keys (EOS6MRy.. is the pubkey for 'wif')
        var pubkeys = ['EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'];

        return eos.getRequiredKeys(transaction, pubkeys).then(function (res) {
          // Just the required_keys need to sign
          assert.deepEqual(res.required_keys, pubkeys);
          return sign(buf, wif); // return hex string signature or array of signatures
        });
      };
      var eos = Eos({ signProvider: customSignProvider });
      return eos.transfer('inita', 'initb', '2 SYS', '', false);
    });

    it('create asset', function _callee5() {
      var eos, pubkey, auth;
      return regeneratorRuntime.async(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              eos = Eos({ signProvider: signProvider });
              pubkey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
              auth = { authorization: 'eosio.token' };
              _context5.next = 5;
              return regeneratorRuntime.awrap(eos.create('eosio.token', '10000 ' + randomAsset(), auth));

            case 5:
              _context5.next = 7;
              return regeneratorRuntime.awrap(eos.create('eosio.token', '10000.00 ' + randomAsset(), auth));

            case 7:
            case 'end':
              return _context5.stop();
          }
        }
      }, null, this);
    });

    it('newaccount (broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      var pubkey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
      var name = randomName();

      return eos.transaction(function (tr) {
        tr.newaccount({
          creator: 'eosio',
          name: name,
          owner: pubkey,
          active: pubkey
        });
        tr.buyrambytes({
          payer: 'eosio',
          receiver: name,
          bytes: 8192
        });
        tr.delegatebw({
          from: 'eosio',
          receiver: name,
          stake_net_quantity: '1.0000 SYS',
          stake_cpu_quantity: '1.0000 SYS',
          transfer: 0
        });
      });
    });

    it('mockTransactions pass', function () {
      var eos = Eos({ signProvider: signProvider, mockTransactions: 'pass' });
      return eos.transfer('inita', 'initb', '1 SYS', '').then(function (transfer) {
        assert(transfer.mockTransaction, 'transfer.mockTransaction');
      });
    });

    it('mockTransactions fail', function () {
      var logger = { error: null };
      var eos = Eos({ signProvider: signProvider, mockTransactions: 'fail', logger: logger });
      return eos.transfer('inita', 'initb', '1 SYS', '').catch(function (error) {
        assert(error.indexOf('fake error') !== -1, 'expecting: fake error');
      });
    });

    it('transfer (broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 SYS', '');
    });

    it('transfer custom token precision (broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1.618 PHI', '');
    });

    it('transfer custom authorization (broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 SYS', '', { authorization: 'inita@owner' });
    });

    it('transfer custom authorization sorting (no broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 SYS', '', { authorization: ['initb@owner', 'inita@owner'], broadcast: false }).then(function (_ref5) {
        var transaction = _ref5.transaction;

        var ans = [{ actor: 'inita', permission: 'owner' }, { actor: 'initb', permission: 'owner' }];
        assert.deepEqual(transaction.transaction.actions[0].authorization, ans);
      });
    });

    it('transfer (no broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 SYS', '', { broadcast: false });
    });

    it('transfer (no broadcast, no sign)', function () {
      var eos = Eos({ signProvider: signProvider });
      var opts = { broadcast: false, sign: false };
      return eos.transfer('inita', 'initb', '1 SYS', '', opts).then(function (tr) {
        return assert.deepEqual(tr.transaction.signatures, []);
      });
    });

    it('transfer sign promise (no broadcast)', function () {
      var eos = Eos({ signProvider: promiseSigner });
      return eos.transfer('inita', 'initb', '1 SYS', '', false);
    });

    it('action to unknown contract', function () {
      var logger = { error: null };
      return Eos({ signProvider: signProvider, logger: logger }).contract('unknown432').then(function () {
        throw 'expecting error';
      }).catch(function (error) {
        assert(/unknown key/.test(error.toString()), 'expecting "unknown key" error action, instead got: ' + error);
      });
    });

    it('action to contract', function () {
      return Eos({ signProvider: signProvider }).contract('eosio.token').then(function (token) {
        return token.transfer('inita', 'initb', '1 SYS', '')
        // transaction sent on each command
        .then(function (tr) {
          assert.equal(1, tr.transaction.transaction.actions.length);

          return token.transfer('initb', 'inita', '1 SYS', '').then(function (tr) {
            assert.equal(1, tr.transaction.transaction.actions.length);
          });
        });
      }).then(function (r) {
        assert(r == undefined);
      });
    });

    it('action to contract atomic', function _callee6() {
      var amt, eos, trTest, assertTr;
      return regeneratorRuntime.async(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              amt = 1; // for unique transactions

              eos = Eos({ signProvider: signProvider });

              trTest = function trTest(eosio_token) {
                assert(eosio_token.transfer('inita', 'initb', amt + ' SYS', '') == null);
                assert(eosio_token.transfer('initb', 'inita', amt++ + ' SYS', '') == null);
              };

              assertTr = function assertTr(tr) {
                assert.equal(2, tr.transaction.transaction.actions.length);
              };

              //  contracts can be a string or array


              _context6.t0 = regeneratorRuntime;
              _context6.t1 = assertTr;
              _context6.next = 8;
              return regeneratorRuntime.awrap(eos.transaction(['eosio.token'], function (_ref6) {
                var eosio_token = _ref6.eosio_token;
                return trTest(eosio_token);
              }));

            case 8:
              _context6.t2 = _context6.sent;
              _context6.t3 = (0, _context6.t1)(_context6.t2);
              _context6.next = 12;
              return _context6.t0.awrap.call(_context6.t0, _context6.t3);

            case 12:
              _context6.t4 = regeneratorRuntime;
              _context6.t5 = assertTr;
              _context6.next = 16;
              return regeneratorRuntime.awrap(eos.transaction('eosio.token', function (eosio_token) {
                return trTest(eosio_token);
              }));

            case 16:
              _context6.t6 = _context6.sent;
              _context6.t7 = (0, _context6.t5)(_context6.t6);
              _context6.next = 20;
              return _context6.t4.awrap.call(_context6.t4, _context6.t7);

            case 20:
            case 'end':
              return _context6.stop();
          }
        }
      }, null, this);
    });

    it('action to contract (contract tr nesting)', function () {
      this.timeout(4000);
      var tn = Eos({ signProvider: signProvider });
      return tn.contract('eosio.token').then(function (eosio_token) {
        return eosio_token.transaction(function (tr) {
          tr.transfer('inita', 'initb', '1 SYS', '');
          tr.transfer('inita', 'initc', '2 SYS', '');
        }).then(function () {
          return eosio_token.transfer('inita', 'initb', '3 SYS', '');
        });
      });
    });

    it('multi-action transaction (broadcast)', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        assert(tr.transfer('inita', 'initb', '1 SYS', '') == null);
        assert(tr.transfer({ from: 'inita', to: 'initc', quantity: '1 SYS', memo: '' }) == null);
      }).then(function (tr) {
        assert.equal(2, tr.transaction.transaction.actions.length);
      });
    });

    it('multi-action transaction no inner callback', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        tr.transfer('inita', 'inita', '1 SYS', '', function (cb) {});
      }).then(function () {
        throw 'expecting rollback';
      }).catch(function (error) {
        assert(/Callback during a transaction/.test(error), error);
      });
    });

    it('multi-action transaction error rollback', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        throw 'rollback';
      }).then(function () {
        throw 'expecting rollback';
      }).catch(function (error) {
        assert(/rollback/.test(error), error);
      });
    });

    it('multi-action transaction Promise.reject rollback', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        return Promise.reject('rollback');
      }).then(function () {
        throw 'expecting rollback';
      }).catch(function (error) {
        assert(/rollback/.test(error), error);
      });
    });

    it('custom transfer', function () {
      var eos = Eos({ signProvider: signProvider });
      return eos.transaction({
        actions: [{
          account: 'eosio',
          name: 'transfer',
          data: {
            from: 'inita',
            to: 'initb',
            quantity: '13 SYS',
            memo: '爱'
          },
          authorization: [{
            actor: 'inita',
            permission: 'active'
          }]
        }]
      }, { broadcast: false });
    });
  });

  // ./eosioc set contract currency build/contracts/currency/currency.wasm build/contracts/currency/currency.abi
  it('Transaction ABI lookup', function _callee7() {
    var eos, tx;
    return regeneratorRuntime.async(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            eos = Eos();
            _context7.next = 3;
            return regeneratorRuntime.awrap(eos.transaction({
              actions: [{
                account: 'currency',
                name: 'transfer',
                data: {
                  from: 'inita',
                  to: 'initb',
                  quantity: '13 CUR',
                  memo: ''
                },
                authorization: [{
                  actor: 'inita',
                  permission: 'active'
                }]
              }]
            }, { sign: false, broadcast: false }));

          case 3:
            tx = _context7.sent;

            assert.equal(tx.transaction.transaction.actions[0].account, 'currency');

          case 5:
          case 'end':
            return _context7.stop();
        }
      }
    }, null, this);
  });
} // if development

var randomName = function randomName() {
  var name = String(Math.round(Math.random() * 1000000000)).replace(/[0,6-9]/g, '');
  return 'a' + name + '111222333444'.substring(0, 11 - name.length); // always 12 in length
};

var randomAsset = function randomAsset() {
  return ecc.sha256(String(Math.random())).toUpperCase().replace(/[^A-Z]/g, '').substring(0, 7);
};