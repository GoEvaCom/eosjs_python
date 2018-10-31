Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const chain_id = process.argv[3];
const keyProviderValue = process.argv[4];
const code = process.argv[5];
const account = process.argv[6];
const symbol = process.argv[7];


eos = Eos({
  keyProvider: keyProviderValue,
  httpEndpoint: httpEndpointAddress,
  chainId: chain_id
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