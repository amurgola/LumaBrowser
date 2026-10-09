class WordTokenizer {
  static WORD_PATTERN = /[\p{L}\p{N}\p{M}]+/gu;
  static HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
  static LATIN_ACCENTS = /(?<=\p{Script=Latin})\p{Mn}+/gu;

  static words(text) {
    const words = [];
    for (const match of String(text || '').matchAll(WordTokenizer.WORD_PATTERN)) {
      const folded = WordTokenizer.fold(match[0]);
      if (folded) words.push({ text: match[0], folded, start: match.index, end: match.index + match[0].length });
    }
    return words;
  }

  static foldedSet(text) {
    return new Set(WordTokenizer.words(text).map((word) => word.folded));
  }

  static fold(word) {
    const folded = String(word).normalize('NFD').replace(WordTokenizer.LATIN_ACCENTS, '').normalize('NFC').toLowerCase();
    return WordTokenizer.HAS_LETTER_OR_DIGIT.test(folded) ? folded : '';
  }
}

module.exports = WordTokenizer;
