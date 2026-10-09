class ExcerptWindow {
  static WIDTH = 280;
  static LEAD = 60;
  static ELLIPSIS = '...';

  static cut(text, spans) {
    const source = String(text || '');
    const matches = spans || [];
    const start = ExcerptWindow._snapStart(source, ExcerptWindow._bestStart(source, matches));
    const end = ExcerptWindow._snapEnd(source, start + ExcerptWindow.WIDTH);
    return ExcerptWindow._excerpt(source, start, end, matches);
  }

  static _bestStart(source, spans) {
    if (source.length <= ExcerptWindow.WIDTH || spans.length === 0) return 0;
    let best = 0;
    let bestCount = -1;
    for (const anchor of spans) {
      const start = ExcerptWindow._anchoredStart(source, anchor);
      const count = spans.filter((span) => span.start >= start && span.end <= start + ExcerptWindow.WIDTH).length;
      if (count > bestCount) [best, bestCount] = [start, count];
    }
    return best;
  }

  static _anchoredStart(source, anchor) {
    return Math.max(0, Math.min(anchor.start - ExcerptWindow.LEAD, source.length - ExcerptWindow.WIDTH));
  }

  static _snapStart(source, start) {
    if (start <= 0) return 0;
    const space = source.slice(start - 1).search(/\s/);
    return space === -1 || space > ExcerptWindow.LEAD ? start : start + space;
  }

  static _snapEnd(source, end) {
    if (end >= source.length) return source.length;
    const before = source.slice(0, end + 1);
    const space = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n'), before.lastIndexOf('\t'));
    return space > end - ExcerptWindow.LEAD ? space : end;
  }

  static _excerpt(source, start, end, spans) {
    const head = start > 0 ? ExcerptWindow.ELLIPSIS : '';
    const tail = end < source.length ? ExcerptWindow.ELLIPSIS : '';
    const body = ExcerptWindow._collapse(source.slice(start, end));
    const marks = ExcerptWindow._marks(source, start, end, spans, head.length);
    return { text: head + body + tail, marks };
  }

  static _marks(source, start, end, spans, offset) {
    return spans
      .filter((span) => span.start >= start && span.end <= end)
      .map((span) => {
        const from = offset + ExcerptWindow._collapse(source.slice(start, span.start)).length;
        return [from, from + (span.end - span.start)];
      });
  }

  static _collapse(text) {
    return text.replace(/\s+/g, ' ');
  }
}

module.exports = ExcerptWindow;
