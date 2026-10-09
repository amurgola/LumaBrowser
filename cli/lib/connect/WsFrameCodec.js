const crypto = require('crypto');

class WsFrameCodec {
  static CONTINUATION = 0x0;
  static TEXT = 0x1;
  static CLOSE = 0x8;
  static PING = 0x9;
  static PONG = 0xA;

  static encode(opcode, payload) {
    const header = WsFrameCodec._header(opcode, payload.length);
    const mask = crypto.randomBytes(4);
    return Buffer.concat([header, mask, WsFrameCodec._xor(payload, mask)]);
  }

  static decode(buf) {
    if (buf.length < 2) return null;
    const size = WsFrameCodec._payloadSize(buf);
    if (!size) return null;
    const masked = !!(buf[1] & 0x80);
    let offset = size.offset;
    let mask = null;
    if (masked) {
      if (buf.length < offset + 4) return null;
      mask = buf.subarray(offset, offset + 4);
      offset += 4;
    }
    if (buf.length < offset + size.len) return null;
    const raw = buf.subarray(offset, offset + size.len);
    return {
      fin: !!(buf[0] & 0x80),
      opcode: buf[0] & 0x0f,
      payload: mask ? WsFrameCodec._xor(raw, mask) : raw,
      length: offset + size.len,
    };
  }

  static _header(opcode, len) {
    let header;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[1] = 0x80 | len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    header[0] = 0x80 | opcode;
    return header;
  }

  static _payloadSize(buf) {
    const len = buf[1] & 0x7f;
    if (len === 126) return buf.length < 4 ? null : { len: buf.readUInt16BE(2), offset: 4 };
    if (len === 127) return buf.length < 10 ? null : { len: Number(buf.readBigUInt64BE(2)), offset: 10 };
    return { len, offset: 2 };
  }

  static _xor(payload, mask) {
    const out = Buffer.allocUnsafe(payload.length);
    for (let i = 0; i < payload.length; i++) out[i] = payload[i] ^ mask[i & 3];
    return out;
  }
}

module.exports = WsFrameCodec;
