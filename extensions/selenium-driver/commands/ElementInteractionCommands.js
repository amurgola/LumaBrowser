const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const LlmSelectorFallback = require('../LlmSelectorFallback');

class ElementInteractionCommands extends WebDriverCommandGroup {
  static CLICK_BODY = `
      if (!el) return { ok: false, reason: 'stale' };
      try {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.click();
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: 'error', message: e.message };
      }`;

  static CLEAR_BODY = `
      if (!el) return { ok: false };
      if ('value' in el) el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };`;

  commandNames() {
    return ['elementClick', 'elementClear', 'elementSendKeys'];
  }

  async elementClick(session, params) {
    const entry = await this._elements.resolve(session, params['element id']);
    const result = await this._elements.evaluate(session, entry, ElementInteractionCommands.CLICK_BODY);
    if (result && result.ok) return null;
    if (result && result.reason === 'stale') throw WebDriverError.staleElementReference('element detached');
    if (await this._retryClickByDescription(session, entry)) return null;
    throw WebDriverError.elementClickIntercepted(result && result.message ? result.message : 'click failed');
  }

  async elementClear(session, params) {
    const result = await this._elements.read(session, params['element id'], ElementInteractionCommands.CLEAR_BODY);
    if (!result || !result.ok) throw WebDriverError.staleElementReference('element detached');
    return null;
  }

  async elementSendKeys(session, params, req) {
    const { text } = ElementInteractionCommands._body(req);
    if (typeof text !== 'string') throw WebDriverError.invalidArgument('text is required');
    const result = await this._elements.read(session, params['element id'], ElementInteractionCommands._sendKeysBody(text));
    if (!result || !result.ok) throw WebDriverError.staleElementReference('element detached');
    return null;
  }

  async _retryClickByDescription(session, entry) {
    const { enabled, onClickIntercepted } = session.llmFallback;
    if (!enabled || !onClickIntercepted || !entry.description) return false;
    const css = await LlmSelectorFallback.resolveDescription(this._tools.fallback, session.tabId, entry.description, 'click', entry.value);
    if (!css) return false;
    const retry = await this._browser.click(session.tabId, { selector: css });
    return !!(retry && retry.success);
  }

  static _sendKeysBody(text) {
    const literal = JSON.stringify(text);
    return `
      if (!el) return { ok: false };
      el.focus && el.focus();
      if ('value' in el) {
        el.value = (el.value || '') + ${literal};
      } else {
        el.textContent = (el.textContent || '') + ${literal};
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };`;
  }
}

module.exports = ElementInteractionCommands;
