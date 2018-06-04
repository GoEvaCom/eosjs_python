'use strict';

/* eslint-env mocha */
var assert = require('assert');
var Fcbuffer = require('fcbuffer');
var ByteBuffer = require('bytebuffer');

var Eos = require('.');
var AssetCache = require('./asset-cache');

describe('shorthand', function () {

  it('authority', function () {
    var eos = Eos();
    var authority = eos.fc.structs.authority;


    var pubkey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
    var auth = { threshold: 1, keys: [{ key: pubkey, weight: 1 }] };

    assert.deepEqual(authority.fromObject(pubkey), auth);
    assert.deepEqual(authority.fromObject(auth), Object.assign({}, auth, { accounts: [], waits: [] }));
  });

  it('PublicKey sorting', function () {
    var eos = Eos();
    var authority = eos.fc.structs.authority;


    var pubkeys = ['EOS7wBGPvBgRVa4wQN2zm5CjgBF6S7tP7R3JavtSa2unHUoVQGhey', 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'];

    var authSorted = { threshold: 1, keys: [{ key: pubkeys[1], weight: 1 }, { key: pubkeys[0], weight: 1 }], accounts: [], waits: [] };

    var authUnsorted = { threshold: 1, keys: [{ key: pubkeys[0], weight: 1 }, { key: pubkeys[1], weight: 1 }], accounts: [], waits: []

      // assert.deepEqual(authority.fromObject(pubkey), auth)
    };assert.deepEqual(authority.fromObject(authUnsorted), authSorted);
  });

  it('public_key', function () {
    var eos = Eos();
    var _eos$fc = eos.fc,
        structs = _eos$fc.structs,
        types = _eos$fc.types;

    var PublicKeyType = types.public_key();
    var pubkey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
    // 02c0ded2bc1f1305fb0faac5e6c03ee3a1924234985427b6167ca569d13df435cf
    assertSerializer(PublicKeyType, pubkey);
  });

  it('symbol', function () {
    var eos = Eos();
    var types = eos.fc.types;

    var _Symbol = types.symbol();

    assertSerializer(_Symbol, '4,SYS', '4,SYS', 'SYS');
  });

  it('extended_symbol', function () {
    var eos = Eos({ defaults: true });
    var esType = eos.fc.types.extended_symbol();
    var esString = esType.toObject();
    assertSerializer(esType, esString);
  });

  it('asset', function () {
    var eos = Eos();
    var types = eos.fc.types;

    var AssetType = types.asset();
    assertSerializer(AssetType, '1.1 4,SYS@eosio.token', '1.1000 SYS@eosio.token', '1.1000 SYS');
  });

  it('extended_asset', function () {
    var eos = Eos({ defaults: true });
    var eaType = eos.fc.types.extended_asset();
    var eaString = eaType.toObject();
    assertSerializer(eaType, eaString);
  });

  it('signature', function () {
    var eos = Eos();
    var types = eos.fc.types;

    var SignatureType = types.signature();
    var signatureString = 'SIG_K1_JwxtqesXpPdaZB9fdoVyzmbWkd8tuX742EQfnQNexTBfqryt2nn9PomT5xwsVnUB4m7KqTgTBQKYf2FTYbhkB5c7Kk9EsH';
    //const signatureString = 'SIG_K1_Jzdpi5RCzHLGsQbpGhndXBzcFs8vT5LHAtWLMxPzBdwRHSmJkcCdVu6oqPUQn1hbGUdErHvxtdSTS1YA73BThQFwV1v4G5'
    assertSerializer(SignatureType, signatureString);
  });
});

if (process.env['NODE_ENV'] === 'development') {

  describe('Eosio Abi', function () {

    it('Eosio token contract parses', function (done) {
      var eos = Eos();

      eos.contract('eosio.token', function (error, eosio_token) {
        assert(!error, error);
        assert(eosio_token.transfer, 'eosio.token contract');
        assert(eosio_token.issue, 'eosio.token contract');
        done();
      });
    });
  });
}

describe('Action.data', function () {
  it('json', function () {
    var eos = Eos({ forceActionDataHex: false });
    var _eos$fc2 = eos.fc,
        structs = _eos$fc2.structs,
        types = _eos$fc2.types;

    var value = {
      account: 'eosio.token',
      name: 'transfer',
      data: {
        from: 'inita',
        to: 'initb',
        quantity: '1.0000 SYS',
        memo: ''
      },
      authorization: []
    };
    assertSerializer(structs.action, value);
  });

  it('force hex', function () {
    var eos = Eos({ forceActionDataHex: true });
    var _eos$fc3 = eos.fc,
        structs = _eos$fc3.structs,
        types = _eos$fc3.types;

    var value = {
      account: 'eosio.token',
      name: 'transfer',
      data: {
        from: 'inita',
        to: 'initb',
        quantity: '1.0000 SYS',
        memo: ''
      },
      authorization: []
    };
    assertSerializer(structs.action, value, value);
  });

  it('unknown type', function () {
    var eos = Eos({ forceActionDataHex: false });
    var _eos$fc4 = eos.fc,
        structs = _eos$fc4.structs,
        types = _eos$fc4.types;

    var value = {
      account: 'eosio.token',
      name: 'mytype',
      data: '030a0b0c',
      authorization: []
    };
    assertSerializer(structs.action, value);
  });
});

function assertSerializer(type, value) {
  var fromObjectResult = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var toObjectResult = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : fromObjectResult;

  var obj = type.fromObject(value); // tests fromObject
  var buf = Fcbuffer.toBuffer(type, value); // tests appendByteBuffer
  var obj2 = Fcbuffer.fromBuffer(type, buf); // tests fromByteBuffer
  var obj3 = type.toObject(obj); // tests toObject

  if (!fromObjectResult && !toObjectResult) {
    assert.deepEqual(value, obj3, 'serialize object');
    assert.deepEqual(obj3, obj2, 'serialize buffer');
    return;
  }

  if (fromObjectResult) {
    assert(fromObjectResult, obj, 'fromObjectResult');
    assert(fromObjectResult, obj2, 'fromObjectResult');
  }

  if (toObjectResult) {
    assert(toObjectResult, obj3, 'toObjectResult');
  }
}