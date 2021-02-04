from Naked.toolshed.shell import (muterun_js)
import json, os, requests
from eosjs_python.Exceptions import *


class Eos:
    current_dir = os.path.dirname(os.path.realpath(__file__))

    def __init__(self, config):
        self.http_address = config['http_address'] if 'http_address' in config else None
        self.key_provider = config[
            'key_provider'] if 'key_provider' in config else '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
        self.chain_id = self.get_chain_id()
        if 'debug' in config:
            self.debug_mode = config['debug']
        else:
            self.debug_mode = False

    @classmethod
    def generate_key_pair(cls):
        response = muterun_js(cls.current_dir + '/js/GenerateKeys.js')
        if response.exitcode == 0:
            true_string = response.stdout.decode('utf8')
            data = json.loads(true_string)
            return data
        else:
            raise GenerateKeysException(response.stderr)

    @classmethod
    def encrypt_chain_message(cls, privKeySender, pubKeyRecipient, message):
        arguments = "'%s' '%s' '%s'" % (
            privKeySender,
            pubKeyRecipient,
            message
        )

        response = muterun_js(cls.current_dir + '/js/Encrypt.js', arguments=arguments)
        if response.exitcode == 0:
            encrypted_msg = response.stdout.decode('utf8')
            return encrypted_msg.replace("\n", "")
        else:
            raise EncryptSecretException(response.stderr)

    @classmethod
    def decrypt_chain_message(cls, privKeyRecipient, pubKeySender, encryptedMessage):
        arguments = "'%s' '%s' '%s'" % (
            privKeyRecipient,
            pubKeySender,
            encryptedMessage
        )

        response = muterun_js(cls.current_dir + '/js/Decrypt.js', arguments=arguments)
        if response.exitcode == 0:
            plaintext = response.stdout.decode('utf8')
            return plaintext.replace("\n", "")
        else:
            raise EncryptSecretException(response.stderr)

    def newaccount(self, config):
        """
		node CreateAccount.js 'http://172.18.0.1:8888' 'eosio' 'mytest12' '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3' '5JuaVWh3LDh1VH69urCdCa3A2YiQydbsLM1ZtGgsTXLYouxaTfc' 'EOS7vTHtMbZ1g9P8BiyAGD7Ni7H6UALVLVCW13xZrXT4heCBke3it' 'EOS8KKKYBBdwrmXRRynDXSxTX2qoT9TA4agahXXF4ccUgRCy81RNc' 8192 '100.0000 SYS' '100.0000 SYS' 0
		"""
        arguments = "'%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s'" % (
            self.http_address,
            self.chain_id,
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
        response = muterun_js(self.current_dir + '/js/CreateAccount.js', arguments=arguments)
        if response.exitcode == 0:
            return
        else:
            raise CreateAccountException(response.stderr)

    def push_transaction(self, acct_contract, func_name, acct_owner, permission, data):
        """
		node PushContractTransaction.js 'http://127.0.0.1:8888' '5JhhMGNPsuU52XXjZ57FcDKvbb7KLrEhN65tdTQFrH51uruZLHi' 'eosio.token' 'transfer' 'eva' 'active' '{"from":"eva","to":"rider1","quantity":"1 EVA","memo":""}'
		"""
        arguments = "'%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s'" % (
            self.http_address,
            self.chain_id,
            self.key_provider,
            acct_contract,
            func_name,
            acct_owner,
            permission,
            json.dumps(data)
        )
        response = muterun_js(self.current_dir + '/js/PushContractTransaction.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise PushContractTransactionException(response.stderr)

    def get_table(self, code, scope, table, key_type='', index_position='', limit='', table_key='', lower_bound=''):
        arguments = "'%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s' '%s'" % (
            self.http_address,
            self.chain_id,
            self.key_provider,
            code,
            scope,
            table,
            key_type,
            index_position,
            limit,
            table_key,
            lower_bound
        )
        response = muterun_js(self.current_dir + '/js/GetTable.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise GetTableException(response.stderr)

    def get_currency_balance(self, code, account, symbol):
        """
		node GetCurrencyBalance.js 'http://127.0.0.1:8888' '5JhhMGNPsuU52XXjZ57FcDKvbb7KLrEhN65tdTQFrH51uruZLHi' 'eosio.token' 'xd455yhesww2' 'EVA'
		"""
        arguments = "'%s' '%s' '%s' '%s' '%s' '%s'" % (
            self.http_address,
            self.chain_id,
            self.key_provider,
            code,
            account,
            symbol
        )
        response = muterun_js(self.current_dir + '/js/GetCurrencyBalance.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise GetBalanceException(response.stderr)

    def get_account(self, account_name):
        """
        nodejs GetAccount.js "https://eos.greymass.com:443" "WIF" "eosjacklucky"
        """
        arguments = "'%s' '%s' '%s' '%s'" % (
            self.http_address,
            self.chain_id,
            self.key_provider,
            account_name
        )
        response = muterun_js(self.current_dir + '/js/GetAccount.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise GetAccountException(response.stderr)

    def load_data(self, stdout):
        true_string = stdout.decode('utf8')
        if self.debug_mode:
            print(true_string)
        return json.loads(true_string)


    def get_chain_id(self):
        r = requests.get(self.http_address+"/v1/chain/get_info")
        response = json.loads(r.text)
        return response["chain_id"]
    
    def get_block (self, block_num):
        """
        nodejs GetBlock.js "https://eos.greymass.com:443" "WIF" "eosjacklucky"
        """
        arguments = "'%s' '%s' '%s' '%s'" % (
            self.http_address,
            self.chain_id,
            self.key_provider,
            block_num
        )
        response = muterun_js(self.current_dir + '/js/GetBlock.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise GetAccountException(response.stderr)

    def deserialize_action_data (self, c_abi, c_account, act_name, act_data_hex):
        """
        Deserializes action data based on a specific contract abi.
        """
        arguments = "'%s' '%s' '%s' '%s'" % (
            c_abi,
            c_account,
            act_name,
            act_data_hex
        )
        response = muterun_js(self.current_dir + '/js/ActionDeserializer.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise GetAccountException(response.stderr)

    def deserialize_contract (self, c_abi_hex):
        """
        Deserializes contract binary data
        """
        arguments = "'%s' '%s'" % (
            self.http_address,
            c_abi_hex
        )
        response = muterun_js(self.current_dir + '/js/ContractDeserializer.js', arguments=arguments)
        if response.exitcode == 0:
            data = self.load_data(response.stdout)
            return data
        else:
            raise GetAccountException(response.stderr)