Eos = require('eosjs') // Eos = require('./src')

const httpEndpointAddress = process.argv[2];
const wif = process.argv[3];
const code = process.argv[4];
const scope = process.argv[5];
const table = process.argv[6];
const key_type = process.argv[7];
const index_position = process.argv[8];
const limit = process.argv[9];
const table_key = process.argv[10];
const lower_bound = process.argv[11];


eos = Eos({
  keyProvider: wif,
  httpEndpoint: httpEndpointAddress
})

var params = {
    code: code,
    scope: scope,
    table: table,
    json: true,
};

if (key_type.length > 0){
  params['key_type'] = key_type;
}

if (index_position.length > 0){
  params['index_position'] = parseInt(index_position);
}

if (limit.length > 0){
  params['limit'] = parseInt(limit);
}

if (table_key.length > 0){
  params['table_key'] = table_key;
}

if (lower_bound.length > 0){
  params['lower_bound'] = lower_bound;
}

eos.getTableRows(params).then(response => {
  console.log(JSON.stringify(response));
}).catch(function (e) {
      console.error(e);
      process.exit(1);
      })
