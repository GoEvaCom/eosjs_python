const { Api, JsonRpc } = require('eosjs-deserialize');
const { hexToUint8Array } = require('eosjs-deserialize/dist/eosjs-serialize')
const fetch = require('node-fetch');
const util = require('util');

const endpoint = process.argv[2];
const cAbiHex = process.argv[3];

/**
 * Deserializes contract abi to json
 */
function deserializeContract(endpoint, cAbiHex) { 
    //Setup API
    const rpc = new JsonRpc(endpoint, { fetch });
    const api = new Api({
        rpc,
        signatureProvider: null,
        textDecoder: new util.TextDecoder(),
        textEncoder: new util.TextEncoder()
      })
    
    const cAbiRaw = hexToUint8Array(cAbiHex);
    const cAbiJson = api.rawAbiToJson(cAbiRaw);
    
    console.log(JSON.stringify({cAbiJson}));
}

deserializeContract(endpoint, cAbiHex);