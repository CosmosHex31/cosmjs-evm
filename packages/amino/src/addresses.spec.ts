import { fromBech32, fromHex, toBase64 } from "@cosmjs-evm/encoding";

import { pubkeyToAddress, pubkeyToRawAddress } from "./addresses";
import { decodeBech32Pubkey } from "./encoding";
import { MultisigThresholdPubkey } from "./pubkeys";

describe("addresses", () => {
  describe("pubkeyToRawAddress", () => {
    it("works for Secp256k1", () => {
      const pubkey = {
        type: "tendermint/PubKeySecp256k1",
        value: "AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP",
      };
      expect(pubkeyToRawAddress(pubkey)).toEqual(
        fromBech32("cosmos1h806c7khnvmjlywdrkdgk2vrayy2mmvf9rxk2r").data,
      );
    });

    it("works for Ed25519", () => {
      const pubkey = {
        type: "tendermint/PubKeyEd25519",
        value: toBase64(fromHex("12ee6f581fe55673a1e9e1382a0829e32075a0aa4763c968bc526e1852e78c95")),
      };
      expect(pubkeyToRawAddress(pubkey)).toEqual(
        fromBech32("cosmos1pfq05em6sfkls66ut4m2257p7qwlk448h8mysz").data,
      );
    });

    it("works for multisig", () => {
      const test1 = decodeBech32Pubkey(
        "wasmpub1addwnpepqwxttx8w2sfs6d8cuzqcuau84grp8xsw95qzdjkmvc44tnckskdxw3zw2km",
      );
      const test2 = decodeBech32Pubkey(
        "wasmpub1addwnpepq2gx7x7e29kge5a4ycunytyqr0u8ynql5h583s8r9wdads9m3v8ks6y0nhc",
      );
      const test3 = decodeBech32Pubkey(
        "wasmpub1addwnpepq0xfx5vavxmgdkn0p6x0l9p3udttghu3qcldd7ql08wa3xy93qq0xuzvtxc",
      );

      const testgroup1: MultisigThresholdPubkey = {
        type: "tendermint/PubKeyMultisigThreshold",
        value: {
          threshold: "2",
          pubkeys: [test1, test2, test3],
        },
      };
      expect(pubkeyToRawAddress(testgroup1)).toEqual(fromHex("0892a77fab2fa7e192c3b7b2741e6682f3abb72f"));
    });
  });

  describe("pubkeyToAddress", () => {
    it("works for Secp256k1", () => {
      const prefix = "cosmos";
      const pubkey = {
        type: "tendermint/PubKeySecp256k1",
        value: "AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP",
      };
      expect(pubkeyToAddress(pubkey, prefix)).toEqual("cosmos1h806c7khnvmjlywdrkdgk2vrayy2mmvf9rxk2r");
    });

    it("works for Ed25519", () => {
      const prefix = "cosmos";
      const pubkey = {
        type: "tendermint/PubKeyEd25519",
        value: toBase64(fromHex("12ee6f581fe55673a1e9e1382a0829e32075a0aa4763c968bc526e1852e78c95")),
      };
      expect(pubkeyToAddress(pubkey, prefix)).toEqual("cosmos1pfq05em6sfkls66ut4m2257p7qwlk448h8mysz");
    });

    it("works for multisig", () => {
      const test1 = decodeBech32Pubkey(
        "wasmpub1addwnpepqwxttx8w2sfs6d8cuzqcuau84grp8xsw95qzdjkmvc44tnckskdxw3zw2km",
      );
      const test2 = decodeBech32Pubkey(
        "wasmpub1addwnpepq2gx7x7e29kge5a4ycunytyqr0u8ynql5h583s8r9wdads9m3v8ks6y0nhc",
      );
      const test3 = decodeBech32Pubkey(
        "wasmpub1addwnpepq0xfx5vavxmgdkn0p6x0l9p3udttghu3qcldd7ql08wa3xy93qq0xuzvtxc",
      );

      const testgroup1: MultisigThresholdPubkey = {
        type: "tendermint/PubKeyMultisigThreshold",
        value: {
          threshold: "2",
          pubkeys: [test1, test2, test3],
        },
      };
      expect(pubkeyToAddress(testgroup1, "wasm")).toEqual("wasm1pzf2wlat97n7rykrk7e8g8nxste6hde0r8jqsy");
    });
  });
});
