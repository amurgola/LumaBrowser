class PromptCacheRam {
  static SETTING_KEY = 'core.llm.promptCacheRam';

  static MAX_MIB = 8192;

  static SHARE = 0.10;

  static SHARED_MAX_MIB = 2048;

  static SHARED_SHARE = 0.05;

  static SLOT_PROMPT_SIMILARITY = 0.1;

  static MIB = 1024 * 1024;

  static resolve({ setting, ramTotalBytes, weightsInRam, ramOversubscribed, ramPinned, hotswap, supported }) {
    if (!supported) return { mib: null, source: 'unsupported', reason: 'this build does not accept --cache-ram' };
    const raw = setting === undefined || setting === null ? 'auto' : setting;
    if (PromptCacheRam._isOff(raw)) return { mib: 0, source: 'off', reason: null };
    const user = PromptCacheRam._userSize(raw);
    if (user) return user;
    const claimed = PromptCacheRam._ramClaimed({ ramPinned, hotswap, ramOversubscribed });
    if (claimed) return { mib: 0, source: 'auto', reason: claimed };
    return PromptCacheRam._autoSize(Number(ramTotalBytes) || 0, weightsInRam);
  }

  static _isOff(raw) {
    return raw === 'off' || raw === false || raw === 0 || raw === '0';
  }

  static _userSize(raw) {
    if (raw === 'auto' || raw === true) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? { mib: Math.floor(n), source: 'user', reason: null } : null;
  }

  static _ramClaimed({ ramPinned, hotswap, ramOversubscribed }) {
    if (ramPinned) return 'the RAM pin holds the model weights in RAM';
    if (hotswap) return 'hotswap keeps every model warm in the page cache';
    if (ramOversubscribed) return 'the CPU-side expert pool already exceeds the comfortable RAM budget';
    return null;
  }

  static _autoSize(ram, weightsInRam) {
    if (ram <= 0) return { mib: null, source: 'default', reason: 'host RAM unknown' };
    if (weightsInRam) {
      return {
        mib: Math.max(0, Math.min(PromptCacheRam.SHARED_MAX_MIB, Math.floor((ram * PromptCacheRam.SHARED_SHARE) / PromptCacheRam.MIB))),
        source: 'auto', reason: 'part of the model already lives in RAM',
      };
    }
    return {
      mib: Math.max(0, Math.min(PromptCacheRam.MAX_MIB, Math.floor((ram * PromptCacheRam.SHARE) / PromptCacheRam.MIB))),
      source: 'auto', reason: null,
    };
  }
}

module.exports = PromptCacheRam;
