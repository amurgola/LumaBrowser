class ResultNovelty {
  static MIN_PASSAGE_CHARS = 24;
  static MAX_PASSAGES = 2000;

  constructor() {
    this._seen = new Set();
  }

  measure(result) {
    if (!result || typeof result !== 'object' || result.success === false) return null;
    const passages = this._passagesOf(result);
    if (!passages.size) return null;
    const fresh = this._absorb(passages);
    return fresh / passages.size;
  }

  _passagesOf(result) {
    const passages = new Set();
    for (const text of ResultNovelty._strings(result, [])) {
      for (const piece of text.split(/\n+|(?<=[.!?])\s+/)) {
        const passage = piece.replace(/\s+/g, ' ').trim().toLowerCase();
        if (passage.length >= ResultNovelty.MIN_PASSAGE_CHARS) passages.add(passage);
        if (passages.size >= ResultNovelty.MAX_PASSAGES) return passages;
      }
    }
    return passages;
  }

  _absorb(passages) {
    let fresh = 0;
    for (const passage of passages) {
      if (this._seen.has(passage)) continue;
      this._seen.add(passage);
      fresh += 1;
    }
    return fresh;
  }

  static _strings(value, out, depth = 0) {
    if (depth > 8 || value == null) return out;
    if (typeof value === 'string') out.push(value);
    else if (typeof value === 'object') for (const child of Object.values(value)) ResultNovelty._strings(child, out, depth + 1);
    return out;
  }
}

module.exports = ResultNovelty;
