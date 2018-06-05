'use strict';

var api = require('./api/v1');
var apiGen = require('./apigen');
var processArgs = require('./process-args');

var EosApi = function EosApi(config) {
  return apiGen('v1', api, config);
};

Object.assign(EosApi, {
  processArgs: processArgs,
  api: api,

  /** @deprecated */
  Testnet: function Testnet(config) {
    console.error('deprecated, change EosApi.Testnet(..) to just EosApi(..)');
    return EosApi(config);
  },

  /** @deprecated */
  Localnet: function Localnet(config) {
    console.error('deprecated, change EosApi.Localnet(..) to just EosApi(..)');
    return EosApi(config);
  }
});

module.exports = EosApi;