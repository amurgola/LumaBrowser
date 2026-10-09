class QueryResemblance {
  static FILLER = new Set([
    'a', 'an', 'the', 'of', 'in', 'on', 'for', 'to', 'and', 'or', 'is', 'are', 'what', 'how', 'with', 'about',
    'at', 'by', 'from', 'me', 'find', 'search', 'show', 'please',
  ]);

  static between(a, b) {
    const left = QueryResemblance.words(a);
    const right = QueryResemblance.words(b);
    if (!left.size || !right.size) return QueryResemblance._fallback(a, b);
    let shared = 0;
    for (const word of left) if (right.has(word)) shared += 1;
    return shared / (left.size + right.size - shared);
  }

  static words(text) {
    const out = new Set();
    for (const raw of String(text || '').toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (raw && !QueryResemblance.FILLER.has(raw)) out.add(QueryResemblance._stem(raw));
    }
    return out;
  }

  static _stem(word) {
    return word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
  }

  static _fallback(a, b) {
    const fold = (t) => String(t || '').trim().toLowerCase();
    return fold(a) === fold(b) ? 1 : 0;
  }
}

module.exports = QueryResemblance;
