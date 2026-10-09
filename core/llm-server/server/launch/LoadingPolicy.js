const PromptCacheRam = require('./PromptCacheRam');

class LoadingPolicy {
  static MOE_RAM_FIT_FRACTION = 0.7;

  static PIN_TRANSIENT_SLACK_BYTES = 1024 * 1024 * 1024;

  static resolve(state) {
    const policy = { ramTotalBytes: LoadingPolicy._ramTotal(state.diagnostics) };
    LoadingPolicy._decideMmap(policy, state);
    LoadingPolicy._spellNoMmap(policy, state.flags);
    LoadingPolicy._sizePromptCache(policy, state);
    return policy;
  }

  static _ramTotal(diagnostics) {
    return Number(diagnostics && diagnostics.memory && diagnostics.memory.totalBytes) || 0;
  }

  static _decideMmap(policy, { overrides, moe, offload }) {
    policy.moeNeedsMmap = moe.cpuMoeEnabled
      && (policy.ramTotalBytes <= 0 || moe.cpuPoolBytes > policy.ramTotalBytes * LoadingPolicy.MOE_RAM_FIT_FRACTION);
    const pin = overrides.ramPin;
    const pinNoMmapOk = !!pin && offload.fullOffload && !moe.cpuMoeEnabled
      && (Number(pin.freeBytes) || 0) >= moe.budgetWeightsBytes + LoadingPolicy.PIN_TRANSIENT_SLACK_BYTES;
    policy.ramPinned = !!pin;
    policy.useMmap = !!overrides.useMmap || policy.moeNeedsMmap || (!!pin && !pinNoMmapOk);
  }

  static _spellNoMmap(policy, flags) {
    policy.loadModeArgs = [];
    policy.loadModeFlag = null;
    if (policy.useMmap) return;
    if (flags.loadMode) {
      policy.loadModeArgs = ['--load-mode', 'none'];
      policy.loadModeFlag = '--load-mode none';
    } else if (flags.noMmap) {
      policy.loadModeArgs = ['--no-mmap'];
      policy.loadModeFlag = '--no-mmap';
    }
  }

  static _sizePromptCache(policy, { overrides, flags, moe, offload, slots }) {
    policy.promptCacheRam = PromptCacheRam.resolve({
      setting: overrides.promptCacheRam,
      ramTotalBytes: policy.ramTotalBytes,
      weightsInRam: !offload.fullOffload || moe.cpuMoeEnabled,
      ramOversubscribed: policy.moeNeedsMmap,
      ramPinned: policy.ramPinned,
      hotswap: !!overrides.useMmap,
      supported: flags.cacheRam,
    });
    policy.slotSimilarityEnabled = slots.parallelEnabled && flags.slotSimilarity;
  }
}

module.exports = LoadingPolicy;
