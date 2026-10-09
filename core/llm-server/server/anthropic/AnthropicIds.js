const crypto = require('crypto');

class AnthropicIds {
  static RANDOM_BYTES = 12;

  static messageId(upstreamId = null) {
    if (upstreamId) return `msg_${String(upstreamId).replace(/^chatcmpl-/, '')}`;
    return `msg_${AnthropicIds._random()}`;
  }

  static toolUseId() {
    return `toolu_${AnthropicIds._random()}`;
  }

  static _random() {
    return crypto.randomBytes(AnthropicIds.RANDOM_BYTES).toString('hex');
  }
}

module.exports = AnthropicIds;
