from eosjs_python import Eos

eos = Eos({
    'http_address': '' #Your endpoint
})

abi_hex = "" #Your ABI hex-encoded binary data for the contract
data_hex = "" #Your hex-encoded binary data for the action

print(eos.deserialize_action_data(
    abi_hex[0], 
    'acount', 
    'action_name', 
    data_hex))
