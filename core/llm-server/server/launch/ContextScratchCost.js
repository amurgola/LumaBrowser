const LayerMaskCost = require('./LayerMaskCost');
const SlidingWindowLayout = require('./SlidingWindowLayout');

class ContextScratchCost {
  static MIB = 1024 * 1024;

  static FLOOR = 250 * ContextScratchCost.MIB;
  static BASE = 100 * ContextScratchCost.MIB;
  static PER_TOKEN = 5 * 1024;

  static WINDOWED_FACTOR = 1.8;

  static SPLIT_FACTOR = 1.6;

  static bytes({ gguf, contextSize, swaFull, split = false }) {
    if (LayerMaskCost.applies(gguf)) return 0;
    const windowed = !swaFull && !!(gguf && SlidingWindowLayout.of(gguf));
    const perToken = ContextScratchCost.PER_TOKEN * (windowed ? ContextScratchCost.WINDOWED_FACTOR : 1);
    const single = Math.max(ContextScratchCost.FLOOR, ContextScratchCost.BASE + (Number(contextSize) || 0) * perToken);
    return Math.round(single * (split ? ContextScratchCost.SPLIT_FACTOR : 1));
  }
}

module.exports = ContextScratchCost;
