class OptionMatcher {
  static EXACT_LABEL_SCORE = 100;
  static EXACT_VALUE_SCORE = 95;
  static PREFIX_SCORE = 80;
  static SUBSTRING_SCORE = 65;
  static CONTAINED_LABEL_SCORE = 55;
  static MIN_CONTAINED_LABEL_LENGTH = 3;
  static MIN_TOKEN_OVERLAP = 0.5;
  static TOKEN_OVERLAP_SCALE = 50;
  static DESCRIBE_LIMIT = 20;
  static DESCRIBE_LABEL_MAX = 60;

  static normalize(text) {
    return String(text == null ? '' : text)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[‘’“”"'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static pickOption(options, wanted) {
    let best = null;
    for (const option of options || []) {
      if (option.disabled) continue;
      const score = OptionMatcher._scoreOption(option, wanted);
      if (score > 0 && (!best || score > best.score)) best = { option, score };
    }
    return best;
  }

  static describeOptions(options, limit = OptionMatcher.DESCRIBE_LIMIT) {
    const labels = (options || []).map((option) => option.label).filter((label) => label && label.trim());
    if (!labels.length) return '(no options found)';
    const shown = labels.slice(0, limit).map((label) => `"${OptionMatcher._truncateLabel(label)}"`);
    const more = labels.length > limit ? ` (+${labels.length - limit} more)` : '';
    return shown.join(', ') + more;
  }

  static _scoreOption(option, wanted) {
    const want = OptionMatcher.normalize(wanted);
    if (!want) return 0;
    const label = OptionMatcher.normalize(option.label);
    const value = OptionMatcher.normalize(option.value);
    if (label === want) return OptionMatcher.EXACT_LABEL_SCORE;
    if (value && value === want) return OptionMatcher.EXACT_VALUE_SCORE;
    if (label.startsWith(want)) return OptionMatcher.PREFIX_SCORE - OptionMatcher._lengthPenalty(label, want);
    if (label.includes(want)) return OptionMatcher.SUBSTRING_SCORE - OptionMatcher._lengthPenalty(label, want);
    if (want.includes(label) && label.length >= OptionMatcher.MIN_CONTAINED_LABEL_LENGTH) {
      return OptionMatcher.CONTAINED_LABEL_SCORE;
    }
    return OptionMatcher._tokenOverlapScore(option.label, wanted);
  }

  static _lengthPenalty(label, want) {
    return Math.min(10, (label.length - want.length) / 4);
  }

  static _tokenOverlapScore(label, wanted) {
    const wantedTokens = OptionMatcher._tokens(wanted);
    const labelTokens = new Set(OptionMatcher._tokens(label));
    if (wantedTokens.length === 0 || labelTokens.size === 0) return 0;
    const ratio = wantedTokens.filter((token) => labelTokens.has(token)).length / wantedTokens.length;
    return ratio >= OptionMatcher.MIN_TOKEN_OVERLAP ? Math.round(ratio * OptionMatcher.TOKEN_OVERLAP_SCALE) : 0;
  }

  static _tokens(text) {
    return OptionMatcher.normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
  }

  static _truncateLabel(label) {
    const max = OptionMatcher.DESCRIBE_LABEL_MAX;
    return label.length > max ? label.slice(0, max - 1) + '...' : label;
  }
}

module.exports = OptionMatcher;
