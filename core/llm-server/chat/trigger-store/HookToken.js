const crypto = require('crypto');

class HookToken {
  static BYTES = 24;
  static PATTERN = /^[A-Za-z0-9_-]{32}$/;

  static create() {
    return crypto.randomBytes(HookToken.BYTES).toString('base64url');
  }

  static isWellFormed(token) {
    return HookToken.PATTERN.test(String(token || ''));
  }
}

module.exports = HookToken;
