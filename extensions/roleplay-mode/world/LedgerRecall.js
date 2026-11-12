class LedgerRecall {
  static MAX = 4;
  static IMPORTANCE = Object.freeze({ promise: 3, reveal: 3, death: 3, injury: 2, event: 1, move: 0.5 });
  static STANDING = 3;
  static RECENCY_TURNS = 20;
  static STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
    'been', 'am', 'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'what', 'who', 'how',
    'why', 'when', 'where', 'which', 'if', 'this', 'that', 'these', 'those', 'his', 'her', 'their', 'its', 'he', 'she',
    'they', 'it', 'him', 'them', 'about', 'with', 'from', 'by', 'as', 'into', 'out', 'up', 'down', 'over', 'not', 'no',
    'my', 'me', 'i', 'you', 'your', 'we', 'our', 'then', 'than', 'so', 'just', 'again', 'still', 'much', 'many', 'some',
    'any', 'all', 'say', 'said', 'says', 'tell', 'told', 'ask', 'asked', 'look', 'looks', 'take', 'took', 'make', 'made',
    'go', 'went', 'get', 'got', 'one', 'two', 'thing', 'things', 'while', 'after', 'before', 'there', 'here', 'player']);

  static words(text) {
    const out = new Set();
    for (const raw of String(text || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/)) {
      const w = raw.replace(/'s$/, '').replace(/'/g, '');
      if (w.length < 3 || LedgerRecall.STOP.has(w)) continue;
      out.add(w.length > 4 ? w.replace(/(?:ing|ed|es|s)$/, '') : w);
    }
    return out;
  }

  static pick(rows, { query = '', present = [], exclude = [], turn = 0, max = LedgerRecall.MAX } = {}) {
    const asked = LedgerRecall.words(query);
    const shown = new Set(exclude);
    const onStage = new Set((present || []).flatMap((n) => Array.from(LedgerRecall.words(n))));
    const scored = [];
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row || !row.text || shown.has(row)) continue;
      const names = LedgerRecall.words((row.who || []).join(' '));
      const body = LedgerRecall.words(row.text);
      let relevance = 0;
      for (const w of asked) {
        if (names.has(w)) relevance += 2;
        else if (body.has(w)) relevance += 1;
      }
      const importance = LedgerRecall.IMPORTANCE[row.kind] || 1;
      const aboutPresent = Array.from(names).some((w) => onStage.has(w));
      const touched = relevance >= (importance >= 2 ? 1 : 2);
      const standing = importance >= LedgerRecall.STANDING && aboutPresent;
      if (!touched && !standing) continue;
      const age = Math.max(0, (Number(turn) || 0) - (Number(row.turn) || 0));
      const recency = 1 / (1 + age / LedgerRecall.RECENCY_TURNS);
      scored.push({ row, score: Math.min(relevance, 6) * 2 + importance + recency * 0.5 });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.max(0, max)).map((s) => s.row).sort((a, b) => (Number(a.turn) || 0) - (Number(b.turn) || 0));
  }

  static keep(rows, max) {
    const list = Array.isArray(rows) ? rows : [];
    if (list.length <= max) return list.slice();
    const order = list.map((row, i) => ({ i, weight: LedgerRecall.IMPORTANCE[row && row.kind] || 1 }))
      .sort((a, b) => (a.weight - b.weight) || (a.i - b.i));
    const drop = new Set(order.slice(0, list.length - max).map((o) => o.i));
    return list.filter((_, i) => !drop.has(i));
  }
}

module.exports = LedgerRecall;
