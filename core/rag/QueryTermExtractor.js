const WordTokenizer = require('./WordTokenizer');

class QueryTermExtractor {
  static TERM_BUDGET = 16;
  static MIN_STEM_LENGTH = 4;
  static SUFFIXES = ['ing', 'ed', 'es', 's'];
  static FUNCTION_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'is',
    'it', 'me', 'my', 'of', 'on', 'or', 'should', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where',
    'which', 'who', 'why', 'with', 'you', 'your',
  ]);

  static extract(query) {
    const words = QueryTermExtractor._distinctWords(query);
    const meaningful = QueryTermExtractor._withoutFunctionWords(words);
    const terms = QueryTermExtractor._withinBudget(meaningful).map((word) => QueryTermExtractor._term(word));
    return QueryTermExtractor._distinctStems(terms);
  }

  static _distinctWords(query) {
    return [...new Set(WordTokenizer.words(query).map((word) => word.folded))];
  }

  static _withoutFunctionWords(words) {
    const kept = words.filter((word) => !QueryTermExtractor.FUNCTION_WORDS.has(word));
    return kept.length ? kept : words;
  }

  static _withinBudget(words) {
    if (words.length <= QueryTermExtractor.TERM_BUDGET) return words;
    const longest = new Set([...words].sort((a, b) => b.length - a.length).slice(0, QueryTermExtractor.TERM_BUDGET));
    return words.filter((word) => longest.has(word));
  }

  static _term(word) {
    const prefix = word.length >= QueryTermExtractor.MIN_STEM_LENGTH;
    return { word, stem: prefix ? QueryTermExtractor._stem(word) : word, prefix };
  }

  static _distinctStems(terms) {
    const seen = new Set();
    return terms.filter((term) => !seen.has(term.stem) && seen.add(term.stem));
  }

  static _stem(word) {
    for (const suffix of QueryTermExtractor.SUFFIXES) {
      const stem = word.slice(0, -suffix.length);
      if (word.endsWith(suffix) && stem.length >= QueryTermExtractor.MIN_STEM_LENGTH) return stem;
    }
    return word;
  }
}

module.exports = QueryTermExtractor;
