from Naked.toolshed.shell import (muterun_js, execute_js)
import sys, base64, json
from eosjs_python.Exceptions import * 

class Eos:
	def __init__(self, http_address):
		self.http_address = http_address

	def generate_key_pair(self):
		response = muterun_js('../../js/GenerateKeys.js')
		if response.exitcode == 0:
			data = load_data(response.stdout)
			return data
		else:
		    raise GenerateKeysException(response.stderr)


def load_data(stdout):
	true_string = stdout.decode('utf8')
	return json.loads(true_string)

