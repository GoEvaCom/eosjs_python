ecc = require('eosjs-ecc');

const key_k1_format = process.argv[2];

var key = ecc.PublicKey.fromString(key_k1_format);
var keyPlainText = key.toString();
console.log(keyPlainText);
