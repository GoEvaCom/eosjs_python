ecc = require('eosjs-ecc-eva');

const privKeySender = process.argv[2];
const pubKeyRecipient = process.argv[3];
const message = process.argv[4];


function encrypt(privKeySender, pubKeyRecipient, message){
	let encryptedMessage = ecc.Aes.encrypt(privKeySender, pubKeyRecipient, message);
	var b64EncryptedMessage = encryptedMessage.message.toString("base64");
	try {
		let data = encryptedMessage.nonce.low + "...." + encryptedMessage.nonce.high + "...." + encryptedMessage.checksum + "...." + b64EncryptedMessage;
		console.log(data);
	} catch(error) {
      console.error(error);
      process.exit(1);
    }
}
encrypt(privKeySender, pubKeyRecipient, message);

