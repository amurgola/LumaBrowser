class PaletteMatcher {
  static FILLER = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
    'me', 'my', 'of', 'on', 'or', 'the', 'this', 'to', 'what', 'where', 'which', 'with', 'you', 'your', 'want', 'make',
    'set', 'change', 'turn', 'find', 'open', 'go', 'show', 'get', 'let', 'please', 'should', 'would', 'could',
  ]);
  static EXACT = 1;
  static STEM = 0.95;
  static PREFIX = 0.85;
  static TYPO = 0.6;
  static SUBSTRING = 0.45;
  static MIN_SCORE = 0.3;

  static words(text) {
    return PaletteMatcher.fold(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  }

  static fold(text) {
    return String(text || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  }

  static queryWords(query) {
    const all = [...new Set(PaletteMatcher.words(query))];
    const kept = all.filter((w) => !PaletteMatcher.FILLER.has(w));
    return kept.length ? kept : all;
  }

  static score(query, fields) {
    const qWords = PaletteMatcher.queryWords(query);
    if (!qWords.length) return null;
    const prepared = fields.filter((f) => f && f.text).map((f) => ({ weight: f.weight == null ? 1 : f.weight, words: PaletteMatcher.words(f.text), folded: PaletteMatcher.fold(f.text) }));
    if (!prepared.length) return null;
    let total = 0;
    let matched = 0;
    for (const q of qWords) {
      const best = PaletteMatcher._bestFor(q, prepared);
      total += best;
      if (best > 0) matched += 1;
    }
    if (!matched) return null;
    const coverage = matched / qWords.length;
    let score = (total / qWords.length) * (0.5 + 0.5 * coverage);
    score += PaletteMatcher._phraseBonus(PaletteMatcher.fold(query).trim(), prepared[0].folded);
    if (score < PaletteMatcher.MIN_SCORE) return null;
    return { score, marks: PaletteMatcher.marks(qWords, fields[0] && fields[0].text) };
  }

  static _bestFor(q, prepared) {
    let best = 0;
    for (const field of prepared) {
      const m = PaletteMatcher._wordMatch(q, field.words, field.folded) * field.weight;
      if (m > best) best = m;
    }
    return best;
  }

  static _wordMatch(q, words, folded) {
    let best = 0;
    const qs = PaletteMatcher.stem(q);
    for (const w of words) {
      if (w === q) return PaletteMatcher.EXACT;
      if (PaletteMatcher.stem(w) === qs) best = Math.max(best, PaletteMatcher.STEM);
      else if (q.length >= 2 && w.startsWith(q)) best = Math.max(best, PaletteMatcher.PREFIX * (0.6 + 0.4 * (q.length / w.length)));
      else if (q.length >= 5 && PaletteMatcher.withinOneEdit(q, w)) best = Math.max(best, PaletteMatcher.TYPO);
    }
    if (!best && q.length >= 3 && folded.includes(q)) best = PaletteMatcher.SUBSTRING;
    return best;
  }

  static _phraseBonus(query, label) {
    if (!query || !label) return 0;
    if (label === query) return 0.6;
    if (label.startsWith(query)) return 0.4;
    if (query.length >= 3 && label.includes(query)) return 0.25;
    return 0;
  }

  static stem(word) {
    for (const suffix of ['ing', 'es', 'ed', 's']) {
      if (word.length - suffix.length >= 4 && word.endsWith(suffix)) return word.slice(0, -suffix.length);
    }
    return word;
  }

  static withinOneEdit(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length && PaletteMatcher._oneSwap(a, b)) return true;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i += 1; j += 1; continue; }
      edits += 1;
      if (edits > 1) return false;
      if (a.length > b.length) i += 1;
      else if (a.length < b.length) j += 1;
      else { i += 1; j += 1; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  static _oneSwap(a, b) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i += 1;
    return i < a.length - 1 && a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }

  static marks(qWords, label) {
    const text = String(label || '');
    const folded = PaletteMatcher.fold(text);
    if (folded.length !== text.length) return [];
    const ranges = [];
    const re = /[\p{L}\p{N}]+/gu;
    let m;
    while ((m = re.exec(folded))) {
      const word = m[0];
      for (const q of qWords) {
        const len = word.startsWith(q) ? q.length : (PaletteMatcher.stem(word) === PaletteMatcher.stem(q) ? word.length : 0);
        if (len) { ranges.push([m.index, m.index + Math.min(len, word.length)]); break; }
      }
    }
    return ranges;
  }
}

module.exports = PaletteMatcher;
