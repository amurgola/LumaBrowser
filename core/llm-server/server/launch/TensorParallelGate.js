const RuntimeFlags = require('./RuntimeFlags');

class TensorParallelGate {
  static resolve({ overrides, flags, gguf, rpcEnabled, gpuCount }) {
    const requested = !!overrides.tensorSplitMode && !overrides.manualTensorSplitActive;
    const dense = !(gguf && Number(gguf.expertCount) > 1);
    const staticOk = requested && flags.tensorSplitRuntime && flags.splitMode && flags.flashAttn && dense
      && !rpcEnabled && gpuCount >= 2 && flags.tensorSplitBuild;
    return { requested, staticOk, whyOff: TensorParallelGate._whyOff(flags, dense, gpuCount) };
  }

  static _whyOff(flags, dense, gpuCount) {
    if (!flags.tensorSplitRuntime) return 'needs the CUDA runtime';
    if (!flags.flashAttn) return 'needs flash attention';
    if (!flags.splitMode) return `${flags.name} doesn't accept --split-mode`;
    if (!dense) return 'only dense (non-MoE) models benefit';
    if (gpuCount < 2) return 'needs 2+ GPUs (the model was pinned to a single card)';
    if (Number(flags.build) < RuntimeFlags.TENSOR_SPLIT_MIN_BUILD) return `needs llama.cpp build ≥ b${RuntimeFlags.TENSOR_SPLIT_MIN_BUILD}`;
    return 'preconditions not met';
  }
}

module.exports = TensorParallelGate;
