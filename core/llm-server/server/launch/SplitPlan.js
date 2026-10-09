const TensorParallelRatio = require('./TensorParallelRatio');
const RpcSplitRatio = require('./RpcSplitRatio');
const LayerFillSplit = require('./LayerFillSplit');

class SplitPlan {
  static resolve(state) {
    const emitTensorSplit = state.tensorGate.staticOk && state.offload.fullOffload;
    return {
      emitTensorSplit,
      tensorSplitRatio: emitTensorSplit ? TensorParallelRatio.compute(state.budget.perGpu) : null,
      rpcSplitRatio: SplitPlan._rpcRatio(state),
      layerFill: SplitPlan._layerFillEligible(state, emitTensorSplit) ? SplitPlan._layerFill(state) : null,
    };
  }

  static _rpcRatio({ budget, diagnostics, offload }) {
    if (!budget.rpcEnabled) return null;
    const localCount = budget.perGpu.filter((g) => !g.remote).length;
    return RpcSplitRatio.compute(budget.rpcServers, diagnostics, localCount, offload.modelEstimatedBytes);
  }

  static _layerFillEligible({ budget, moe, overrides, flags, offload, files }, emitTensorSplit) {
    return !emitTensorSplit && !budget.rpcEnabled
      && !(moe.cpuMoeEnabled && moe.gpuExpertLayers > 0)
      && !overrides.manualTensorSplitActive
      && flags.tensorSplit
      && budget.perGpu.length >= 2 && offload.ngl > 0 && !!files.gguf;
  }

  static _layerFill({ budget, files, kv, flags, spec, vision, moe, offload }) {
    return LayerFillSplit.compute({
      perGpu: budget.perGpu,
      gguf: files.gguf,
      contextSize: kv.contextSize,
      cacheTypeK: kv.cacheTypeK,
      cacheTypeV: kv.cacheTypeV,
      kvOnHost: kv.kvOnHost,
      swaFull: offload.swaFull,
      modelBytes: moe.budgetWeightsBytes,
      extraBytes: (vision.effectiveMmprojBytes || 0) + spec.mtpBranchBytes + spec.specDrafterBytes,
      flashAttnSupported: flags.flashAttn,
      layersOnGpu: offload.fullOffload ? files.gguf.blockCount : (offload.partial ? offload.partial.ngl : 0),
    });
  }
}

module.exports = SplitPlan;
