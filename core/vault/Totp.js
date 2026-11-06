const crypto = require('crypto');

class Totp {
  static ALGORITHMS = { SHA1: 'sha1', SHA256: 'sha256', SHA512: 'sha512' };

  static parse(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    let secret = raw;
    let digits = 6;
    let period = 30;
    let algorithm = 'sha1';
    if (/^otpauth:\/\//i.test(raw)) {
      let url;
      try { url = new URL(raw); } catch (_) { return null; }
      if (url.host.toLowerCase() !== 'totp') return null;
      secret = url.searchParams.get('secret') || '';
      digits = Number(url.searchParams.get('digits')) || 6;
      period = Number(url.searchParams.get('period')) || 30;
      algorithm = Totp.ALGORITHMS[String(url.searchParams.get('algorithm') || 'SHA1').toUpperCase()] || null;
      if (!algorithm) return null;
    }
    const key = Totp.base32(secret);
    if (!key || key.length < 10 || ![6, 7, 8].includes(digits) || period < 10 || period > 300) return null;
    return { secret: key, digits, period, algorithm };
  }

  static base32(text) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = String(text || '').toUpperCase().replace(/[\s=-]/g, '');
    if (!clean || /[^A-Z2-7]/.test(clean)) return null;
    let bits = 0;
    let value = 0;
    const out = [];
    for (const ch of clean) {
      value = (value << 5) | alphabet.indexOf(ch);
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(out);
  }

  static code(text, now = Date.now()) {
    const p = Totp.parse(text);
    if (!p) return null;
    const counter = Math.floor(now / 1000 / p.period);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const mac = crypto.createHmac(p.algorithm, p.secret).update(buf).digest();
    const offset = mac[mac.length - 1] & 0x0f;
    const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
    const code = String(bin % (10 ** p.digits)).padStart(p.digits, '0');
    const secondsLeft = p.period - (Math.floor(now / 1000) % p.period);
    return { code, secondsLeft };
  }
}

module.exports = Totp;
