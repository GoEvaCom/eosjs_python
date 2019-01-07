eos = require('eosjs')
ecc = require('eosjs-ecc-eva');

function generate_eos_keys() {
  return ecc.randomKey().then(privateKey => {
    const publicKey = ecc.privateToPublic(privateKey);
    return {
      "private": privateKey,
      "public": publicKey
    }
  }).then(responseData => {
    return responseData;
  });
}



function main(){
  keys = {}
  generate_eos_keys().then(key => {return key;}).then(key => {
    console.log(JSON.stringify(key));
  });
}

main();