const crypto = require('crypto');

class CdpIds {
  static newUuid() {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }
}

module.exports = CdpIds;
