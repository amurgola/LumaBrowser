class MatchExcerpts {
  static RADIUS = 600;

  static extract(text, term, { radius = MatchExcerpts.RADIUS, maxExcerpts = Infinity } = {}) {
    const page = String(text || '');
    const needle = String(term || '').trim().toLowerCase();
    if (!page || !needle) return { total: 0, excerpts: [] };
    const positions = MatchExcerpts._positions(page.toLowerCase(), needle);
    const spans = MatchExcerpts._spans(positions, { needleLength: needle.length, radius, maxExcerpts, pageLength: page.length });
    return { total: positions.length, excerpts: spans.map((span) => MatchExcerpts._excerpt(page, span)) };
  }

  static _positions(haystack, needle) {
    const found = [];
    for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) found.push(at);
    return found;
  }

  static _spans(positions, { needleLength, radius, maxExcerpts, pageLength }) {
    const spans = [];
    for (const at of positions) {
      const start = Math.max(0, at - radius);
      const end = Math.min(pageLength, at + needleLength + radius);
      const previous = spans[spans.length - 1];
      if (previous && start <= previous.end) previous.end = Math.max(previous.end, end);
      else if (spans.length < maxExcerpts) spans.push({ start, end });
      else break;
    }
    return spans;
  }

  static _excerpt(page, { start, end }) {
    const lead = start > 0 ? '…' : '';
    const tail = end < page.length ? '…' : '';
    return { start, end, text: `${lead}${page.slice(start, end).trim()}${tail}` };
  }
}

module.exports = MatchExcerpts;
