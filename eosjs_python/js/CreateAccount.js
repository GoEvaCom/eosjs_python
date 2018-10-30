Eos = require('eosjs')

const httpEndpointAddress = process.argv[2];
const chain_id = process.argv[3];
const creator_account = process.argv[4];
const account_name = process.argv[5];
const keyProviderValue = process.argv[6];
const owner_public_key = process.argv[7];
const active_public_key = process.argv[8];
const buyrambytes_bytes = process.argv[9];
const delegatebw_stake_net_quantity = process.argv[10];
const delegatebw_stake_cpu_quantity = process.argv[11];
const delegatebw_transfer = process.argv[12];


function create_account(httpEndpointAddress, creator_account, account_name, keyProviderValue, owner_public_key, active_public_key, buyrambytes_bytes, delegatebw_stake_net_quantity, delegatebw_stake_cpu_quantity, delegatebw_transfer){
      eos = Eos({keyProvider: keyProviderValue, httpEndpoint: httpEndpointAddress, chainId: chain_id})
      eos.transaction(tr => {
          let data = {
              creator: creator_account,
              name: account_name,
              owner: owner_public_key,
              active: active_public_key
          }
          console.log(data);
          tr.newaccount(data);
          tr.buyrambytes({
              payer: creator_account,
              receiver: account_name,
              bytes: parseInt(buyrambytes_bytes)
          });
          tr.delegatebw({
              from: creator_account,
              receiver: account_name,
              stake_net_quantity: delegatebw_stake_net_quantity,
              stake_cpu_quantity: delegatebw_stake_cpu_quantity,
              transfer: parseInt(delegatebw_transfer)
          });
      }).then(function (value){
        console.log(JSON.stringify(value));
      }).catch(function (e) {
      console.error(e);
      process.exit(1);
      })
}


create_account(httpEndpointAddress, creator_account, account_name, keyProviderValue, owner_public_key, active_public_key, buyrambytes_bytes, delegatebw_stake_net_quantity, delegatebw_stake_cpu_quantity, delegatebw_transfer);
