const SpanSegmenter = require('./SpanSegmenter');

class OversizeSpanSplitter {
  constructor(maxChars) {
    this._maxChars = Math.max(1, maxChars);
  }

  split(source, span) {
    const spans = [];
    let from = span.start;
    while (from < span.end) {
      const rest = SpanSegmenter.tighten(source, from, span.end);
      if (!rest) break;
      const to = this._cutBefore(source, rest.start, span.end);
      const piece = SpanSegmenter.tighten(source, rest.start, to);
      if (piece) spans.push(piece);
      from = to;
    }
    return spans;
  }

  _cutBefore(source, from, end) {
    const limit = from + this._maxChars;
    if (limit >= end) return end;
    const gap = OversizeSpanSplitter._lastSpace(source, from, limit);
    return gap > from ? gap : OversizeSpanSplitter._safeCut(source, from, limit);
  }

  static _lastSpace(source, from, limit) {
    for (let i = limit; i > from; i--) if (/\s/.test(source[i])) return i;
    return -1;
  }

  static _safeCut(source, from, limit) {
    const lowSurrogate = /[\uDC00-\uDFFF]/.test(source[limit]);
    return lowSurrogate && limit - 1 > from ? limit - 1 : limit;
  }
}

module.exports = OversizeSpanSplitter;
