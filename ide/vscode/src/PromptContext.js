'use strict';

class PromptContext {
  static toWire(items, readContextText) {
    return items.map((it) => {
      const o = { path: it.path, kind: it.kind };
      PromptContext._copyRange(it, o);
      const text = PromptContext._text(it, readContextText);
      if (text != null) o.text = text;
      return o;
    });
  }

  static toChips(items) {
    return items.map((c) => {
      const i = { id: c.id, kind: c.kind, path: c.path };
      PromptContext._copyRange(c, i);
      return i;
    });
  }

  static withItem(items, item) {
    const kept = items.filter((c) => !(c.path === item.path && c.startLine === item.startLine && c.endLine === item.endLine));
    kept.push(item);
    return kept;
  }

  static _copyRange(from, to) {
    if (from.startLine != null) to.startLine = from.startLine;
    if (from.endLine != null) to.endLine = from.endLine;
  }

  static _text(item, readContextText) {
    if (item.text != null) return item.text;
    if (!readContextText) return null;
    try { return readContextText(item); } catch (_) { return null; }
  }
}

module.exports = PromptContext;
