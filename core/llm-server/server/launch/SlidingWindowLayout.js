class SlidingWindowLayout {
  static GEMMA2_PATTERN = 2;

  static GEMMA_PATTERN = 6;

  static of(gguf) {
    const window = Number(gguf && gguf.slidingWindow) || 0;
    const blocks = Number(gguf && gguf.blockCount) || 0;
    if (!window || !blocks) return null;
    const perLayer = gguf.slidingWindowPerLayer;
    if (Array.isArray(perLayer) && perLayer.length === blocks) {
      return SlidingWindowLayout._fromPerLayerFlags(window, blocks, perLayer);
    }
    const pattern = SlidingWindowLayout._pattern(gguf);
    return pattern ? SlidingWindowLayout._fromPattern(window, blocks, pattern) : null;
  }

  static _fromPerLayerFlags(window, blocks, perLayer) {
    const swaLayers = perLayer.filter(Boolean).length;
    if (!swaLayers) return null;
    return { window, globalLayers: blocks - swaLayers, swaLayers, isSwaAt: (i) => !!perLayer[i] };
  }

  static _fromPattern(window, blocks, pattern) {
    if (pattern <= 1) return null;
    const globalLayers = Math.floor(blocks / pattern);
    const swaLayers = blocks - globalLayers;
    if (swaLayers <= 0) return null;
    return { window, globalLayers, swaLayers, isSwaAt: (i) => (i + 1) % pattern !== 0 };
  }

  static _pattern(gguf) {
    const pattern = Number(gguf.slidingWindowPattern) || 0;
    if (pattern) return pattern;
    const arch = String(gguf.architecture || '');
    if (/^gemma2/.test(arch)) return SlidingWindowLayout.GEMMA2_PATTERN;
    if (/^gemma/.test(arch)) return SlidingWindowLayout.GEMMA_PATTERN;
    return 0;
  }
}

module.exports = SlidingWindowLayout;
