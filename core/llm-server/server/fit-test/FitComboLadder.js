const ContextLadder = require('../../context/ContextLadder');
const KvCacheModes = require('../../../shared/llm/KvCacheModes');
const DepthProbe = require('./DepthProbe');

class FitComboLadder {
  static CTX_LADDER = ContextLadder.RUNGS;
  static KV_VARIANTS = KvCacheModes.OFFERED_MODE_IDS;

  static build(model) {
    const combos = [];
    for (const contextTokens of ContextLadder.rungsFor(FitComboLadder.nativeContext(model))) {
      for (const kv of FitComboLadder.KV_VARIANTS) combos.push({ contextTokens, kv });
    }
    const probe = FitComboLadder.pickDepthProbe(combos);
    if (probe) probe.depthProbe = true;
    return combos;
  }

  static nativeContext(model) {
    const gguf = model && model.gguf;
    return gguf && gguf.parsed && gguf.contextLength ? gguf.contextLength : null;
  }

  static pickDepthProbe(combos) {
    const eligible = combos.filter((c) => c.contextTokens >= DepthProbe.MIN_CTX && c.kv === FitComboLadder.KV_VARIANTS[0]);
    if (eligible.length === 0) return null;
    return eligible.reduce((a, b) => (b.contextTokens < a.contextTokens ? b : a));
  }
}

module.exports = FitComboLadder;
