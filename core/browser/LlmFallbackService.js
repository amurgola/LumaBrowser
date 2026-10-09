const ResponseText = require('../llm-service/ResponseText');
const SelectorPrompt = require('./llm-fallback/SelectorPrompt');
const SelectorReplyParser = require('./llm-fallback/SelectorReplyParser');
const SelectorValidation = require('./llm-fallback/SelectorValidation');
const EmptyReplyDiagnostic = require('./llm-fallback/EmptyReplyDiagnostic');

class LlmFallbackService {
  static SLOT = 'selector-resolver';
  static SNAPSHOT_LIMIT = 80;
  static LOG_PREFIX = '[LlmFallback]';

  static debug = process.env.LLM_FALLBACK_DEBUG === '1' || process.env.LLM_FALLBACK_DEBUG === 'true';

  static _didDumpEmpty = false;

  constructor(llmService, tabManager) {
    this.llmService = llmService;
    this.tabManager = tabManager;
    this.resolutionCache = null;
    this._registerSlot();
  }

  isAvailable() {
    return this.llmService.getActiveProviderKey() !== 'none';
  }

  async tryDeterministicResolve(tabId, description) {
    if (!description || typeof description !== 'string') return { success: false };
    try {
      return await this.tabManager.findByAccessibleAttributes(tabId, description);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async validateSelector(tabId, selector) {
    if (!selector) return { ok: false, count: 0, error: 'empty selector' };
    try {
      const result = await this.tabManager.updateTab(tabId, { type: 'executeJs', payload: SelectorValidation.script(selector) });
      if (!result.success) return { ok: false, count: 0, error: result.error };
      return SelectorValidation.verdict(result.data?.result);
    } catch (err) {
      return { ok: false, count: 0, error: err.message };
    }
  }

  async snapshotFor(tabId) {
    try {
      const r = await this.tabManager.getInteractableElements(tabId, { limit: LlmFallbackService.SNAPSHOT_LIMIT });
      return r.success ? r.data : [];
    } catch (_) {
      return [];
    }
  }

  async resolveSelector(tabId, description, action, failedSelector, extra = {}) {
    if (!this.isAvailable()) return { success: false, error: 'No LLM provider configured' };
    const snapshot = extra.snapshot !== undefined ? extra.snapshot : await this.snapshotFor(tabId);
    const prompt = SelectorPrompt.build({ description, action, failedSelector, snapshot, feedbackContext: extra.feedbackContext || null });
    this._logStart(tabId, action, description, failedSelector, snapshot, extra.feedbackContext);
    const started = Date.now();
    const result = await this._complete(prompt);
    return this._selectorFromCompletion(tabId, result, Date.now() - started);
  }

  _registerSlot() {
    if (!this.llmService || typeof this.llmService.registerSlot !== 'function') return;
    this.llmService.registerSlot(LlmFallbackService.SLOT, {
      extensionId: 'core',
      label: 'Selector Resolver (fast, low-latency model recommended)',
      required: false,
    });
  }

  _complete(prompt) {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ];
    return this.llmService.sendCompletion(LlmFallbackService.SLOT, messages, { temperature: 0 });
  }

  _selectorFromCompletion(tabId, result, elapsedMs) {
    if (!result.success) {
      this._log(`resolveSelector LLM-error  tab=${tabId}  elapsed=${elapsedMs}ms  error=${result.error || 'unknown'}`);
      return { success: false, error: result.error || 'LLM completion failed' };
    }
    const text = ResponseText.extract(result.response);
    const selector = SelectorReplyParser.parse(text);
    this._logResponse(tabId, elapsedMs, text, selector, result.response);
    if (!selector) return { success: false, error: 'LLM returned no parsable selector' };
    return { success: true, selector };
  }

  _logStart(tabId, action, description, failedSelector, snapshot, feedbackContext) {
    this._log(`resolveSelector start  tab=${tabId}  action=${action}  desc=${JSON.stringify(description)}  failed=${JSON.stringify(failedSelector)}  snapshot_items=${Array.isArray(snapshot) ? snapshot.length : 0}  feedback=${feedbackContext ? JSON.stringify(feedbackContext) : 'none'}`);
  }

  _logResponse(tabId, elapsedMs, text, selector, response) {
    if (!LlmFallbackService.debug) return;
    const rawPreview = (text || '').slice(0, 240).replace(/\n/g, '\\n');
    this._log(`resolveSelector response  tab=${tabId}  elapsed=${elapsedMs}ms  raw=${JSON.stringify(rawPreview)}  parsed=${JSON.stringify(selector)}`);
    if (!text && response) this._logEmptyReply(response);
  }

  _logEmptyReply(response) {
    try {
      this._log(`empty-response diagnostic  ${JSON.stringify(EmptyReplyDiagnostic.summarize(response))}`);
      if (LlmFallbackService._didDumpEmpty) return;
      LlmFallbackService._didDumpEmpty = true;
      this._log(`empty-response FULL (one-shot):  ${EmptyReplyDiagnostic.fullDump(response)}`);
    } catch (diagErr) {
      this._log(`empty-response diagnostic failed: ${diagErr.message}`);
    }
  }

  _log(message) {
    if (LlmFallbackService.debug) console.log(`${LlmFallbackService.LOG_PREFIX} ${message}`);
  }
}

module.exports = LlmFallbackService;
