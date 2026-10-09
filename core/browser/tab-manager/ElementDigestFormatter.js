class ElementDigestFormatter {
  static MAX_CHARS = 2400;
  static ROW_MARGIN = 20;

  static DROPPED_HINT = 'To READ the rest of the page, call '
    + 'get_source {"type": "text"} once; it returns the whole page. Only scroll + '
    + 'observe_page again if you need a ref to click below the fold.)';

  static FOOTER = 'Interact by ref: click {"ref": 2} · type {"ref": 1, "text": "…", "submit": true}';

  static format(result, { maxChars = ElementDigestFormatter.MAX_CHARS } = {}) {
    const parts = ElementDigestFormatter._head(result);
    const below = ElementDigestFormatter._fitBelow(parts, ElementDigestFormatter._lines(result.below), maxChars);
    if (below.kept.length) parts.push('BELOW THE FOLD:', ...below.kept);
    const dropped = (result.dropped || 0) + below.dropped;
    if (dropped > 0) parts.push(`(${dropped} more elements not listed. ${ElementDigestFormatter.DROPPED_HINT}`);
    parts.push(ElementDigestFormatter.FOOTER);
    return parts.join('\n');
  }

  static _head(result) {
    const parts = [`PAGE: ${result.title || '(untitled)'} - ${result.url || ''}`];
    const inView = ElementDigestFormatter._lines(result.viewport);
    if (inView.length) parts.push('INTERACTIVE ELEMENTS (in view):', ...inView);
    else parts.push('INTERACTIVE ELEMENTS (in view): none found');
    return parts;
  }

  static _lines(rows) {
    return (rows || []).map((e) => `  [${e.ref}] ${e.role} "${e.label}"`);
  }

  static _fitBelow(parts, lines, maxChars) {
    let used = parts.join('\n').length;
    const kept = [];
    let dropped = 0;
    for (const line of lines) {
      if (used + line.length + ElementDigestFormatter.ROW_MARGIN > maxChars) { dropped += 1; continue; }
      kept.push(line);
      used += line.length + 1;
    }
    return { kept, dropped };
  }
}

module.exports = ElementDigestFormatter;
