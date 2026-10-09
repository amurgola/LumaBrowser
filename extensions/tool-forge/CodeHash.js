const crypto = require('crypto');

class CodeHash {
  static of(code) {
    return crypto.createHash('sha256').update(String(code || ''), 'utf8').digest('hex');
  }
}

module.exports = CodeHash;
