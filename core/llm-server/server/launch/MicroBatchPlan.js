const FullOffloadCost = require('./FullOffloadCost');
const LaunchCostInput = require('./LaunchCostInput');
const LayerMaskCost = require('./LayerMaskCost');
const LoopCoreLayout = require('./LoopCoreLayout');

class MicroBatchPlan {
  static STEPS = [512, 256, 128];

  static resolve(state) {
    const gguf = state.files.gguf;
    const room = Number(state.budget.largestGpuUsableBytes) || 0;
    if (!LayerMaskCost.applies(gguf) || room <= 0) return MicroBatchPlan._describe(gguf, state.kv.contextSize, LayerMaskCost.DEFAULT_MICRO_BATCH);
    const fitting = MicroBatchPlan.STEPS.find((step) => MicroBatchPlan._price(state, step) <= room);
    return MicroBatchPlan._describe(gguf, state.kv.contextSize, fitting || MicroBatchPlan.STEPS[MicroBatchPlan.STEPS.length - 1]);
  }

  static _price(state, microBatch) {
    const swaFull = !LoopCoreLayout.rewindsByCheckpoint(state.files.gguf);
    return FullOffloadCost.bytes({ ...LaunchCostInput.build(state, state.files.modelBytes, swaFull), microBatch });
  }

  static _describe(gguf, contextSize, microBatch) {
    const maskBytes = LayerMaskCost.bytes(gguf, contextSize, microBatch);
    return {
      microBatch,
      reduced: microBatch < LayerMaskCost.DEFAULT_MICRO_BATCH,
      maskBytes,
      savedBytes: LayerMaskCost.bytes(gguf, contextSize, LayerMaskCost.DEFAULT_MICRO_BATCH) - maskBytes,
    };
  }
}

module.exports = MicroBatchPlan;
