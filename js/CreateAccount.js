eos = require('eosjs')
ecc = require('eosjs-ecc')

const EOS_ADDRESS = 'http://172.18.0.1:8888';
const AUTHORITY_PRIVATE_KEY = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
const AUTHORITY_PUBLIC_KEY = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
const CHAIN_ID = 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'




function generate_eos_keys() {
  return ecc.randomKey().then(privateKey => {
    const publicKey = ecc.privateToPublic(privateKey);
    return {
      'private': privateKey,
      'public': publicKey
    }
  }).then(responseData => {
    return responseData;
  });
}

function create_account(keys){
  wif = keys['active']['private']

  eos = Eos({keyProvider: AUTHORITY_PRIVATE_KEY, httpEndpoint: EOS_ADDRESS})
  console.log('wif', wif);
  console.log('AUTHORITY_PRIVATE_KEY', AUTHORITY_PRIVATE_KEY);
  console.log(keys);

  const account_name = 'mycontract13'

  eos.transaction(tr => {
    tr.newaccount({
      creator: 'eosio',
      name: account_name,
      owner: keys['owner']['public'],
      active: keys['active']['public']
    })
    tr.buyrambytes({
      payer: 'eosio',
      receiver: account_name,
      bytes: 8192
    })
    tr.delegatebw({
      from: 'eosio',
      receiver: account_name,
      stake_net_quantity: '100.0000 SYS',
      stake_cpu_quantity: '100.0000 SYS',
      transfer: 0
    })
  });

}


function main(){
  keys = {}
  generate_eos_keys().then(key => {return key;}).then(key => {
    keys['owner'] = key;
    generate_eos_keys().then(key2 => {return key2;}).then(key2 => {
      keys['active'] = key2;
      create_account(keys);
    });
  });
}

main();