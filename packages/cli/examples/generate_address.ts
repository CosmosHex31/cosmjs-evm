import { encodeSecp256k1Pubkey, Secp256k1HdWallet } from "@cosmjs-evm/amino";
import { Bip39, Random } from "@cosmjs-evm/crypto";

const mnemonic = Bip39.encode(Random.getBytes(16)).toString();
const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic);
const [{ address, pubkey }] = await wallet.getAccounts();

console.info("mnemonic:", mnemonic);
console.info("pubkey:", encodeSecp256k1Pubkey(pubkey));
console.info("address:", address);
