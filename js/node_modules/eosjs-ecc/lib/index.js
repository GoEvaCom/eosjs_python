'use strict';

var commonApi = require('./api_common');
var objectApi = require('./api_object');

var ecc = Object.assign({}, commonApi, objectApi);

module.exports = ecc;