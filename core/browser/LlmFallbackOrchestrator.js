class LlmFallbackOrchestrator {
  static MAX_ATTEMPTS = 2;

  static LOG_PREFIX = '[LlmFallback]';

  constructor(llmFallbackService, tabId, description, action, failedSelector, retryFn) {
    this._service = llmFallbackService;
    this._tabId = tabId;
    this._description = description;
    this._action = action;
    this._failedSelector = failedSelector;
    this._retryFn = retryFn;
    this._debug = !!(llmFallbackService && llmFallbackService.constructor && llmFallbackService.constructor.debug);
    this._cache = null;
    this._tried = new Set();
    this._feedbackContext = null;
  }

  static resolve(llmFallbackService, tabId, description, action, failedSelector, retryFn) {
    return new LlmFallbackOrchestrator(llmFallbackService, tabId, description, action, failedSelector, retryFn).execute();
  }

  async execute() {
    if (!this._description || !this._service) return null;
    this._log(`tryLlmFallback begin  tab=${this._tabId}  action=${this._action}  desc=${JSON.stringify(this._description)}`);
    return (await this._tryDeterministic())
      || (await this._tryCache())
      || (await this._tryLlm());
  }

  async _tryDeterministic() {
    const deterministic = await this._service.tryDeterministicResolve(this._tabId, this._description);
    if (!deterministic.success || !deterministic.selector) {
      this._log(`phase=deterministic  miss  reason=${deterministic.error || 'no match'}`);
      return null;
    }
    this._log(`phase=deterministic  hit  strategy=${deterministic.strategy}  selector=${JSON.stringify(deterministic.selector)}`);
    const ran = await this._retryFn(deterministic.selector);
    if (!LlmFallbackOrchestrator._succeeded(ran)) {
      this._log(`phase=deterministic  action=failed  error=${ran?.error || 'unknown'}  falling-through-to-llm`);
      return null;
    }
    this._log('phase=deterministic  action=ok  done');
    return { result: ran, resolvedSelector: deterministic.selector, strategy: `deterministic:${deterministic.strategy}` };
  }

  async _tryCache() {
    this._cache = this._enabledCache();
    if (!this._cache) return null;
    const hit = await this._cache.replay(this._service.tabManager, this._tabId, this._description, this._action, { pointCheck: false, requireExact: true });
    if (!hit) return null;
    const ran = await this._retryFn(hit.selector);
    if (!LlmFallbackOrchestrator._succeeded(ran)) {
      this._cache.noteMiss(hit.key, { hard: true, reason: ran?.error || 'action failed' });
      this._log(`phase=cache  action-failed  selector=${JSON.stringify(hit.selector)}  error=${ran?.error || 'unknown'}`);
      return null;
    }
    this._cache.noteHit(hit.key);
    this._log(`phase=cache  hit  selector=${JSON.stringify(hit.selector)}`);
    return { result: LlmFallbackOrchestrator._stampCached(ran), resolvedSelector: hit.selector, strategy: 'cache', resolvedBy: 'cache' };
  }

  async _tryLlm() {
    if (!this._service.isAvailable()) {
      this._log('phase=llm  skipped  reason=no-provider-configured');
      return null;
    }
    const context = await this._loadPageContext();
    for (let attempt = 1; attempt <= LlmFallbackOrchestrator.MAX_ATTEMPTS; attempt++) {
      const outcome = await this._attemptLlm(attempt, context);
      if (outcome) return outcome;
    }
    this._log(`tryLlmFallback give-up  tab=${this._tabId}  desc=${JSON.stringify(this._description)}`);
    return null;
  }

  async _loadPageContext() {
    const snapshot = await this._service.snapshotFor(this._tabId);
    this._log(`phase=llm  ctx  snapshot_items=${Array.isArray(snapshot) ? snapshot.length : 0}`);
    return { snapshot };
  }

  async _attemptLlm(attempt, { snapshot }) {
    const selector = await this._askForSelector(attempt, snapshot);
    if (!selector) return null;
    if (!(await this._validateSelector(attempt, selector))) return null;
    return this._runResolvedSelector(attempt, selector);
  }

  async _askForSelector(attempt, snapshot) {
    const resolution = await this._service.resolveSelector(
      this._tabId, this._description, this._action, this._failedSelector,
      { snapshot, feedbackContext: this._feedbackContext },
    );
    if (!resolution.success || !resolution.selector) {
      this._log(`phase=llm  attempt=${attempt}  llm-miss  error=${resolution.error || 'no selector'}`);
      this._feedbackContext = resolution.error || 'LLM returned no parsable selector';
      return null;
    }
    if (this._tried.has(resolution.selector)) {
      this._log(`phase=llm  attempt=${attempt}  repeated-selector  selector=${JSON.stringify(resolution.selector)}`);
      this._feedbackContext = `You already returned "${resolution.selector}" and it was rejected. Return a different selector.`;
      return null;
    }
    this._tried.add(resolution.selector);
    return resolution.selector;
  }

  async _validateSelector(attempt, selector) {
    const validation = await this._service.validateSelector(this._tabId, selector);
    if (validation.ok) return true;
    this._log(`phase=llm  attempt=${attempt}  validate-fail  selector=${JSON.stringify(selector)}  count=${validation.count}`);
    this._feedbackContext = validation.count === 0
      ? `Selector "${selector}" matched 0 elements in the DOM.`
      : `Selector "${selector}" matched ${validation.count} elements (ambiguous: must match exactly one visible element).`;
    return false;
  }

  async _runResolvedSelector(attempt, selector) {
    const captured = await this._captureForCache(selector);
    const ran = await this._retryFn(selector);
    if (!LlmFallbackOrchestrator._succeeded(ran)) {
      this._log(`phase=llm  attempt=${attempt}  action-failed  selector=${JSON.stringify(selector)}  error=${ran?.error || 'unknown'}`);
      this._feedbackContext = `Selector "${selector}" matched but the ${this._action} action failed: ${ran?.error || 'unknown error'}.`;
      return null;
    }
    this._log(`phase=llm  attempt=${attempt}  done  selector=${JSON.stringify(selector)}`);
    if (captured) this._cache.remember(this._description, this._action, captured, 'llm');
    return { result: ran, resolvedSelector: selector, strategy: `llm:attempt-${attempt}` };
  }

  async _captureForCache(selector) {
    if (!this._cache) return null;
    return this._cache.capture(this._service.tabManager, this._tabId, { selector }).catch(() => null);
  }

  _enabledCache() {
    const cache = this._service.resolutionCache;
    if (!cache || !this._service.tabManager) return null;
    return cache.isEnabled() ? cache : null;
  }

  _log(message) {
    if (this._debug) console.log(`${LlmFallbackOrchestrator.LOG_PREFIX} ${message}`);
  }

  static _succeeded(ran) {
    return !!(ran && ran.success);
  }

  static _stampCached(ran) {
    if (ran.data && typeof ran.data === 'object' && !Array.isArray(ran.data)) {
      return { ...ran, data: { ...ran.data, resolvedBy: 'cache' } };
    }
    return { ...ran, resolvedBy: 'cache' };
  }
}

module.exports = LlmFallbackOrchestrator;
