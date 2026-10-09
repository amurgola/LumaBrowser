const crypto = require('crypto');

class ResponsesIds {
  static RANDOM_BYTES = 12;

  static responseId(upstreamId = null) {
    if (upstreamId) return `resp_${String(upstreamId).replace(/^chatcmpl-/, '')}`;
    return `resp_${ResponsesIds._random()}`;
  }

  static itemId(prefix) {
    return `${prefix}_${ResponsesIds._random()}`;
  }

  static callId() {
    return `call_${ResponsesIds._random()}`;
  }

  static _random() {
    return crypto.randomBytes(ResponsesIds.RANDOM_BYTES).toString('hex');
  }
}

module.exports = ResponsesIds;
