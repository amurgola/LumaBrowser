const CoreRequire = require('../../CoreRequire');

const ToolOutputTruncator = CoreRequire.load('llm-server/chat/ToolOutputTruncator');
const ContextBudget = CoreRequire.load('shared/llm/ContextBudget');

class ReadBudget {
  static BYTES_PER_TOKEN = 4;
  static WHOLE_FRACTION = 0.8;
  static UNKNOWN_WHOLE_FILE_BYTES = 32 * 1024;
  static MIN_CTX_PER_SLOT = 256;

  static _logged = false;

  static compute(service = global.__lumaLlmServerService) {
    const window = ReadBudget._window(service);
    if (!window.ctxTokens && window.perSlot == null) return ReadBudget._unknown();
    const ctxPerSlot = window.perSlot != null
      ? Math.max(ReadBudget.MIN_CTX_PER_SLOT, window.perSlot)
      : Math.max(ReadBudget.MIN_CTX_PER_SLOT, Math.floor(window.ctxTokens / window.slots));
    const truncator = ToolOutputTruncator.forSlotBudget(ctxPerSlot);
    const wholeFileMaxBytes = Math.floor(ctxPerSlot * ReadBudget.WHOLE_FRACTION * ReadBudget.BYTES_PER_TOKEN);
    ReadBudget._logOnce(() => `[game-mode] read budget: source=${window.perSlot != null ? 'plan' : 'defaults'} `
      + `contextSize=${window.ctxTokens || ctxPerSlot * window.slots} slots=${window.slots} ctxPerSlot=${ctxPerSlot}tok`
      + ` → chunk cap=${truncator.maxBytes}B, whole-file cap=${wholeFileMaxBytes}B (~${Math.round(wholeFileMaxBytes / 1024)}KB)`);
    return { truncator, wholeFileMaxBytes, ctxPerSlot };
  }

  static wholeReadChars(ctxPerSlot, chunkMaxBytes) {
    const floor = Number(chunkMaxBytes) > 0 ? Number(chunkMaxBytes) : 8 * 1024;
    const n = Number(ctxPerSlot);
    if (!Number.isFinite(n) || n <= 0) return floor;
    return Math.max(floor, ContextBudget.resolveBudget({ ctxPerSlot: n }).toolHistoryChars);
  }

  static _window(service) {
    const window = { ctxTokens: null, slots: 1, perSlot: null };
    try {
      if (service && typeof service.getEffectiveContext === 'function') ReadBudget._fromPlan(window, service.getEffectiveContext());
      if (window.perSlot == null) ReadBudget._fromDefaults(window, service);
    } catch (_) {}
    return window;
  }

  static _fromPlan(window, eff) {
    const perSlot = Number(eff && eff.ctxPerSlot);
    if (Number.isFinite(perSlot) && perSlot > 0) window.perSlot = Math.floor(perSlot);
    const slots = Number(eff && eff.slots);
    if (Number.isFinite(slots) && slots >= 1) window.slots = Math.floor(slots);
  }

  static _fromDefaults(window, service) {
    const defaults = (service && typeof service.getDefaults === 'function' && service.getDefaults()) || {};
    const ctx = Number(defaults.contextSize);
    if (Number.isFinite(ctx) && ctx > 0) window.ctxTokens = ctx;
    const slots = Number(defaults.maxConcurrent);
    if (Number.isFinite(slots) && slots >= 1) window.slots = Math.floor(slots);
  }

  static _unknown() {
    ReadBudget._logOnce(() => '[game-mode] read budget: server context size unknown, default chunk cap, 32KB whole-file cap');
    return { truncator: new ToolOutputTruncator(), wholeFileMaxBytes: ReadBudget.UNKNOWN_WHOLE_FILE_BYTES };
  }

  static _logOnce(message) {
    if (ReadBudget._logged) return;
    ReadBudget._logged = true;
    console.log(message());
  }
}

module.exports = ReadBudget;
