# EOSJS PYTHON

eosjs python is a eosjs wrapper to communicate with the eos blockchain in python. It works by wrapping the nodejs library eosjs into a Python package.

##Authors
@raphaelgodro

##License
This project is licensed under the MIT License.

## Installation

First, install nodejs if its not on your system already:
```
apt-get update
apt-get -y install curl
curl -sL https://deb.nodesource.com/setup_10.x | bash
apt-get -y install nodejs
```

You also need eosjs as a dependency with npm :
```
npm install --save eosjs
```

Then install from Pypi packages:
```
pip3 install eosjs_python
```

Or from source`(if you want to contribute) : 
```
python3 setup.py develop
```



## Examples using the library

### Generate ECC keys
```
from eosjs_python import Eos

eos = Eos('http://172.18.0.1:8888')
key_pair = eos.generate_key_pair()
print(key_pair)
```

### Create EOS account
```
from eosjs_python import Eos

eos = Eos({
	'http_address': 'http://172.18.0.1:8888',
	'key_provider': '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
})

eos.newaccount({
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

## Contributing

Some work still has to be done to interface with all eosjs possibilities, feel free to send some pull requests!
