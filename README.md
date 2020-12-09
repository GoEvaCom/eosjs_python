# EOSJS PYTHON

eosjs python is a eosjs wrapper to communicate with the eos blockchain in python. It works by wrapping the nodejs library eosjs into a Python package.

## Authors
* [@raphaelgodro](https://github.com/raphaelgodro)

## License
This project is licensed under the MIT License.

## Installation

First, install nodejs if its not on your system already:
```
apt-get update
apt-get -y install curl
curl -sL https://deb.nodesource.com/setup_10.x | bash
apt-get -y install nodejs
```

Then install from Pypi packages:
```
pip3 install eosjs_python
```

Or from source`(if you want to contribute)` : 
```
git clone https://github.com/EvaCoop/eosjs_python
cd eosjs_python
python3 setup.py develop
```

You also need eosjs as a node dependency.
You could install it globally
```
npm install -g eosjs
```
Or can also install it in the js subdirectory within this package
```
cd js && npm install
```

In order for the repo to work, one really need to install the js dependencies.

## Examples using the library

### Generate ECC keys
```python
from eosjs_python import Eos

key_pair = Eos.generate_key_pair()
print(key_pair)
```

### Create EOS account
```python
from eosjs_python import Eos

eos = Eos({
	'http_address': 'http://167.99.181.173/:8888',
	'key_provider': '5KjwNHXDMwdEbzBx858GpDqGM2u3wD4rYkYNskRdcgTZTcQEBQZ'
})

resp = eos.newaccount({
	'creator': 'eosio',
	'name': 'mytestacc13',
	'owner_public_key': 'EOS7vTHtMbZ1g9P8BiyAGD7Ni7H6UALVLVCW13xZrXT4heCBke3it',
	'active_public_key': 'EOS8KKKYBBdwrmXRRynDXSxTX2qoT9TA4agahXXF4ccUgRCy81RNc',
	'buyrambytes_bytes': 8192,
	'delegatebw_stake_net_quantity': '100.0000 SYS',
	'delegatebw_stake_cpu_quantity': '100.0000 SYS',
	'delegatebw_transfer': 0
})
```

### Push transaction into contract
```python
from eosjs_python import Eos

eos = Eos({
	'http_address': 'http://172.18.0.1:8888',
	'key_provider': '5JhhMGNPsuU42XXjZ57FcDKvbb7KLrehN65tdTQFrH51uruZLHi'
})

#cleos push action eosio.token transfer '["eva","rider1","1 EVA","initial balance"]' -p eva

eos.push_transaction('eosio.token','transfer','eva','active',{
	"from":"eva",
	"to":"mytestacc13",
	"quantity":"1 EVA",
	"memo":""
})
```

### Reading a table
```python
from eosjs_python import Eos
eos = Eos({
	'http_address': 'http://127.0.0.1:8888',
	'key_provider': '5JhhMGNPsuU42XXjZ57FcDKvbb7KLrehN65tdTQFrH51uruZLHi'
})
eos.get_table('eva', 'eva', 'communities')

```

### Getting Currency Balance

```python
from eosjs_python import Eos

eos = Eos({
    'http_address': 'http://localhost:8888',
    'key_provider': '5KR93vcDVtJJ8eZ3td4gU87p8PPhsfgK5NZKyDij83kSRJ2UTrM'
})

eos.get_currency_balance('eosio.token', 'xcdzdbkqamvu', 'EVA')

```

### Send secrets
This is useful to share secrets on a public blockchain 
```python
/*
Sender
Private key: 5KiKyYPR3tJjwRt1XsJXXofD3YsYUSzSfvPg7pCSNDv64Av28ib
Public key: EOS6Fz1GpMuxh3ZXGX34N7B7xY9VP5hmxcxRYBvgSkJRT4eGWPUvD

Receiver
Private key: 5KhAG8w3K8HVDaJLY6HxZTrfrZs7mjU9Afih5axxpRLNW6rvEDf
Public key: EOS6E3T6S2xy5Fu2fZrZbHRsPNHjx5JXXFkBwQA9gCrgVTDALxQeC
*/
from eosjs_python import Eos
encrypted_msg = Eos.encrypt_chain_message("5KiKyYPR3tJjwRt1XsJXXofD3YsYUSzSfvPg7pCSNDv64Av28ib", "EOS6E3T6S2xy5Fu2fZrZbHRsPNHjx5JXXFkBwQA9gCrgVTDALxQeC", "secret chain message")
plaintext = Eos.decrypt_chain_message("5KhAG8w3K8HVDaJLY6HxZTrfrZs7mjU9Afih5axxpRLNW6rvEDf", "EOS6Fz1GpMuxh3ZXGX34N7B7xY9VP5hmxcxRYBvgSkJRT4eGWPUvD", encrypted_msg)
print(plaintext)
```
## Contributing

Some work still has to be done to interface with all eosjs possibilities, feel free to send some pull requests!
