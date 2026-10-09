const EmbeddingVector = require('./EmbeddingVector');

class PassageSimilarity {
  static between(a, b) {
    if (a.vector && b.vector) return Math.max(0, EmbeddingVector.cosine(a.vector, b.vector));
    return PassageSimilarity._wordOverlap(a.words, b.words);
  }

  static _wordOverlap(first, second) {
    if (!first || !second || (first.size === 0 && second.size === 0)) return 0;
    let shared = 0;
    for (const word of first) if (second.has(word)) shared++;
    return shared / (first.size + second.size - shared);
  }
}

module.exports = PassageSimilarity;
