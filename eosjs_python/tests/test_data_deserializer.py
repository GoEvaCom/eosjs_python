from eosjs_python import Eos
import json

eos = Eos({
    'http_address': 'http://167.99.181.173:8888' #Your endpoint
})

abi_hex = "" #Your ABI hex-encoded binary data for the contract
with open("c_ex.txt") as file:
    abi_hex = file.readlines()

data_hex = "520e8ca7ffffffffe0942e3b778df4e9000000015983cc5693013934303531383732302e2e2e2e32343630313530372e2e2e2e333438343035333539312e2e2e2e4a596e624c5673596e49636a73745a5853464f722b41484a426b6b7048586672704e6d796a486c69396f4c7a7567587055485669444d6968616d627451382f35634b74556458572f334a684957484661796b73702b70386d6e346b67724e6f504f526454364d46547074773d00" #Your hex-encoded binary data for the action

contract = eos.deserialize_contract(abi_hex[0])
contract_r = json.dumps(contract)

for i in range(0, 1):
    d = eos.deserialize_action_data("", 'eva', 'incomm', data_hex)

print(d)