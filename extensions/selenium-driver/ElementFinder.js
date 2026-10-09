const WebDriverError = require('./WebDriverError');
const ElementScripts = require('./ElementScripts');
const LlmSelectorFallback = require('./LlmSelectorFallback');

class ElementFinder {
  static AI_STRATEGY = 'ai-description';

  constructor(pageScript, fallbackService) {
    this._page = pageScript;
    this._fallback = fallbackService;
  }

  async findAll(session, body, scopeSelector = null) {
    const locator = await this._initialLocator(session, body);
    let count = await this._count(session, locator, scopeSelector, true);
    if (count === 0 && this._shouldRetry(session, body)) {
      count = await this._retryWithDescription(session, locator, body['lumabyte:description'], scopeSelector);
    }
    return this._register(session, locator, scopeSelector, count);
  }

  async count(session, locator, scopeSelector = null) {
    return this._count(session, locator, scopeSelector, false);
  }

  async _initialLocator(session, body) {
    if (!body.using || typeof body.value !== 'string') throw WebDriverError.invalidArgument('using and value are required');
    if (body.using !== ElementFinder.AI_STRATEGY) return { using: body.using, value: body.value };
    if (!session.llmFallback.enabled) {
      throw WebDriverError.unsupportedOperation('ai-description requires lumabyte:llmFallback.enabled=true');
    }
    const css = await LlmSelectorFallback.resolveDescription(this._fallback, session.tabId, body.value, 'find', null);
    if (!css) throw WebDriverError.noSuchElement('LLM could not resolve a selector for description');
    return { using: 'css selector', value: css };
  }

  async _count(session, locator, scopeSelector, strict) {
    const probe = await this._page.run(session.tabId, ElementScripts.finder({ ...locator, scopeSelector }));
    if (strict && probe && probe.ok === false && probe.reason === 'invalid-selector') {
      throw WebDriverError.invalidSelector(probe.message || 'invalid selector');
    }
    return probe && probe.ok ? probe.count : 0;
  }

  _shouldRetry(session, body) {
    return !!(body['lumabyte:description'] && session.llmFallback.enabled && session.llmFallback.onFindFail);
  }

  async _retryWithDescription(session, locator, description, scopeSelector) {
    const css = await LlmSelectorFallback.resolveDescription(this._fallback, session.tabId, description, 'find', locator.value);
    if (!css) return 0;
    locator.using = 'css selector';
    locator.value = css;
    return this._count(session, locator, scopeSelector, false);
  }

  _register(session, locator, scopeSelector, count) {
    const refs = [];
    for (let index = 0; index < count; index++) {
      refs.push(session.registerElement({
        using: locator.using,
        value: locator.value,
        scopeSelector,
        selector: ElementScripts.encode(locator.using, locator.value, scopeSelector, index),
      }));
    }
    return refs;
  }
}

module.exports = ElementFinder;
