from Naked.toolshed.shell import (muterun_js, execute_js)
import sys, base64, json, os
from eosjs_python.Exceptions import * 

class Eos:
	current_dir = os.path.dirname(os.path.realpath(__file__))

	def __init__(self, config):
		self.http_address = config['http_address'] if 'http_address' in config else 'http://127.0.0.1:8888'
		self.key_provider = config['key_provider'] if 'key_provider' in config else '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'

	@classmethod
	def generate_key_pair(cls):
		response = muterun_js(cls.current_dir + '/js/GenerateKeys.js')
		if response.exitcode == 0:
			data = load_data(response.stdout)
			return data
		else:
		    raise GenerateKeysException(response.stderr)

	def newaccount(self, config):
		"""
		node CreateAccount.js 'http://172.18.0.1:8888' 'eosio' 'mytest12' '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3' '5JuaVWh3LDh1VH69urCdCa3A2YiQydbsLM1ZtGgsTXLYouxaTfc' 'EOS7vTHtMbZ1g9P8BiyAGD7Ni7H6UALVLVCW13xZrXT4heCBke3it' 'EOS8KKKYBBdwrmXRRynDXSxTX2qoT9TA4agahXXF4ccUgRCy81RNc' 8192 '100.0000 SYS' '100.0000 SYS' 0
		"""

		arguments = '"%s" "%s" "%s" "%s" "%s" "%s" %s "%s" "%s" %s' % (
			self.http_address,
			config['creator'] if 'creator' in config else 'eosio',
			config['name'],
			self.key_provider,
			config['owner_public_key'],
			config['active_public_key'],
			config['buyrambytes_bytes'] if 'buyrambytes_bytes' in config else 8192,
			config['delegatebw_stake_net_quantity'] if 'delegatebw_stake_net_quantity' in config else '100.0000 SYS',
			config['delegatebw_stake_cpu_quantity'] if 'delegatebw_stake_cpu_quantity' in config else '100.0000 SYS',
			config['delegatebw_transfer'] if 'delegatebw_transfer' in config else 0
		)
		print('arguments', arguments)
		response = muterun_js(self.current_dir + '/js/CreateAccount.js', arguments=arguments)
		if response.exitcode == 0:
			print('out')
			print(response.stdout.decode('utf8'))
		else:
		    raise CreateAccountException(response.stderr)

	def push_transaction(self, acct_contract, func_name, acct_owner, permission, data):
		"""
		node PushContractTransaction.js 'http://127.0.0.1:8888' '5JhhMGNPsuU52XXjZ57FcDKvbb7KLrEhN65tdTQFrH51uruZLHi' 'eosio.token' 'transfer' 'eva' 'active' '{"from":"eva","to":"rider1","quantity":"1 EVA","memo":""}'
		"""
		arguments = "'%s' '%s' '%s' '%s' '%s' '%s' '%s' " % (
			self.http_address,
			self.key_provider,
			acct_contract,
			func_name,
			acct_owner,
			permission,
			json.dumps(data)
		)
		print(arguments)
		response = muterun_js(self.current_dir + '/js/PushContractTransaction.js', arguments=arguments)
		if response.exitcode == 0:
			print(response.stdout.decode('utf8'))
		else:
		    raise PushContractTransactionException(response.stderr)

	def get_table(self, code, scope, table):
		"""
		node GetTable.js 'http://127.0.0.1:8888' '5JhhMGNPsuU52XXjZ57FcDKvbb7KLrEhN65tdTQFrH51uruZLHi' 'eva' 'eva' 'communities'
		"""
		arguments = "'%s' '%s' '%s' '%s' '%s'" % (
			self.http_address,
			self.key_provider,
			code,
			scope,
			table
		)
		print(arguments)
		response = muterun_js(self.current_dir + '/js/GetTable.js', arguments=arguments)
		if response.exitcode == 0:
			print(response.stdout.decode('utf8'))
		else:
		    raise PushContractTransactionException(response.stderr)
		

def load_data(stdout):
	true_string = stdout.decode('utf8')
	return json.loads(true_string)

