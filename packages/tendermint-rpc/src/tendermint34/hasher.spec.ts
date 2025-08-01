import { fromBase64, fromHex } from "@cosmjs-evm/encoding";
import { ReadonlyDate } from "readonly-date";

import { ReadonlyDateWithNanoseconds } from "../dates";
import { hashBlock, hashTx } from "./hasher";

describe("Hasher", () => {
  it("creates transaction hash equal to local test", () => {
    // This was taken from a result from /tx_search of some random test transaction
    // curl "http://localhost:11127/tx_search?query=\"tx.hash='5CB2CF94A1097A4BC19258BC2353C3E76102B6D528458BE45C855DC5563C1DB2'\""
    const txId = fromHex("5CB2CF94A1097A4BC19258BC2353C3E76102B6D528458BE45C855DC5563C1DB2");
    const txData = fromBase64("YUpxZDY2NURaUDMxPWd2TzBPdnNrVWFWYg==");
    expect(hashTx(txData)).toEqual(txId);
  });

  it("creates block hash equal to local test for empty block", () => {
    // This was taken from a result from /block of some random empty block
    // curl "http://localhost:11133/block"
    const blockId = fromHex("153C484DCBC33633F0616BC019388C93DEA94F7880627976F2BFE83749E062F7");
    const time = new ReadonlyDate("2020-06-23T13:54:15.4638668Z");
    (time as any).nanoseconds = 866800;
    const blockData = {
      version: {
        block: 10,
        app: 1,
      },
      chainId: "test-chain-2A5rwi",
      height: 7795,
      time: time as ReadonlyDateWithNanoseconds,

      lastBlockId: {
        hash: fromHex("1EC48444E64E7B96585BA518613612E52B976E3DA2F2222B9CD4D1602656C96F"),
        parts: {
          total: 1,
          hash: fromHex("D4E6F1B0EE08D0438C9BB8455D7D3F2FC1883C32D66F7C69C4A0F093B073F6D2"),
        },
      },

      lastCommitHash: fromHex("BA6A5EEA6687ACA8EE4FFE4F5D40EA073CB7397A5336309C3EC824805AF9723E"),
      dataHash: fromHex(""),

      validatorsHash: fromHex("0BEEBC6AB3B7D4FE21E22B609CD4AEC7E121A42C07604FF1827651F0173745EB"),
      nextValidatorsHash: fromHex("0BEEBC6AB3B7D4FE21E22B609CD4AEC7E121A42C07604FF1827651F0173745EB"),
      consensusHash: fromHex("048091BC7DDC283F77BFBF91D73C44DA58C3DF8A9CBC867405D8B7F3DAADA22F"),
      appHash: fromHex("8801000000000000"),
      lastResultsHash: fromHex(""),

      evidenceHash: fromHex(""),
      proposerAddress: fromHex("614F305502F65C01114F9B8711D9A0AB0AC369F4"),
    };
    expect(hashBlock(blockData)).toEqual(blockId);
  });

  it("creates block hash equal to local test for block with a transaction", () => {
    // This was taken from a result from /block of some random block with a transaction
    // curl "http://localhost:11133/block?height=13575"
    const blockId = fromHex("FF2995AF1F38B9A584077E53B5E144778718FB86539A51886A2C55F730403373");
    const time = new ReadonlyDate("2020-06-23T15:34:12.3232688Z");
    (time as any).nanoseconds = 268800;
    const blockData = {
      version: {
        block: 10,
        app: 1,
      },
      chainId: "test-chain-2A5rwi",
      height: 13575,
      time: time as ReadonlyDateWithNanoseconds,

      lastBlockId: {
        hash: fromHex("046D5441FC4D008FCDBF9F3DD5DC25CF00883763E44CF4FAF3923FB5FEA42D8F"),
        parts: {
          total: 1,
          hash: fromHex("02E4715343625093C717638EAC67FB3A4B24CCC8DA610E0CB324D705E68FEF7B"),
        },
      },

      lastCommitHash: fromHex("AA2B807F3B0ACC866AB58D90C2D0FC70B6C860CFAC440590B4F590CDC178A207"),
      dataHash: fromHex("56782879F526889734BA65375CD92A9152C7114B2C91B2D2AD8464FF69E884AA"),

      validatorsHash: fromHex("0BEEBC6AB3B7D4FE21E22B609CD4AEC7E121A42C07604FF1827651F0173745EB"),
      nextValidatorsHash: fromHex("0BEEBC6AB3B7D4FE21E22B609CD4AEC7E121A42C07604FF1827651F0173745EB"),
      consensusHash: fromHex("048091BC7DDC283F77BFBF91D73C44DA58C3DF8A9CBC867405D8B7F3DAADA22F"),
      appHash: fromHex("CC02000000000000"),
      lastResultsHash: fromHex("6E340B9CFFB37A989CA544E6BB780A2C78901D3FB33738768511A30617AFA01D"),

      evidenceHash: fromHex(""),
      proposerAddress: fromHex("614F305502F65C01114F9B8711D9A0AB0AC369F4"),
    };
    expect(hashBlock(blockData)).toEqual(blockId);
  });
});
