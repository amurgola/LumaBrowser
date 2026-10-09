class TransientLlmError {
  static MARKERS = [
    'econnreset',
    'econnrefused',
    'etimedout',
    'epipe',
    'socket hang up',
    'network',
    'fetch failed',
    'terminated',
    'aborted',
  ];

  static GATEWAY_CODES = /\b50[234]\b/;

  static matches(err) {
    const message = TransientLlmError._message(err);
    return TransientLlmError.MARKERS.some((marker) => message.includes(marker))
      || TransientLlmError.GATEWAY_CODES.test(message);
  }

  static _message(err) {
    return String((err && err.message) || err || '').toLowerCase();
  }
}

module.exports = TransientLlmError;
