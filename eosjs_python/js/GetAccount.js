Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const chain_id = process.argv[3];
const wif = process.argv[4];
const accountName = process.argv[5];

eos = Eos({
  keyProvider: wif,
  httpEndpoint: httpEndpointAddress,
  chainId: chain_id
})

eos.getAccount(accountName).then(accountData => {
  var permissions = accountData.permissions;
  var entry = null;
  var data = {};
  for (var i = 0; i < permissions.length; i++){
    var permission = permissions[i];
    if (permission.perm_name == 'owner'){
      data['owner'] = permission.required_auth.keys[0].key;
    } else if(permission.perm_name == 'active'){
      data['active'] = permission.required_auth.keys[0].key;
    }
  }
  console.log(JSON.stringify(data));
}).catch(function (e) {
    console.error(e);
    process.exit(1);
});;