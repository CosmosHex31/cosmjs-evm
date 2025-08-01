import {
  Argon2id,
  isArgon2idOptions,
  Random,
  xchacha20NonceLength,
  Xchacha20poly1305Ietf,
} from "@cosmjs-evm/crypto";
import { toAscii } from "@cosmjs-evm/encoding";

/**
 * A fixed salt is chosen to archive a deterministic password to key derivation.
 * This reduces the scope of a potential rainbow attack to all CosmJS users.
 * Must be 16 bytes due to implementation limitations.
 */
export const cosmjsSalt = toAscii("The CosmJS salt.");

export interface KdfConfiguration {
  /**
   * An algorithm identifier, such as "argon2id" or "scrypt".
   */
  readonly algorithm: string;
  /** A map of algorithm-specific parameters */
  readonly params: Record<string, unknown>;
}

export async function executeKdf(password: string, configuration: KdfConfiguration): Promise<Uint8Array> {
  switch (configuration.algorithm) {
    case "argon2id": {
      const options = configuration.params;
      if (!isArgon2idOptions(options)) throw new Error("Invalid format of argon2id params");
      return Argon2id.execute(password, cosmjsSalt, options);
    }
    default:
      throw new Error("Unsupported KDF algorithm");
  }
}

/**
 * Configuration how to encrypt data or how data was encrypted.
 * This is stored as part of the wallet serialization and must only contain JSON types.
 */
export interface EncryptionConfiguration {
  /**
   * An algorithm identifier, such as "xchacha20poly1305-ietf".
   */
  readonly algorithm: string;
  /** A map of algorithm-specific parameters */
  readonly params?: Record<string, unknown>;
}

export const supportedAlgorithms = {
  xchacha20poly1305Ietf: "xchacha20poly1305-ietf",
};

export async function encrypt(
  plaintext: Uint8Array,
  encryptionKey: Uint8Array,
  config: EncryptionConfiguration,
): Promise<Uint8Array> {
  switch (config.algorithm) {
    case supportedAlgorithms.xchacha20poly1305Ietf: {
      const nonce = Random.getBytes(xchacha20NonceLength);
      // Prepend fixed-length nonce to ciphertext as suggested in the example from https://github.com/jedisct1/libsodium.js#api
      return new Uint8Array([
        ...nonce,
        ...(await Xchacha20poly1305Ietf.encrypt(plaintext, encryptionKey, nonce)),
      ]);
    }
    default:
      throw new Error(`Unsupported encryption algorithm: '${config.algorithm}'`);
  }
}

export async function decrypt(
  ciphertext: Uint8Array,
  encryptionKey: Uint8Array,
  config: EncryptionConfiguration,
): Promise<Uint8Array> {
  switch (config.algorithm) {
    case supportedAlgorithms.xchacha20poly1305Ietf: {
      const nonce = ciphertext.slice(0, xchacha20NonceLength);
      return Xchacha20poly1305Ietf.decrypt(ciphertext.slice(xchacha20NonceLength), encryptionKey, nonce);
    }
    default:
      throw new Error(`Unsupported encryption algorithm: '${config.algorithm}'`);
  }
}
