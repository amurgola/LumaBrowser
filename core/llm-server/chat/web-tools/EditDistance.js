class EditDistance {
  static MAX_CHARS = 300;

  static levenshtein(a, b) {
    const s = String(a).slice(0, EditDistance.MAX_CHARS);
    const t = String(b).slice(0, EditDistance.MAX_CHARS);
    if (s === t) return 0;
    if (!s.length || !t.length) return Math.max(s.length, t.length);
    let prev = Array.from({ length: t.length + 1 }, (_, i) => i);
    for (let i = 1; i <= s.length; i++) prev = EditDistance._nextRow(prev, s[i - 1], t, i);
    return prev[t.length];
  }

  static similarity(a, b) {
    const s = String(a);
    const t = String(b);
    return 1 - EditDistance.levenshtein(s, t) / Math.max(s.length, t.length, 1);
  }

  static _nextRow(prev, char, t, i) {
    const row = [i];
    for (let j = 1; j <= t.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (char === t[j - 1] ? 0 : 1));
    }
    return row;
  }
}

module.exports = EditDistance;
