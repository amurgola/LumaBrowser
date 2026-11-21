const FullOffloadCost = require('./FullOffloadCost');
const LaunchCostInput = require('./LaunchCostInput');
const PartialOffloadSizer = require('./PartialOffloadSizer');
const SlidingWindowLayout = require('./SlidingWindowLayout');
const LoopCoreLayout = require('./LoopCoreLayout');
const GpuOverhead = require('./GpuOverhead');
const UnifiedShare = require('./UnifiedShare');
const FitShape = require('./FitShape');

class OffloadDecision {
  static ALL_LAYERS = 999;

  static resolve(state) {
    const decision = {};
    OffloadDecision._priceFullOffload(decision, state);
    OffloadDecision._applyMeasurement(decision, state);
    OffloadDecision._decideFit(decision, state);
    OffloadDecision._decideLayers(decision, state);
    OffloadDecision._decidePinnedHost(decision, state);
    return decision;
  }

  static _priceFullOffload(decision, state) {
    const { files, budget, moe } = state;
    decision.swaLayout = files.gguf ? SlidingWindowLayout.of(files.gguf) : null;
    decision.swaFullUseless = !!decision.swaLayout && LoopCoreLayout.rewindsByCheckpoint(files.gguf);
    decision.headerEstimatedBytesSwaFull = files.gguf
      ? OffloadDecision._price(state, true)
      : FullOffloadCost.noHeaderBytes(LaunchCostInput.noHeader(state));
    decision.headerEstimatedBytesIswa = decision.swaLayout
      ? OffloadDecision._price(state, false)
      : decision.headerEstimatedBytesSwaFull;
    decision.swaFullAffordable = !decision.swaFullUseless && budget.totalVram > 0
      && decision.headerEstimatedBytesSwaFull <= budget.vramAvailableBytes;
    decision.headerEstimatedBytes = decision.swaFullAffordable
      ? decision.headerEstimatedBytesSwaFull : decision.headerEstimatedBytesIswa;
  }

  static _price(state, swaFull) {
    const held = !!state.moe.cpuMoeEnabled;
    return FullOffloadCost.bytes(LaunchCostInput.build(state, state.moe.budgetWeightsBytes, swaFull, { scratchHeldBack: held }))
      + (held ? state.moe.heldBackBytes : 0);
  }

  static _applyMeasurement(decision, state) {
    const { overrides } = state;
    decision.fitShape = FitShape.of(state, decision);
    const measured = Number(overrides.measuredVramBytes) > 0 ? Number(overrides.measuredVramBytes) : null;
    decision.measuredStale = measured != null && 'measuredShape' in overrides
      && !FitShape.matches(overrides.measuredShape, decision.fitShape);
    decision.measuredVramBytes = decision.measuredStale ? null : measured;
    decision.modelEstimatedBytes = decision.measuredVramBytes != null
      ? decision.measuredVramBytes : decision.headerEstimatedBytes;
  }

  static _decideFit(decision, { budget, flags, files, overrides }) {
    decision.measuredFullOffload = !!budget.unifiedMemory && overrides.measuredFullOffload === true && decision.measuredVramBytes != null;
    const fitsPinned = budget.totalVram > 0
      && (decision.modelEstimatedBytes <= budget.fullOffloadRoomBytes || decision.measuredFullOffload);
    decision.softHeadroom = fitsPinned && !decision.measuredFullOffload
      && decision.modelEstimatedBytes > budget.vramAvailableBytes;
    decision.unifiedHostBytes = UnifiedShare.hostBytes(budget, files.gguf);
    decision.hostOffPoolBytes = 0;
    if (!fitsPinned && decision.measuredVramBytes == null && decision.unifiedHostBytes > 0
      && decision.headerEstimatedBytes - decision.unifiedHostBytes <= budget.vramAvailableBytes) {
      decision.hostOffPoolBytes = decision.unifiedHostBytes;
      decision.modelEstimatedBytes = decision.headerEstimatedBytes - decision.unifiedHostBytes;
    }
    decision.fullOffload = fitsPinned || decision.hostOffPoolBytes > 0;
    decision.singleGpuFits = decision.fullOffload && budget.perGpu.length > 1
      && decision.modelEstimatedBytes <= budget.largestGpuUsableBytes;
    decision.swaFull = decision.fullOffload && flags.swaFull && decision.swaFullAffordable && !!decision.swaLayout;
  }

  static _decideLayers(decision, state) {
    decision.partial = null;
    if (decision.fullOffload) {
      decision.ngl = OffloadDecision.ALL_LAYERS;
    } else if (state.files.gguf && state.budget.vramAvailableBytes > GpuOverhead.FIXED) {
      decision.partial = PartialOffloadSizer.size(OffloadDecision._partialInput(state));
      decision.ngl = decision.partial.ngl;
    } else {
      decision.ngl = 0;
    }
  }

  static _decidePinnedHost(decision, { budget }) {
    decision.pinnedHostOff = !!(budget && budget.unifiedMemory) && (!decision.fullOffload || decision.hostOffPoolBytes > 0);
  }

  static _partialInput({ files, kv, flags, spec, vision, budget, moe }) {
    return {
      gguf: files.gguf,
      modelBytes: moe.budgetWeightsBytes,
      mmprojBytes: vision.effectiveMmprojBytes,
      contextSize: kv.contextSize,
      cacheTypeK: kv.cacheTypeK,
      cacheTypeV: kv.cacheTypeV,
      vramAvailableBytes: budget.vramAvailableBytes,
      mtpEnabled: spec.mtpEnabled,
      mtpHeadBytes: spec.mtpBranchHeadBytes,
      drafterBytes: spec.specDrafterBytes,
      flashAttnSupported: flags.flashAttn,
      kvOnHost: kv.kvOnHost,
    };
  }
}

module.exports = OffloadDecision;
