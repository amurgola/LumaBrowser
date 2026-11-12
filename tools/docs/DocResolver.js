class DocResolver {
  static resolve(docs, paths) {
    const result = new Map();
    for (const p of paths) result.set(p, DocResolver._hitsFor(docs, p));
    return result;
  }

  static _hitsFor(docs, p) {
    const hits = [];
    for (const d of docs) {
      if (d.meta) continue;
      const i = d.match.findIndex((match) => match(p));
      if (i >= 0) hits.push({ doc: d.file, pattern: d.patterns[i] });
    }
    return hits;
  }
}

module.exports = DocResolver;
