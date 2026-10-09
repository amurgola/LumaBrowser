class GgufValueReader {
  static TYPES = {
    UINT8: 0, INT8: 1, UINT16: 2, INT16: 3, UINT32: 4, INT32: 5,
    FLOAT32: 6, BOOL: 7, STRING: 8, ARRAY: 9, UINT64: 10, INT64: 11, FLOAT64: 12,
  };

  static FIXED_SIZE = { 0: 1, 1: 1, 2: 2, 3: 2, 4: 4, 5: 4, 6: 4, 7: 1, 10: 8, 11: 8, 12: 8 };

  static MAX_STRING_BYTES = 8 * 1024 * 1024;
  static MAX_ARRAY_COUNT = 200 * 1000 * 1000;
  static MAX_RETAINED_ARRAY = 1024;

  constructor(cursor, lengthsAre64Bit) {
    this._cursor = cursor;
    this._lengthsAre64Bit = lengthsAre64Bit;
  }

  static isFixedWidth(type) {
    return Object.prototype.hasOwnProperty.call(GgufValueReader.FIXED_SIZE, type);
  }

  async uint32() {
    return (await this._cursor.take(4)).readUInt32LE(0);
  }

  async uint64() {
    return Number((await this._cursor.take(8)).readBigUInt64LE(0));
  }

  async length() {
    return this._lengthsAre64Bit ? this.uint64() : this.uint32();
  }

  async string() {
    const byteCount = await this.length();
    if (byteCount < 0 || byteCount > GgufValueReader.MAX_STRING_BYTES) {
      throw new Error(`Implausible GGUF string length ${byteCount}`);
    }
    if (byteCount === 0) return '';
    return Buffer.from(await this._cursor.take(byteCount)).toString('utf8');
  }

  async scalar(type) {
    const bytes = await this._cursor.take(GgufValueReader.FIXED_SIZE[type]);
    return GgufValueReader._decodeScalar(bytes, type);
  }

  async array() {
    const elementType = await this.uint32();
    const count = await this.length();
    if (count < 0 || count > GgufValueReader.MAX_ARRAY_COUNT) {
      throw new Error(`Implausible GGUF array count ${count}`);
    }
    if (GgufValueReader.isFixedWidth(elementType)) return this._fixedWidthArray(elementType, count);
    if (elementType === GgufValueReader.TYPES.STRING) return this._skipStringArray(count);
    throw new Error(`Unsupported GGUF array element type ${elementType}`);
  }

  async _fixedWidthArray(elementType, count) {
    if (count > GgufValueReader.MAX_RETAINED_ARRAY) {
      this._cursor.skip(GgufValueReader.FIXED_SIZE[elementType] * count);
      return undefined;
    }
    const values = new Array(count);
    for (let i = 0; i < count; i++) values[i] = await this.scalar(elementType);
    return values;
  }

  async _skipStringArray(count) {
    const lengthBytes = this._lengthsAre64Bit ? 8 : 4;
    await this._cursor.skipStringArray(count, lengthBytes, GgufValueReader.MAX_STRING_BYTES);
    return undefined;
  }

  static _decodeScalar(bytes, type) {
    const T = GgufValueReader.TYPES;
    switch (type) {
      case T.UINT8: return bytes.readUInt8(0);
      case T.INT8: return bytes.readInt8(0);
      case T.UINT16: return bytes.readUInt16LE(0);
      case T.INT16: return bytes.readInt16LE(0);
      case T.UINT32: return bytes.readUInt32LE(0);
      case T.INT32: return bytes.readInt32LE(0);
      case T.FLOAT32: return bytes.readFloatLE(0);
      case T.BOOL: return bytes.readUInt8(0) !== 0;
      case T.UINT64: return Number(bytes.readBigUInt64LE(0));
      case T.INT64: return Number(bytes.readBigInt64LE(0));
      case T.FLOAT64: return bytes.readDoubleLE(0);
      default: throw new Error(`Unknown scalar GGUF type ${type}`);
    }
  }
}

module.exports = GgufValueReader;
