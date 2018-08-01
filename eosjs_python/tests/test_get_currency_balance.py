from eosjs_python import Eos

eos = Eos({
    'http_address': 'http://localhost:8888',
    'key_provider': '5KR93vcDVtJJ8eZ3td4gU87p8PPhsfgK5NZKyDij83kSRJ2UTrM'
})

eos.get_currency_balance('eosio.token', 'xcdzdbkqamvu', 'EVA')
