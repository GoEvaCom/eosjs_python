Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const chain_id = process.argv[3];
const wif = process.argv[4];
const contract_account = process.argv[5];
const contract_function = process.argv[6];
const authorization_actor = process.argv[7];
const authorization_permission = process.argv[8];
const data_values = JSON.parse(process.argv[9]);

eos = Eos({
  keyProvider: wif,
  httpEndpoint: httpEndpointAddress,
  chainId: chain_id
})


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
}).then(function (value){
        console.log(JSON.stringify(value));
        return value;
      }).catch(function (e) {
      console.error(e);
      process.exit(1);
      })