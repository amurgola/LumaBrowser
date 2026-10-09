class UnfulfilledIntent {
  static MAX_CHARS = 160;
  static PATTERN = /\b(let me|i'?ll|i will|i'?m going to|one (?:moment|second|sec)|hold on|just a (?:moment|second|sec)|give me a (?:moment|second|sec)|now i(?:'ll| will)|(?:i'?m )?(?:checking|searching|looking) (?:that|this|it|into|for|up))\b/i;

  static matches(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed || trimmed.length > UnfulfilledIntent.MAX_CHARS) return false;
    if (/\?\s*$/.test(trimmed)) return false;
    return UnfulfilledIntent.PATTERN.test(trimmed);
  }
}

module.exports = UnfulfilledIntent;
