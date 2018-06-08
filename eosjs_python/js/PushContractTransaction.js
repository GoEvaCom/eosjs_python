Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const wif = process.argv[3];
const contract_account = process.argv[4];
const contract_function = process.argv[5];
const authorization_actor = process.argv[6];
const authorization_permission = process.argv[7];
const data_values = JSON.parse(process.argv[8]);

eos = Eos({
  keyProvider: wif,
  httpEndpoint: httpEndpointAddress
})

//nodejs 'http://127.0.0.1:8888' '5JhhMGNPsuU42XXjZ57FcDKvbb7KLrehN65tdTQFrH51uruZLHi' 'eosio.token' 'transfer' 'eva' 'active' '{"from":"eva","to":"rider1","quantity":"1 EVA","memo":""}'

// returns Promise
eos.transaction({
  actions: [
    {
      account: contract_account,
      name: contract_function,
      authorization: [{
        actor: authorization_actor,
        permission: authorization_permission
      }],
      data: data_values
    }
  ]
})