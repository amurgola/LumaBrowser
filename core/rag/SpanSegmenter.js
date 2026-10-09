class SpanSegmenter {
  segment(source, start = 0, end = source.length) {
    const cuts = [start, ...this._cutPoints(source, start, end), end];
    const spans = [];
    for (let i = 1; i < cuts.length; i++) {
      const span = SpanSegmenter.tighten(source, cuts[i - 1], cuts[i]);
      if (span) spans.push(span);
    }
    return spans;
  }

  static tighten(source, start, end) {
    let from = start;
    let to = end;
    while (from < to && SpanSegmenter._isSpace(source[from])) from++;
    while (to > from && SpanSegmenter._isSpace(source[to - 1])) to--;
    return from < to ? { start: from, end: to } : null;
  }

  _cutPoints() {
    return [];
  }

  static _isSpace(char) {
    return /\s/.test(char);
  }
}

module.exports = SpanSegmenter;
