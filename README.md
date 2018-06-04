# EOSJS PYTHON

eosjs python is a eosjs wrapper to communicate with the eos blockchain in python. It works by wrapping `nodejs`.


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
