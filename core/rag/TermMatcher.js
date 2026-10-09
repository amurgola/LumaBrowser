const WordTokenizer = require('./WordTokenizer');

class TermMatcher {
  constructor(terms) {
    this._terms = terms || [];
  }

  spans(text) {
    const spans = [];
    for (const word of WordTokenizer.words(text)) {
      const term = this._termMatching(word.folded);
      if (term) spans.push({ start: word.start, end: word.end, stem: term.stem });
    }
    return spans;
  }

  coverage(text) {
    if (this._terms.length === 0) return 0;
    const present = new Set(this.spans(text).map((span) => span.stem));
    return present.size / this._terms.length;
  }

  _termMatching(folded) {
    return this._terms.find((term) => (term.prefix ? folded.startsWith(term.stem) : folded === term.word));
  }
}

module.exports = TermMatcher;
