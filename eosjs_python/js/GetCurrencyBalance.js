Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const keyProviderValue = process.argv[3];
const code = process.argv[4];
const account = process.argv[5];
const symbol = process.argv[6];


eos = Eos({
  keyProvider: keyProviderValue,
  httpEndpoint: httpEndpointAddress
})

eos.getCurrencyBalance({
    code: code,
    account: account,
    symbol: symbol,
    json: true,
}).then(response => {
  console.log(JSON.stringify(response));
}).catch(function (e) {
  console.error(e);
  process.exit(1);
  })