const TokenEstimator = require('../../../../shared/text/TokenEstimator');

class TextDrip {
  static INTERVAL_MS = 18;
  static DEFAULT_CHARS_PER_SECOND = 1333;
  static MIN_CHARS_PER_SECOND = 600;
  static CHARS_PER_TOKEN = TokenEstimator.CHARS_PER_TOKEN;

  static async play(text, onDelta, shouldAbort, pace = {}) {
    if (!text) return;
    const chunk = TextDrip.chunkFor(pace && pace.charsPerSecond);
    for (let i = 0; i < text.length; i += chunk) {
      if (shouldAbort && shouldAbort()) return;
      onDelta(text.slice(i, i + chunk));
      if (i + chunk < text.length) await TextDrip._pause();
    }
  }

  static chunkFor(charsPerSecond) {
    const known = Number.isFinite(charsPerSecond) && charsPerSecond > 0;
    const cps = known ? Math.max(TextDrip.MIN_CHARS_PER_SECOND, charsPerSecond) : TextDrip.DEFAULT_CHARS_PER_SECOND;
    return Math.max(1, Math.round((cps * TextDrip.INTERVAL_MS) / 1000));
  }

  static _pause() {
    return new Promise((resolve) => setTimeout(resolve, TextDrip.INTERVAL_MS));
  }
}

module.exports = TextDrip;
