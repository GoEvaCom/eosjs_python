from eosjs_python import Eos

eos = Eos('http://172.18.0.1:8888')
key_pair = eos.generate_key_pair()
print(key_pair)