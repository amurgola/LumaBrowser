const LlmFallbackOrchestrator = require('../LlmFallbackOrchestrator');

class SelectorFallback {
  static VIA_PRIMARY = 'primary';
  static VIA_DIRECT = 'direct';
  static VIA_RECOVERED = 'recovered';

  static async run(spec) {
    if (SelectorFallback._resolvesDirectly(spec)) return SelectorFallback._direct(spec);
    const primary = await spec.primary();
    if (primary && primary.success) return SelectorFallback._success(SelectorFallback.VIA_PRIMARY, primary);
    return SelectorFallback._recover(spec, primary);
  }

  static async _recover(spec, primary) {
    if (!SelectorFallback._mayRecover(spec)) return SelectorFallback._failure(primary, false);
    const resolved = await SelectorFallback._resolve(spec, spec.selector || null);
    if (!resolved) return SelectorFallback._failure(primary, true);
    return SelectorFallback._success(SelectorFallback.VIA_RECOVERED, resolved.result, resolved.resolvedSelector);
  }

  static _resolvesDirectly(spec) {
    return !spec.selector && !!spec.description && !spec.needsSelector && !spec.primaryFirst;
  }

  static _mayRecover(spec) {
    return !!spec.description && (!!spec.selector || !spec.needsSelector);
  }

  static async _direct(spec) {
    const resolved = await SelectorFallback._resolve(spec, null);
    if (!resolved) return SelectorFallback._failure(null, true);
    return SelectorFallback._success(SelectorFallback.VIA_DIRECT, resolved.result, resolved.resolvedSelector);
  }

  static _resolve(spec, failedSelector) {
    return LlmFallbackOrchestrator.resolve(spec.service, spec.tabId, spec.description, spec.action, failedSelector, spec.retry);
  }

  static _success(via, result, resolvedSelector = null) {
    return { ok: true, via, result, resolvedSelector, attempted: via !== SelectorFallback.VIA_PRIMARY };
  }

  static _failure(result, attempted) {
    return { ok: false, via: null, result, resolvedSelector: null, attempted };
  }
}

module.exports = SelectorFallback;
