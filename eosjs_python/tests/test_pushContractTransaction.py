from eosjs_python import Eos

eos = Eos({
	'http_address': 'http://localhost:8888',
	'key_provider': '5JhhMGNPsuU42XXjZ57FcDKvbb7KLrehN65tdTQFrH51uruZLHi'
})

#cleos push action eosio.token transfer '["eva","rider1","1 EVA","initial balance"]' -p eva

eos.push_transaction('eosio.token','transfer','eva','active',{
	"from":"eva",
	"to":"rider1",
	"quantity":"1 EVA",
	"memo":""
})

#cleos push action eva createrider '["rider3"]' -p rider3

eos.push_transaction('eva','createrider','rider3','active',{
	"account":"rider3"
})
