class TokenEstimator {
  static CHARS_PER_TOKEN = 4;

  static estimateTokens(text) {
    const chars = TokenEstimator._toText(text).length;
    return Math.ceil(chars / TokenEstimator.CHARS_PER_TOKEN);
  }

  static tokensToChars(tokens) {
    const allowance = Number(tokens);
    if (!TokenEstimator._isPositiveNumber(allowance)) return 1;
    return Math.max(1, Math.floor(allowance * TokenEstimator.CHARS_PER_TOKEN));
  }

  static _toText(value) {
    if (typeof value === 'string') return value;
    return value == null ? '' : String(value);
  }

  static _isPositiveNumber(value) {
    return Number.isFinite(value) && value > 0;
  }
}

module.exports = TokenEstimator;
