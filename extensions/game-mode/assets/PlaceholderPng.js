const zlib = require('zlib');
const crypto = require('crypto');

class PlaceholderPng {
  static SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  static COLORS = [
    [96, 165, 250], [74, 222, 128], [245, 144, 52], [248, 113, 113],
    [192, 132, 252], [45, 212, 191], [250, 204, 21], [244, 114, 182],
  ];

  static _crcTable = null;

  static solid(width, height, [r, g, b]) {
    return Buffer.concat([
      PlaceholderPng.SIGNATURE,
      PlaceholderPng._chunk('IHDR', PlaceholderPng._header(width, height)),
      PlaceholderPng._chunk('IDAT', zlib.deflateSync(PlaceholderPng._pixels(width, height, [r, g, b]))),
      PlaceholderPng._chunk('IEND', Buffer.alloc(0)),
    ]);
  }

  static colorFor(relPath) {
    const hash = crypto.createHash('sha1').update(String(relPath)).digest();
    return PlaceholderPng.COLORS[hash[0] % PlaceholderPng.COLORS.length];
  }

  static crc32(buf) {
    const table = PlaceholderPng._table();
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  static _header(width, height) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    return ihdr;
  }

  static _pixels(width, height, [r, g, b]) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    return Buffer.concat(new Array(height).fill(row));
  }

  static _chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(PlaceholderPng.crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  static _table() {
    if (!PlaceholderPng._crcTable) {
      const table = new Int32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c;
      }
      PlaceholderPng._crcTable = table;
    }
    return PlaceholderPng._crcTable;
  }
}

module.exports = PlaceholderPng;
