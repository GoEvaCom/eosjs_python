Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const wif = process.argv[3];
const code = process.argv[4];
const scope = process.argv[5];
const table = process.argv[6];


eos = Eos({
  keyProvider: wif,
  httpEndpoint: httpEndpointAddress
})

eos.getTableRows({
    code: code,
    scope: scope,
    table: table,
    json: true,
}).then(response => {
  console.log(JSON.stringify(response));
});