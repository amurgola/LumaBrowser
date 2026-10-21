const SelectorValidation = require('../../../core/browser/llm-fallback/SelectorValidation');
const ReaderScripts = require('./ReaderScripts');
const RunLog = require('./RunLog');

class ReaderResolver {
  static KINDS = new Set(ReaderScripts.KINDS);
  static LLM_ATTEMPTS = 2;

  constructor({ browser, service = null, logger = console }) {
    this._browser = browser;
    this._service = service;
    this._logger = logger;
  }

  async run(spec) {
    let primaryResult = null;
    if (spec.selector) {
      primaryResult = await spec.primary(spec.selector);
      if (primaryResult && primaryResult.success) return ReaderResolver._success(RunLog.VIA_PRIMARY, primaryResult, null);
    }
    if (!spec.description) return ReaderResolver._failure(primaryResult, false);
    const via = spec.selector ? RunLog.VIA_RECOVERED : RunLog.VIA_DIRECT;
    const probe = await this._probe(spec);
    if (probe.match) {
      const ran = await spec.primary(probe.match.selector);
      if (ReaderResolver._usable(spec.step, ran)) return ReaderResolver._success(via, ran, probe.match.selector, `reader:${probe.match.strategy}`);
    }
    if (!spec.allowLlm || !this._service || !this._service.isAvailable()) return ReaderResolver._failure(primaryResult, true);
    return this._llm(spec, probe.candidates, primaryResult, via);
  }

  async _probe(spec) {
    try {
      const reply = await this._browser.executeJs(spec.tabId, ReaderScripts.probe(spec.step.kind, spec.description, spec.step.childSelectors || null));
      const result = reply && reply.success && reply.data ? reply.data.result : null;
      if (!result || !result.success) return { match: null, candidates: [] };
      return { match: result.match || null, candidates: Array.isArray(result.candidates) ? result.candidates : [] };
    } catch (err) {
      this._logger.warn(`site-apis: reader probe failed: ${err.message}`);
      return { match: null, candidates: [] };
    }
  }

  async _llm(spec, candidates, primaryResult, via) {
    let feedback = null;
    const tried = new Set();
    for (let attempt = 1; attempt <= ReaderResolver.LLM_ATTEMPTS; attempt += 1) {
      const resolution = await this._service.resolveSelector(spec.tabId, spec.description, spec.action, spec.selector || null, { snapshot: candidates, feedbackContext: feedback });
      const selector = resolution && resolution.success ? resolution.selector : null;
      if (!selector) { feedback = (resolution && resolution.error) || 'no selector was returned'; continue; }
      if (tried.has(selector)) { feedback = `You already returned "${selector}" and it was rejected. Return a different selector.`; continue; }
      tried.add(selector);
      const rejection = await this._reject(spec, selector);
      if (rejection) { feedback = rejection; continue; }
      const ran = await spec.primary(selector);
      if (ReaderResolver._usable(spec.step, ran)) return ReaderResolver._success(via, ran, selector, `llm:attempt-${attempt}`);
      feedback = `Selector "${selector}" matched but reading it failed: ${(ran && ran.error) || 'nothing readable'}.`;
    }
    return ReaderResolver._failure(primaryResult, true);
  }

  async _reject(spec, selector) {
    if (spec.step.kind !== 'read') return null;
    try {
      const reply = await this._browser.executeJs(spec.tabId, SelectorValidation.script(selector));
      const verdict = SelectorValidation.verdict(reply && reply.success && reply.data ? reply.data.result : null);
      if (verdict.ok) return null;
      return verdict.count === 0 ? `Selector "${selector}" matched 0 elements.` : `Selector "${selector}" matched ${verdict.count} elements (must match exactly one).`;
    } catch (err) {
      return `Selector "${selector}" could not be checked: ${err.message}`;
    }
  }

  static _usable(step, ran) {
    if (!ran || !ran.success) return false;
    if (step.kind !== 'read') return true;
    const values = ran.data && Array.isArray(ran.data.values) ? ran.data.values : [];
    return values.some((value) => value != null && String(value).trim() !== '');
  }

  static _success(via, result, resolvedSelector, strategy = null) {
    return { ok: true, via, result, resolvedSelector, attempted: via !== RunLog.VIA_PRIMARY, strategy };
  }

  static _failure(result, attempted) {
    return { ok: false, via: null, result, resolvedSelector: null, attempted, strategy: null };
  }
}

module.exports = ReaderResolver;
