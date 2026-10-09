const TokenEstimator = require('../../../shared/text/TokenEstimator');

class TokenSizeLabel {
  static EXACT_BELOW = 100;
  static SIGNIFICANT_FIGURES = 2;

  static format(tokens) {
    const count = Math.max(0, Math.round(Number(tokens) || 0));
    if (count < TokenSizeLabel.EXACT_BELOW) return String(count);
    return TokenSizeLabel._rounded(count).toLocaleString('en-US');
  }

  static ofText(text) {
    return TokenSizeLabel.format(TokenEstimator.estimateTokens(text));
  }

  static _rounded(count) {
    const digits = Math.floor(Math.log10(count)) + 1;
    const unit = 10 ** (digits - TokenSizeLabel.SIGNIFICANT_FIGURES);
    return Math.round(count / unit) * unit;
  }
}

module.exports = TokenSizeLabel;
