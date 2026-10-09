const SlotPlan = require('./SlotPlan');
const SpeculationPlan = require('./SpeculationPlan');
const PromptCacheRam = require('./PromptCacheRam');

class PlanSummary {
  static build(state) {
    return {
      ...PlanSummary._context(state),
      ...PlanSummary._speculation(state),
      ...PlanSummary._placement(state),
      ...PlanSummary._serving(state),
      ...PlanSummary._experts(state),
      ...PlanSummary._accounting(state),
    };
  }

  static _context({ kv, userArgs, loading, vision, files, family }) {
    return {
      contextSize: kv.contextSize,
      userArgs: userArgs.slice(),
      loadMode: loading.useMmap ? 'mmap' : 'none',
      loadModeFlag: loading.loadModeFlag,
      mmprojPath: vision.effectiveMmprojPath,
      mmprojAvailable: vision.mmprojAvailable,
      requestedContextSize: kv.requestedContextSize,
      modelFamily: files.family,
      familySamplerDefaults: family.tuning.profile ? { ...family.tuning.profile.samplerDefaults } : null,
    };
  }

  static _speculation({ family, files, spec, kv, flags }) {
    const drafter = family.drafterSpec;
    return {
      drafterPath: drafter ? files.drafterPath : null,
      specType: drafter ? drafter.specType : (spec.mtpEnabled ? 'draft-mtp' : null),
      mtpDraftNMax: spec.mtpEnabled ? spec.mtpDraftNMax : null,
      draftCacheType: spec.draftCacheType,
      cacheTypeK: kv.cacheTypeK,
      cacheTypeV: kv.cacheTypeV,
      kvQuantForcedF16: kv.kvQuantForcedF16,
      mtp: spec.mtpEnabled ? PlanSummary._mtp(spec, files, flags) : null,
      ngramSpec: spec.ngramSpecEnabled,
    };
  }

  static _mtp(spec, files, flags) {
    const ik = flags.specDialect === 'ik';
    return {
      type: ik ? 'mtp' : 'draft-mtp,ngram-mod',
      dialect: flags.specDialect,
      draftNMax: spec.mtpDraftNMax,
      headPath: spec.mtpDetached ? files.mtpHeadPath : null,
      headBytes: spec.mtpDetached ? files.mtpHeadBytes : 0,
      ngramModNMatch: ik ? null : SpeculationPlan.NGRAM_MOD_N_MATCH,
      ngramModNMin: ik ? null : SpeculationPlan.NGRAM_MOD_N_MIN,
      ngramModNMax: ik ? null : SpeculationPlan.NGRAM_MOD_N_MAX,
    };
  }

  static _placement({ offload, files, budget, splits, tensorGate, flags }) {
    const gguf = files.gguf;
    return {
      ngl: offload.ngl,
      fullOffload: offload.fullOffload,
      partial: offload.partial,
      gguf: gguf ? {
        architecture: gguf.architecture, blockCount: gguf.blockCount,
        contextLength: gguf.contextLength, fileTypeName: gguf.fileTypeName,
      } : null,
      singleGpu: offload.singleGpuFits ? budget.perGpu[budget.largestGpuIndex] : null,
      splitMode: splits.emitTensorSplit ? 'tensor' : null,
      tensorSplit: splits.emitTensorSplit ? splits.tensorSplitRatio : null,
      tensorSplitRequested: tensorGate.requested,
      layerSplit: splits.layerFill ? { ratio: splits.layerFill.ratio, perDevice: splits.layerFill.perDevice } : null,
      flashAttn: flags.flashAttn,
      swaFull: offload.swaFull,
    };
  }

  static _serving({ slots, loading, kv }) {
    return {
      cacheReuse: slots.cacheReuseEnabled,
      cacheReuseRequested: slots.cacheReuseRequested,
      cacheReuseMinChunk: slots.cacheReuseEnabled ? SlotPlan.CACHE_REUSE_MIN_CHUNK : null,
      promptCache: {
        cacheRamMiB: loading.promptCacheRam.mib,
        source: loading.promptCacheRam.source,
        reason: loading.promptCacheRam.reason,
        slotPromptSimilarity: loading.slotSimilarityEnabled ? PromptCacheRam.SLOT_PROMPT_SIMILARITY : null,
      },
      maxConcurrent: slots.maxConcurrent,
      maxConcurrentRequested: slots.requestedConcurrent,
      ctxPerSlot: slots.maxConcurrent > 1 ? Math.floor(kv.contextSize / slots.maxConcurrent) : kv.contextSize,
    };
  }

  static _experts({ moe }) {
    return {
      cpuMoe: moe.cpuMoeEnabled,
      cpuMoeRequested: moe.cpuMoeRequested,
      cpuMoeAuto: moe.cpuMoeEnabled && moe.cpuMoeAuto,
      moeSplit: moe.cpuMoeEnabled ? {
        expertBytes: moe.moeSplit.expertBytes,
        residentBytes: moe.moeSplit.residentBytes,
        expertFraction: moe.moeSplit.expertFraction,
        hostBytes: moe.moeHostBytes,
        exact: moe.moeExact,
        nCpuMoe: moe.gpuExpertLayers > 0 ? moe.nCpuMoe : null,
        gpuExpertLayers: moe.gpuExpertLayers,
        tensorSplit: moe.tensorSplitRatio,
      } : null,
    };
  }

  static _accounting(state) {
    const { budget, splits, apiKey, skippedFlags, offload, decodeEstimate, flags, files, port, notes } = state;
    return {
      rpc: budget.rpcEnabled ? PlanSummary._rpc(budget, splits) : null,
      apiKeyRequired: !!apiKey,
      skippedFlags,
      vramAvailableBytes: budget.vramAvailableBytes,
      modelEstimatedBytes: offload.modelEstimatedBytes,
      headerEstimatedBytes: offload.headerEstimatedBytes,
      measuredVramBytes: offload.measuredVramBytes,
      perGpu: budget.perGpu,
      decodeEstimate,
      runtimeId: flags.id,
      runtimeName: flags.name,
      modelName: files.name,
      port,
      notes,
    };
  }

  static _rpc(budget, splits) {
    return {
      servers: budget.rpcServers.map((s) => ({
        addr: s.addr, label: s.label || null,
        totalBytes: Number(s.totalBytes) || 0, freeBytes: Number(s.freeBytes) || 0,
        peerId: s.peerId || null,
      })),
      tensorSplit: splits.rpcSplitRatio,
    };
  }
}

module.exports = PlanSummary;
