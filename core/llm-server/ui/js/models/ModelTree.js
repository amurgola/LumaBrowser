export default class ModelTree {
  static OTHER = 'Other';

  static _cmp(a, b) {
    return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  static groupingOf(m) {
    const g = (m && m.grouping) || {};
    return {
      family: g.family || ModelTree.OTHER,
      line: g.line || '',
      sizeB: typeof g.sizeB === 'number' ? g.sizeB : null,
      variant: g.variant || '',
      quant: g.quant || null,
      quantBits: typeof g.quantBits === 'number' ? g.quantBits : 0,
      label: g.label || (m && (m.displayName || m.name)) || '',
    };
  }

  static build(items, { bytesOf = (m) => (m && m.totalBytes) || 0 } = {}) {
    const families = new Map();
    for (const item of items || []) {
      const g = ModelTree.groupingOf(item);
      if (!families.has(g.family)) families.set(g.family, new Map());
      const lines = families.get(g.family);
      if (!lines.has(g.line)) lines.set(g.line, { line: g.line, sizeB: g.sizeB, items: [] });
      lines.get(g.line).items.push(item);
    }
    const familyNames = [...families.keys()].sort((a, b) => {
      if (a === ModelTree.OTHER) return 1;
      if (b === ModelTree.OTHER) return -1;
      return ModelTree._cmp(a, b);
    });
    return familyNames.map((family) => ({
      family,
      lines: [...families.get(family).values()].sort(ModelTree._lineOrder).map(({ line, items: lineItems }) => ({
        line,
        items: lineItems.slice().sort((a, b) => ModelTree._itemOrder(a, b, bytesOf)),
      })),
    }));
  }

  static flatten(tree) {
    const out = [];
    for (const f of tree) {
      const familyCount = f.lines.reduce((n, l) => n + l.items.length, 0);
      f.lines.forEach((l, li) => l.items.forEach((item, ii) => out.push({
        item, family: f.family, line: l.line, firstOfFamily: li === 0 && ii === 0, firstOfLine: ii === 0,
        familyCount, lineCount: l.items.length,
      })));
    }
    return out;
  }

  static rowName(m) {
    const g = ModelTree.groupingOf(m);
    return g.variant || g.quant || g.line || g.label;
  }

  static showsQuant(m) {
    const g = ModelTree.groupingOf(m);
    return !!g.quant && ModelTree.rowName(m) !== g.quant;
  }

  static label(m) {
    return ModelTree.groupingOf(m).label;
  }

  static heading(family, line) {
    return line ? `${family} · ${line}` : family;
  }

  static _lineOrder(a, b) {
    if (a.sizeB != null && b.sizeB != null && a.sizeB !== b.sizeB) return b.sizeB - a.sizeB;
    if (a.sizeB != null && b.sizeB == null) return -1;
    if (a.sizeB == null && b.sizeB != null) return 1;
    return ModelTree._cmp(a.line, b.line);
  }

  static _itemOrder(a, b, bytesOf) {
    const ga = ModelTree.groupingOf(a);
    const gb = ModelTree.groupingOf(b);
    if (ga.quantBits !== gb.quantBits) return gb.quantBits - ga.quantBits;
    const bytes = (bytesOf(b) || 0) - (bytesOf(a) || 0);
    if (bytes) return bytes;
    return ModelTree._cmp(ga.variant, gb.variant) || ModelTree._cmp(ga.label, gb.label);
  }
}
