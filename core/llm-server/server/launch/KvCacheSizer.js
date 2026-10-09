const KvCacheType = require('./KvCacheType');
const SlidingWindowLayout = require('./SlidingWindowLayout');
const HybridAttentionLayout = require('./HybridAttentionLayout');

class KvCacheSizer {
  static SWA_CACHE_PAD = 512;

  static DEFAULT_HEAD_DIM = 128;

  static DEFAULT_HEAD_COUNT = 32;

  static perLayer(gguf, contextSize, cacheTypeK, cacheTypeV) {
    const fallbackDim = KvCacheSizer._fallbackDim(gguf);
    const kDim = gguf.keyLength || fallbackDim;
    const vDim = gguf.valueLength || fallbackDim;
    return (KvCacheType.elementBytes(cacheTypeK) * kDim + KvCacheType.elementBytes(cacheTypeV) * vDim)
      * KvCacheSizer._headsScalar(gguf) * contextSize;
  }

  static total(gguf, contextSize, cacheTypeK, cacheTypeV, swaFull) {
    const blocks = gguf.blockCount;
    const hybrid = HybridAttentionLayout.of(gguf);
    const layout = swaFull ? null : SlidingWindowLayout.of(gguf);
    if (!layout) {
      return KvCacheSizer.perLayer(gguf, contextSize, cacheTypeK, cacheTypeV) * (hybrid ? hybrid.kvLayers : blocks);
    }
    let total = 0;
    for (let i = 0; i < blocks; i++) total += KvCacheSizer.atLayer(gguf, i, contextSize, cacheTypeK, cacheTypeV, swaFull);
    return total;
  }

  static atLayer(gguf, index, contextSize, cacheTypeK, cacheTypeV, swaFull) {
    const hybrid = HybridAttentionLayout.of(gguf);
    if (hybrid && !hybrid.hasKvAt(index)) return 0;
    const layout = swaFull ? null : SlidingWindowLayout.of(gguf);
    if (!layout) return KvCacheSizer.perLayer(gguf, contextSize, cacheTypeK, cacheTypeV);
    return KvCacheSizer._windowedLayer(gguf, index, contextSize, cacheTypeK, cacheTypeV, layout);
  }

  static _windowedLayer(gguf, index, contextSize, cacheTypeK, cacheTypeV, layout) {
    const fallbackDim = KvCacheSizer._fallbackDim(gguf);
    const swa = layout.isSwaAt(index);
    const kDim = (swa ? gguf.keyLengthSwa : null) || gguf.keyLength || fallbackDim;
    const vDim = (swa ? gguf.valueLengthSwa : null) || gguf.valueLength || fallbackDim;
    const tokens = swa ? Math.min(contextSize, layout.window + KvCacheSizer.SWA_CACHE_PAD) : contextSize;
    return (KvCacheType.elementBytes(cacheTypeK) * kDim + KvCacheType.elementBytes(cacheTypeV) * vDim)
      * KvCacheSizer._headsAt(gguf, index) * tokens;
  }

  static _headsAt(gguf, index) {
    const perLayer = gguf.headCountKvPerLayer;
    if (Array.isArray(perLayer) && perLayer.length === gguf.blockCount) return Number(perLayer[index]) || 0;
    return KvCacheSizer._headsScalar(gguf);
  }

  static _fallbackDim(gguf) {
    const headCount = gguf.headCount || KvCacheSizer.DEFAULT_HEAD_COUNT;
    return (gguf.embeddingLength && headCount) ? gguf.embeddingLength / headCount : KvCacheSizer.DEFAULT_HEAD_DIM;
  }

  static _headsScalar(gguf) {
    if (gguf.headCountKv) return gguf.headCountKv;
    const perLayer = gguf.headCountKvPerLayer;
    if (Array.isArray(perLayer) && perLayer.length) {
      return perLayer.reduce((sum, n) => sum + (Number(n) || 0), 0) / perLayer.length;
    }
    return gguf.headCount || KvCacheSizer.DEFAULT_HEAD_COUNT;
  }
}

module.exports = KvCacheSizer;
