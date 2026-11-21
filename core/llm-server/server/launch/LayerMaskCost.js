const LoopCoreLayout = require('./LoopCoreLayout');

class LayerMaskCost {
  static ARCHITECTURES = ['inkling2', 'inkling2_loop'];

  static SHARED_MASKS = 3;

  static ELEMENT_BYTES = 4;

  static DEFAULT_MICRO_BATCH = 512;

  static applies(gguf) {
    return !!gguf && LayerMaskCost.ARCHITECTURES.includes(String(gguf.architecture || '').toLowerCase());
  }

  static bytes(gguf, contextSize, microBatch = LayerMaskCost.DEFAULT_MICRO_BATCH) {
    if (!LayerMaskCost.applies(gguf)) return 0;
    return (LayerMaskCost.passes(gguf) + LayerMaskCost.SHARED_MASKS) * contextSize * microBatch * LayerMaskCost.ELEMENT_BYTES;
  }

  static passes(gguf) {
    const blocks = Number(gguf && gguf.blockCount) || 0;
    let passes = 0;
    for (let i = 0; i < blocks; i++) passes += LoopCoreLayout.visitsAt(gguf, i);
    return passes;
  }
}

module.exports = LayerMaskCost;
