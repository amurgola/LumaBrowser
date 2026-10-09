class RagEmbedder {
  static _embedder = null;

  static set(fn) {
    RagEmbedder._embedder = typeof fn === 'function' ? fn : null;
  }

  static isConfigured() {
    return RagEmbedder._embedder != null;
  }

  static async embed(texts) {
    if (!RagEmbedder._embedder || !Array.isArray(texts) || texts.length === 0) return null;
    try {
      const vectors = await RagEmbedder._embedder(texts);
      return Array.isArray(vectors) && vectors.length === texts.length ? vectors : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = RagEmbedder;
