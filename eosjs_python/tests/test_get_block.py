from eosjs_python import Eos

eos = Eos({
    'http_address': 'https://chain-net-prod.eva.cab/',
    'key_provider': '5KR93vcDVtJJ8eZ3td4gU87p8PPhsfgK5NZKyDij83kSRJ2UTrM'
})

print(eos.get_block('2454645'))
