const CoreRequire = require('../../CoreRequire');

const ToolOutputTruncator = CoreRequire.require('llm-server/chat/ToolOutputTruncator');
const ExtensionGlobals = CoreRequire.require('shell/extensions/ExtensionGlobals');

class ReadBudget {
  static BYTES_PER_TOKEN = 4;
  static WHOLE_FRACTION = 0.8;
  static DEFAULT_WHOLE_FILE_MAX_BYTES = 32 * 1024;
  static MIN_CTX_PER_SLOT = 256;
  static _logged = false;

  static compute(service = ExtensionGlobals.llmServerService()) {
    const window = ReadBudget._window(service);
    if (window.perSlot == null && !window.ctxTokens) return ReadBudget._defaults();
    const ctxPerSlot = window.perSlot != null
      ? Math.max(ReadBudget.MIN_CTX_PER_SLOT, window.perSlot)
      : Math.max(ReadBudget.MIN_CTX_PER_SLOT, Math.floor(window.ctxTokens / window.slots));
    const truncator = ToolOutputTruncator.forSlotBudget(ctxPerSlot);
    const wholeFileMaxBytes = Math.floor(ctxPerSlot * ReadBudget.WHOLE_FRACTION * ReadBudget.BYTES_PER_TOKEN);
    ReadBudget._logOnce(() => `[code-mode] read budget: source=${window.perSlot != null ? 'plan' : 'defaults'} `
      + `contextSize=${window.ctxTokens || ctxPerSlot * window.slots} slots=${window.slots} ctxPerSlot=${ctxPerSlot}tok`
      + ` → chunk cap=${truncator.maxBytes}B, whole-file cap=${wholeFileMaxBytes}B (~${Math.round(wholeFileMaxBytes / 1024)}KB)`);
    return { truncator, wholeFileMaxBytes, ctxPerSlot };
  }

  static _window(service) {
    const window = { ctxTokens: null, slots: 1, perSlot: null };
    try {
      ReadBudget._readPlan(service, window);
      if (window.perSlot == null) ReadBudget._readDefaults(service, window);
    } catch (_) {}
    return window;
  }

  static _readPlan(service, window) {
    if (!service || typeof service.getEffectiveContext !== 'function') return;
    const eff = service.getEffectiveContext();
    const perSlot = Number(eff && eff.ctxPerSlot);
    if (Number.isFinite(perSlot) && perSlot > 0) window.perSlot = Math.floor(perSlot);
    const slots = Number(eff && eff.slots);
    if (Number.isFinite(slots) && slots >= 1) window.slots = Math.floor(slots);
  }

  static _readDefaults(service, window) {
    const defaults = (service && typeof service.getDefaults === 'function' && service.getDefaults()) || {};
    const ctx = Number(defaults.contextSize);
    if (Number.isFinite(ctx) && ctx > 0) window.ctxTokens = ctx;
    const slots = Number(defaults.maxConcurrent);
    if (Number.isFinite(slots) && slots >= 1) window.slots = Math.floor(slots);
  }

  static _defaults() {
    ReadBudget._logOnce(() => '[code-mode] read budget: server context size unknown; default chunk cap, 32KB whole-file cap');
    return { truncator: new ToolOutputTruncator(), wholeFileMaxBytes: ReadBudget.DEFAULT_WHOLE_FILE_MAX_BYTES };
  }

  static _logOnce(line) {
    if (ReadBudget._logged) return;
    ReadBudget._logged = true;
    console.log(line());
  }
}

module.exports = ReadBudget;
