

import { encodeSecp256k1Signature, rawSecp256k1PubkeyToRawAddress } from "@cosmjs-evm/amino";
import { Keccak256, Secp256k1, sha256 } from "@cosmjs-evm/crypto";
import { Bech32, fromHex, toAscii, toBech32, toHex } from "@cosmjs-evm/encoding";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import { AccountData, DirectSignResponse, OfflineDirectSigner } from "./signer";
import { makeSignBytes } from "./signing";

/**
 * A wallet that holds a single secp256k1 keypair.
 *
 * If you want to work with BIP39 mnemonics and multiple accounts, use DirectSecp256k1HdWallet.
 */
export class DirectSecp256k1Wallet implements OfflineDirectSigner {
  /**
   * Creates a DirectSecp256k1Wallet from the given private key
   *
   * @param privkey The private key.
   * @param prefix The bech32 address prefix (human readable part). Defaults to "cosmos".
   * @param pubKeyType The public key type. Defaults to "/cosmos.crypto.secp256k1.PubKey".
   */
  public static async fromKey(
    privkey: Uint8Array,
    prefix = "cosmos",
    pubKeyType = "/cosmos.crypto.secp256k1.PubKey",
  ): Promise<DirectSecp256k1Wallet> {
    const { pubkey: uncompressed } = await Secp256k1.makeKeypair(privkey);
    return new DirectSecp256k1Wallet(privkey, uncompressed, prefix, pubKeyType);
  }

  private readonly pubkey: Uint8Array;
  private readonly uncompressedPubkey: Uint8Array;
  private readonly privkey: Uint8Array;
  private readonly prefix: string;
  private readonly pubKeyType: string;

  private constructor(privkey: Uint8Array, uncompressedPubkey: Uint8Array, prefix: string, pubKeyType: string) {
    this.privkey = privkey;
    this.uncompressedPubkey = uncompressedPubkey;
    this.pubkey = Secp256k1.compressPubkey(uncompressedPubkey);
    this.prefix = prefix;
    this.pubKeyType = pubKeyType;
  }

  private get address(): string {
    if (this.pubKeyType === "/ethermint.crypto.v1.ethsecp256k1.PubKey") {
      const hash = new Keccak256(this.uncompressedPubkey.slice(1)).digest();
      const lastTwentyBytes = toHex(hash.slice(-20));
      // EVM address
      const evmAddress = DirectSecp256k1Wallet.toChecksummedAddress("0x" + lastTwentyBytes);
      return DirectSecp256k1Wallet.getBech32AddressFromEVMAddress(evmAddress, this.prefix);
    }
    return toBech32(this.prefix, rawSecp256k1PubkeyToRawAddress(this.pubkey));
  }

  public async getAccounts(): Promise<readonly AccountData[]> {
    return [
      {
        algo: "secp256k1",
        address: this.address,
        pubkey: this.pubkey,
        pubKeyType: this.pubKeyType,
      },
    ];
  }

  // public async getAccounts(): Promise<readonly AccountData[]> {
  //   return [
  //     {
  //       algo: "secp256k1",
  //       address: this.address,
  //       pubkey: this.pubkey,
  //       pubKeyType: this.pubKeyType, // <-- add here, even if not in AccountData type
  //     } as AccountData & { pubKeyType: string },
  //   ];
  // }

  public async signDirect(
    address: string,
    signDoc: SignDoc,
    pubKeyType?: string,
  ): Promise<DirectSignResponse> {
    const signBytes = makeSignBytes(signDoc);
    if (address !== this.address) {
      throw new Error(`Address ${address} not found in wallet`);
    }



    // let kk = await this.getAccounts()
    // console.log("=====getAccounts=====",kk)
    // const pubkey = (0, proto_signing_1.encodePubkey)((0, amino_1.encodeSecp256k1Pubkey)(kk[0].pubkey));
    // console.log("======getAccounts=====",pubkey.typeUrl)

    // if (kk[0].pubKeyType =="/ethermint.crypto.v1.ethsecp256k1.PubKey"){
    //     pubKeyType= "/ethermint.crypto.v1.ethsecp256k1.PubKey"
    // }

// // let pubKeyTypes: string | undefined;
// if (pubKeyType === "/ethermint.crypto.v1.ethsecp256k1.PubKey") {
//   pubKeyType = "/ethermint.crypto.v1.ethsecp256k1.PubKey";
// }

    const type = pubKeyType ?? this.pubKeyType;

    switch (type) {
      case "/ethermint.crypto.v1.ethsecp256k1.PubKey": {
        const hashedMessage = new Keccak256(signBytes).digest();
        const signature = await Secp256k1.createSignature(hashedMessage, this.privkey);
        const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        const stdSignature = encodeSecp256k1Signature(
          this.pubkey,
          signatureBytes,
          "/ethermint.crypto.v1.ethsecp256k1.PubKey",
        );
        return {
          signed: signDoc,
          signature: stdSignature,
        };
      }
      default: {
        const hashedMessage = sha256(signBytes);
        const signature = await Secp256k1.createSignature(hashedMessage, this.privkey);
        const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        const stdSignature = encodeSecp256k1Signature(this.pubkey, signatureBytes);
        return {
          signed: signDoc,
          signature: stdSignature,
        };
      }
    }
  }

  private static getBech32AddressFromEVMAddress(
    evmAddress: string,
    bech32Prefix: string,
  ): string {
    if (!DirectSecp256k1Wallet.isAddress(evmAddress.toLowerCase())) {
      throw new TypeError("Please provide a valid EVM compatible address.");
    }

    const evmAddrWithoutHexPrefix = evmAddress.replace(/^(-)?0x/i, "$1");
    const evmAddressBytes = fromHex(evmAddrWithoutHexPrefix);
    const evmToBech32Address = Bech32.encode(bech32Prefix, evmAddressBytes);
    return evmToBech32Address;
  }
  private static isValidAddress(address: string): boolean {
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return false;
    }
    return true;
  }
  private static toChecksummedAddress(address: string): string {
    // 40 low hex characters
    let addressLower;
    if (typeof address === "string") {
      if (!DirectSecp256k1Wallet.isValidAddress(address)) {
        throw new Error("Input is not a valid Ethereum address");
      }
      addressLower = address.toLowerCase().replace("0x", "");
    } else {
      addressLower = toHex(address as any);
    }

    const addressHash = toHex(new Keccak256(toAscii(addressLower)).digest());
    let checksumAddress = "0x";
    for (let i = 0; i < 40; i++) {
      checksumAddress += parseInt(addressHash[i], 16) > 7 ? addressLower[i].toUpperCase() : addressLower[i];
    }
    return checksumAddress;
  }

  private static isAddress(address: string): boolean {
    // check if it has the basic requirements of an address
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
      // If it's ALL lowercase or ALL upppercase
    } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
      return true;
      // Otherwise check each case
    }
    return false;
  }
}