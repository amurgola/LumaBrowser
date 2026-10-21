const SelectorFallback = require('../../../core/browser/controller/SelectorFallback');
const ParamTemplate = require('../spec/ParamTemplate');
const ReaderResolver = require('./ReaderResolver');
const RunLog = require('./RunLog');

class TargetResolver {
  constructor({ store, browser = null, service = null, endpointId, steps, log, allowLlmFallback = true, logger = console }) {
    this._store = store;
    this._service = service;
    this._endpointId = endpointId;
    this._steps = steps;
    this._log = log;
    this._allow = allowLlmFallback;
    this._logger = logger;
    this._reader = new ReaderResolver({ browser, service, logger });
  }

  async resolve({ tabId, index, step, action, primary, stillWanted = () => true }) {
    const started = Date.now();
    let primaryDone = null;
    const timed = async (selector) => {
      const reply = await primary(selector);
      if (primaryDone == null) primaryDone = Date.now();
      return reply;
    };
    const outcome = ReaderResolver.KINDS.has(step.kind) ? await this._reader.run({
      tabId, step, action, selector: step.selector || null, description: step.description || null, allowLlm: this._allow && !!this._service, primary: timed,
    }) : await SelectorFallback.run({
      service: this._service, tabId, action, selector: step.selector || null, description: this._allow && this._service ? (step.description || null) : null,
      needsSelector: false, primaryFirst: false, primary: () => timed(step.selector), retry: timed,
    });
    const recoveryMs = outcome.attempted ? Math.max(0, Date.now() - (primaryDone || started)) : null;
    if (!outcome.ok) return { ok: false, result: outcome.result, via: null, error: TargetResolver._errorOf(outcome, step), recoveryMs };
    if (outcome.resolvedSelector && outcome.resolvedSelector !== step.selector) this._heal(index, outcome.resolvedSelector, stillWanted);
    return { ok: true, result: outcome.result, via: outcome.via || RunLog.VIA_PRIMARY, error: null, recoveryMs };
  }

  _heal(index, selector, stillWanted) {
    const stored = this._steps[index];
    if (!stored) return;
    if (!stillWanted()) {
      this._logger.log(`site-apis: step ${index + 1} resolved to "${selector}" after the step was abandoned; not saved`);
      return;
    }
    if (stored.selector && ParamTemplate.referenced(stored.selector).size) {
      this._logger.log(`site-apis: step ${index + 1} resolved to "${selector}" but its selector holds a param; not saved`);
      return;
    }
    stored.selector = selector;
    this._log.heal(index, selector);
    try {
      this._store.updateEndpoint(this._endpointId, { steps: this._steps });
    } catch (err) {
      this._logger.warn(`site-apis: could not save the healed selector for step ${index + 1}: ${err.message}`);
    }
  }

  static _errorOf(outcome, step) {
    const primary = outcome.result && outcome.result.error ? outcome.result.error : null;
    if (primary && outcome.attempted) return `${primary} (recovery from "${step.description}" found nothing)`;
    if (primary) return primary;
    if (!step.selector && !outcome.attempted) return 'the step has no selector and recovery is unavailable';
    return `no element matched "${step.description || step.selector}"`;
  }
}

module.exports = TargetResolver;
