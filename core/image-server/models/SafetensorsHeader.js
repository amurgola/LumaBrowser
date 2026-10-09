const fs = require('fs');

class SafetensorsHeader {
  static LENGTH_BYTES = 8;
  static MAX_HEADER_BYTES = 100 * 1024 * 1024;
  static ALIGNMENT = 8;
  static METADATA_KEY = '__metadata__';

  static read(fd) {
    const length = SafetensorsHeader._readLength(fd);
    const buf = Buffer.alloc(length);
    if (fs.readSync(fd, buf, 0, length, SafetensorsHeader.LENGTH_BYTES) !== length) {
      throw new Error('Truncated safetensors header.');
    }
    return { json: SafetensorsHeader._parse(buf), dataStart: SafetensorsHeader.LENGTH_BYTES + length };
  }

  static readFile(filePath) {
    const fd = fs.openSync(filePath, 'r');
    try {
      return SafetensorsHeader.read(fd);
    } finally {
      try {
        fs.closeSync(fd);
      } catch (_) {}
    }
  }

  static metadata(header) {
    const meta = header && header[SafetensorsHeader.METADATA_KEY];
    return meta && typeof meta === 'object' ? meta : {};
  }

  static encode(header) {
    let body = Buffer.from(JSON.stringify(header), 'utf8');
    const pad = (SafetensorsHeader.ALIGNMENT - (body.length % SafetensorsHeader.ALIGNMENT)) % SafetensorsHeader.ALIGNMENT;
    if (pad) body = Buffer.concat([body, Buffer.alloc(pad, 0x20)]);
    const length = Buffer.alloc(SafetensorsHeader.LENGTH_BYTES);
    length.writeBigUInt64LE(BigInt(body.length), 0);
    return Buffer.concat([length, body]);
  }

  static tensorNames(header) {
    return Object.keys(header || {}).filter((key) => key !== SafetensorsHeader.METADATA_KEY);
  }

  static _readLength(fd) {
    const lenBuf = Buffer.alloc(SafetensorsHeader.LENGTH_BYTES);
    if (fs.readSync(fd, lenBuf, 0, SafetensorsHeader.LENGTH_BYTES, 0) !== SafetensorsHeader.LENGTH_BYTES) {
      throw new Error('File too small for a safetensors header.');
    }
    const length = Number(lenBuf.readBigUInt64LE(0));
    if (!Number.isFinite(length) || length <= 0 || length > SafetensorsHeader.MAX_HEADER_BYTES) {
      throw new Error('Not a safetensors file (implausible header length).');
    }
    return length;
  }

  static _parse(buf) {
    try {
      return JSON.parse(buf.toString('utf8'));
    } catch (_) {
      throw new Error('Not a safetensors file (header is not JSON).');
    }
  }
}

module.exports = SafetensorsHeader;
