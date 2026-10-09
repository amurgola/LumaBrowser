const TokenEstimator = require('../../../shared/text/TokenEstimator');

class MessagesTokenCount {
  static estimate(body) {
    const parts = [body.system, ...MessagesTokenCount._list(body.messages).map((m) => m && m.content), ...MessagesTokenCount._list(body.tools)];
    const chars = parts.reduce((sum, part) => sum + MessagesTokenCount._length(part), 0);
    return Math.ceil(chars / TokenEstimator.CHARS_PER_TOKEN);
  }

  static _list(value) {
    return Array.isArray(value) ? value : [];
  }

  static _length(value) {
    if (value == null) return 0;
    return typeof value === 'string' ? value.length : JSON.stringify(value).length;
  }
}

module.exports = MessagesTokenCount;
