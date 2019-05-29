Eos = require('eosjs');

const httpEndpointAddress = process.argv[2];
const chain_id = process.argv[3];
const wif = process.argv[4];
const blockNum = process.argv[5];

eos = Eos({
  keyProvider: wif,
  httpEndpoint: httpEndpointAddress,
  chainId: chain_id
})

var params = {
    block: blockNum,
    json: true,
};

eos.block(params).then(response => {
    console.log(JSON.stringify(response));
  }).catch(function (e) {
        console.error(e);
        process.exit(1);
        })
