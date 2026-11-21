class LaunchCostInput {
  static build({ files, kv, flags, spec, vision, batch }, modelBytes, swaFull, { scratchHeldBack = false } = {}) {
    return {
      microBatch: batch ? batch.microBatch : undefined,
      scratchHeldBack,
      modelBytes,
      mmprojBytes: vision.effectiveMmprojBytes,
      gguf: files.gguf,
      contextSize: kv.contextSize,
      cacheTypeK: kv.cacheTypeK,
      cacheTypeV: kv.cacheTypeV,
      mtpEnabled: spec.mtpEnabled,
      mtpHeadBytes: spec.mtpBranchHeadBytes,
      drafterBytes: spec.specDrafterBytes,
      draftN: spec.specDraftN || 0,
      flashAttnSupported: flags.flashAttn,
      kvOnHost: kv.kvOnHost,
      swaFull,
      draftCacheType: spec.draftCacheType,
    };
  }

  static noHeader({ files, spec }) {
    return {
      modelBytes: files.modelBytes,
      mmprojBytes: files.mmprojBytes,
      drafterBytes: spec.specDrafterBytes,
      mtpBranchBytes: spec.mtpBranchBytes,
    };
  }
}

module.exports = LaunchCostInput;
