const SpanSegmenter = require('./SpanSegmenter');

class SentenceSegmenter extends SpanSegmenter {
  static ABBREVIATIONS = new Set([
    'e.g', 'i.e', 'etc', 'vs', 'cf', 'approx', 'fig', 'no', 'mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'jr', 'sr', 'inc', 'ltd',
  ]);

  static TERMINATOR = /[.!?]+["'”’)\]]*(?=\s)|[。！？]/g;
  static LIST_ITEM = /\n(?=[ \t]*(?:[-*+]|\d{1,3}[.)])[ \t])/g;

  _cutPoints(source, start, end) {
    const range = source.slice(start, end);
    const cuts = [...this._sentenceEnds(range), ...SentenceSegmenter._listItemStarts(range)];
    return [...new Set(cuts)].filter((cut) => cut > 0 && cut < range.length).sort((a, b) => a - b).map((cut) => cut + start);
  }

  _sentenceEnds(range) {
    const cuts = [];
    for (const match of range.matchAll(SentenceSegmenter.TERMINATOR)) {
      const after = match.index + match[0].length;
      if (SentenceSegmenter._endsSentence(range, match, after)) cuts.push(after);
    }
    return cuts;
  }

  static _listItemStarts(range) {
    return [...range.matchAll(SentenceSegmenter.LIST_ITEM)].map((match) => match.index + 1);
  }

  static _endsSentence(range, match, after) {
    if (/^[。！？]/.test(match[0])) return true;
    if (!SentenceSegmenter._nextStartsSentence(range, after)) return false;
    return !(match[0] === '.' && SentenceSegmenter._isAbbreviation(range, match.index));
  }

  static _nextStartsSentence(range, after) {
    const visible = /\S/g;
    visible.lastIndex = after;
    const next = visible.exec(range);
    return !!next && !/\p{Ll}/u.test(next[0]);
  }

  static _isAbbreviation(range, dotIndex) {
    const word = range.slice(Math.max(0, dotIndex - 12), dotIndex).match(/[\p{L}.]+$/u);
    if (!word) return false;
    const token = word[0].toLowerCase();
    return token.length === 1 || SentenceSegmenter.ABBREVIATIONS.has(token);
  }
}

module.exports = SentenceSegmenter;
