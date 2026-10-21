const crypto = require('crypto');
const ProtobufFields = require('./ProtobufFields');

class CrxArchive {
  static MAGIC = 'Cr24';
  static ID_LENGTH_BYTES = 16;
  static ID_ALPHABET_START = 'a'.charCodeAt(0);
  static HEADER_RSA_PROOFS = 2;
  static HEADER_ECDSA_PROOFS = 3;
  static HEADER_SIGNED_DATA = 10000;
  static PROOF_PUBLIC_KEY = 1;
  static SIGNED_DATA_CRX_ID = 1;

  static parse(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.toString('latin1', 0, 4) !== CrxArchive.MAGIC) {
      throw new Error('Not a Chrome extension package (missing Cr24 header)');
    }
    const version = buffer.readUInt32LE(4);
    if (version === 3) return CrxArchive._parseV3(buffer);
    if (version === 2) return CrxArchive._parseV2(buffer);
    throw new Error(`Unsupported CRX version ${version}`);
  }

  static idFromPublicKey(publicKey) {
    const hex = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, CrxArchive.ID_LENGTH_BYTES * 2);
    return CrxArchive.idFromHex(hex);
  }

  static idFromHex(hex) {
    return [...hex].map((c) => String.fromCharCode(CrxArchive.ID_ALPHABET_START + parseInt(c, 16))).join('');
  }

  static _parseV2(buffer) {
    const keyLength = buffer.readUInt32LE(8);
    const signatureLength = buffer.readUInt32LE(12);
    const keyStart = 16;
    const zipStart = keyStart + keyLength + signatureLength;
    CrxArchive._assertWithin(buffer, zipStart);
    const publicKey = buffer.subarray(keyStart, keyStart + keyLength);
    return { version: 2, publicKey, id: CrxArchive.idFromPublicKey(publicKey), zip: buffer.subarray(zipStart) };
  }

  static _parseV3(buffer) {
    const headerLength = buffer.readUInt32LE(8);
    const headerStart = 12;
    const zipStart = headerStart + headerLength;
    CrxArchive._assertWithin(buffer, zipStart);
    const header = buffer.subarray(headerStart, zipStart);
    const publicKey = CrxArchive._publisherKey(header);
    return { version: 3, publicKey, id: CrxArchive.idFromPublicKey(publicKey), zip: buffer.subarray(zipStart) };
  }

  static _publisherKey(header) {
    const crxId = CrxArchive._crxIdHex(header);
    const keys = [CrxArchive.HEADER_RSA_PROOFS, CrxArchive.HEADER_ECDSA_PROOFS]
      .flatMap((number) => ProtobufFields.bytesOf(header, number))
      .flatMap((proof) => ProtobufFields.bytesOf(proof, CrxArchive.PROOF_PUBLIC_KEY));
    const match = crxId
      ? keys.find((key) => crypto.createHash('sha256').update(key).digest('hex').startsWith(crxId))
      : keys[0];
    if (!match) throw new Error('CRX header has no public key matching its extension id');
    return match;
  }

  static _crxIdHex(header) {
    const [signedData] = ProtobufFields.bytesOf(header, CrxArchive.HEADER_SIGNED_DATA);
    if (!signedData) return null;
    const [crxId] = ProtobufFields.bytesOf(signedData, CrxArchive.SIGNED_DATA_CRX_ID);
    return crxId ? crxId.toString('hex') : null;
  }

  static _assertWithin(buffer, offset) {
    if (offset > buffer.length) throw new Error('Truncated CRX package');
  }
}

module.exports = CrxArchive;
