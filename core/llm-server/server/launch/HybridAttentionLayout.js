class HybridAttentionLayout {
  static of(gguf) {
    const flags = gguf && gguf.attnKvPerLayer;
    const blocks = Number(gguf && gguf.blockCount) || 0;
    if (!Array.isArray(flags) || flags.length !== blocks) return null;
    const kvLayers = flags.filter(Boolean).length;
    if (kvLayers <= 0 || kvLayers >= blocks) return null;
    return { kvLayers, totalLayers: blocks, hasKvAt: (i) => !!flags[i] };
  }
}

module.exports = HybridAttentionLayout;
