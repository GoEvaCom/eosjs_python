[![Build Status](https://travis-ci.org/EOSIO/eosjs-fcbuffer.svg?branch=master)](https://travis-ci.org/EOSIO/eosjs-fcbuffer)
[![Coverage Status](https://coveralls.io/repos/github/EOSIO/eosjs-fcbuffer/badge.svg?branch=master)](https://coveralls.io/github/EOSIO/eosjs-fcbuffer?branch=master)
[![NPM](https://img.shields.io/npm/v/fcbuffer.svg)](https://www.npmjs.org/package/fcbuffer)

# FC Buffer

Serialization library geared towards immutable data storage such as blockchains.

For EOS compatible implementation use this library from [eosjs](https://github.com/eosio/eosjs) instead.

FC Buffer is a recent refactor from serialization code used in Bitshares and
Steem.  Some of the serialization code was reduced and the definitions language
added.  The definition format may change.

# Features

- Validation and error reporting
- Concise and intuitive binary format
- Compatible with the FC library used in Graphene blockchains
- Extendable JSON structure definitions
- Binary and JSON string serialization
- Unit testing and code coverage

# Non Features

- Consider Cap'n Proto or Protocol Buffers if your data structures need to
  be extended at the serialization layer.
- No streams, smaller blockchain sized objects are used

# Example

```javascript
Fcbuffer = require('fcbuffer') // or: Fcbuffer = require('./src')

assert = require('assert')

definitions = {
    message_type: 'fixed_string16', // CustomType: built-in type
    account_name: 'fixed_string32', // CustomType: built-in type
    message: { // struct
        fields: {
          from: 'account_name',
          to: 'account_name',
          cc: 'account_name[]',
          type: 'message_type',
          data: 'bytes' // built-in type
        }
    }
}

// Warning: Do not use {defaults: true} in production
fcbuffer = Fcbuffer(definitions, {defaults: true})

// Check for errors anywhere in the definitions structure
assert(fcbuffer.errors.length === 0, fcbuffer.errors)

// If there are no errors, you'll get your structs
var {message} = fcbuffer.structs

// Create JSON serializable object
// returns { from: '', to: '', cc: [ '' ], type: '', data: '' }
message.toObject()

// Convert JSON into a more compact fcbuffer serializable object
msg = { from: 'jc', to: 'dan', cc: [ 'abc' ], type: '', data: '0f0f0f' }

// Serialize fcbuffer object into a single binary buffer
buf = Fcbuffer.toBuffer(message, msg)
// returns <Buffer 02 6a 63 07 63 68 61 72 6c 65 73 01 03 61 62 63 00 03 0f 0f 0f>

// Convert binary back into a new (cloned) object
obj = Fcbuffer.fromBuffer(message, buf)

// Check that the new object matches the original
assert.deepEqual(msg, obj)

// A definition may extend and define other definitions.  This works in the initial
// definition or later via the extend function.
fcbuffer2 = fcbuffer.extend({
    permission_name: 'fixed_string16',
    permission_level: {
        fields: {
          actor: 'account_name',
          permission: 'permission_name'
        }
    }
})

assert(fcbuffer2.errors.length === 0, fcbuffer2.errors)

var {permission_level} = fcbuffer2.structs
permission_level.toObject()
// toObject returns: { actor: '', permission: '' }

```

# References

- Built-in Types: [types.js](./src/types.js)
- EOS Definitions: [schema](https://github.com/EOSIO/eosjs-json/blob/master/schema)

# Environment

Node 6+ and browser (browserify, webpack, etc)
