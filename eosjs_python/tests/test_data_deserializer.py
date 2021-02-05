from eosjs_python import Eos
import json

eos = Eos({
    'http_address': '' #Your endpoint
})

abi_hex = "" #Your ABI hex-encoded binary data for the contract
data_hex = "" #Your hex-encoded binary data for the action

contract = eos.deserialize_contract(abi_hex[0])
contract_r = json.dumps(contract)

action = eos.deserialize_action_data(""" YOUR DATA """)

print(action)