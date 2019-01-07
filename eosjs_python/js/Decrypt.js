ecc = require('eosjs-ecc-eva');
var Long =  require('long');

const privKeyRecipient = process.argv[2];
const pubKeySender = process.argv[3];
const encryptedMessage = process.argv[4];

function decrypt(privKeyRecipient, pubKeySender, encryptedMessage){
	var values = encryptedMessage.split("....");
	var low = Number(values[0]);
	var high = Number(values[1]);
	var nonce = new Long(low, high, false);
	var checksum = Number(values[2]);
	var message = Buffer.from(values[3], "base64");
	try {
		let messageBuffer = ecc.Aes.decrypt(privKeyRecipient, pubKeySender, nonce.toNumber(), message, checksum);
		console.log(messageBuffer.toString("utf8"));
	} catch(error) {
		console.error(error);
     	process.exit(1);
	}
}

decrypt(privKeyRecipient, pubKeySender, encryptedMessage);