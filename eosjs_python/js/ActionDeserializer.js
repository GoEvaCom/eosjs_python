const { createInitialTypes, getType, getTypesFromAbi, deserializeActionData } = require('eosjs-deserialize/dist/eosjs-serialize')
const { hexToUint8Array } = require('eosjs-deserialize/dist/eosjs-serialize')
const util = require('util');

const cAbiJson = process.argv[2];
const cAccount = process.argv[3];
const actName = process.argv[4];
const actDataHex = process.argv[5];

/**
 * Deserializes action data based on a specific contract abi.
 */
function deserializeActData(cAbiJson, cAccount, actName, actDataHex) {  

    const types = getTypesFromAbi(createInitialTypes(), cAbiJson);

    const actions = new Map();
    for (const { name, type } of cAbiJson.actions) {
        actions.set(name, getType(types, type));
    }
    const contract = { types, actions };

    const actDataJson = deserializeActionData(
                contract,
                cAccount,
                actName,
                actDataHex,
                new util.TextEncoder(),
                new util.TextDecoder());

    console.log(JSON.stringify(actDataJson));
}

deserializeActData(cAbiJson, cAccount, actName, actDataHex);