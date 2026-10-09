class LaunchCostInput {
  static build({ files, kv, flags, spec, vision }, modelBytes, swaFull) {
    return {
      modelBytes,
      mmprojBytes: vision.effectiveMmprojBytes,
      gguf: files.gguf,
      contextSize: kv.contextSize,
      cacheTypeK: kv.cacheTypeK,
      cacheTypeV: kv.cacheTypeV,
      mtpEnabled: spec.mtpEnabled,
      mtpHeadBytes: spec.mtpBranchHeadBytes,
      drafterBytes: spec.specDrafterBytes,
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
