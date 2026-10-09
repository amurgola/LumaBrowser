const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const ElementScripts = require('../ElementScripts');
const LlmSelectorFallback = require('../LlmSelectorFallback');

class LumabyteCommands extends WebDriverCommandGroup {
  static CDP_PROTOCOL_VERSION = '1.3';

  commandNames() {
    return ['lumabyteFind', 'lumabyteClick', 'lumabyteDomSnapshot', 'lumabyteCdpExecute', 'googCdpExecute'];
  }

  async lumabyteFind(session, _params, req) {
    const body = LumabyteCommands._requireDescription(session, req);
    const css = await this._resolve(session, body.description, body.action || 'find', body.hintSelector || null);
    const locator = { using: 'css selector', value: css };
    if (await this._tools.finder.count(session, locator) === 0) throw WebDriverError.noSuchElement('resolved selector matched 0 elements');
    return session.registerElement({
      ...locator, scopeSelector: null, description: body.description, selector: ElementScripts.encode(locator.using, css, null, 0),
    });
  }

  async lumabyteClick(session, _params, req) {
    const body = LumabyteCommands._requireDescription(session, req);
    if (body.selector) {
      const direct = await this._browser.click(session.tabId, { selector: body.selector, text: body.text });
      if (direct && direct.success) return LumabyteCommands._clicked(direct, body.selector, 'selector');
    }
    const css = await this._resolve(session, body.description, 'click', body.selector || null);
    const res = await this._browser.click(session.tabId, { selector: css, text: body.text });
    if (!res || !res.success) throw WebDriverError.elementClickIntercepted((res && res.error) || 'click failed');
    return LumabyteCommands._clicked(res, css, 'description');
  }

  async lumabyteDomSnapshot(session, _params, req) {
    const body = LumabyteCommands._body(req);
    const sourceType = typeof body.sourceType === 'string' ? body.sourceType : 'structured';
    const source = await this._browser.getSource(session.tabId, { type: sourceType });
    if (!source.success) throw WebDriverError.unknownError(source.error || 'source failed');
    const out = { url: await this._page.url(session.tabId), title: await this._page.title(session.tabId), source: source.source };
    if (body.includeScreenshot) out.screenshot = await this._tools.screenshots.capture(session.tabId).catch(() => null);
    return out;
  }

  async lumabyteCdpExecute(session, _params, req) {
    const body = LumabyteCommands._body(req);
    if (!body.cmd) throw WebDriverError.invalidArgument('cmd required');
    const wc = this._webContentsFor(session.tabId);
    try {
      if (!wc.debugger.isAttached()) wc.debugger.attach(LumabyteCommands.CDP_PROTOCOL_VERSION);
      return { result: await wc.debugger.sendCommand(body.cmd, body.params || {}) };
    } catch (err) {
      throw WebDriverError.javascriptError(err.message || 'CDP command failed');
    }
  }

  async googCdpExecute(session, params, req) {
    return this.lumabyteCdpExecute(session, params, req);
  }

  async _resolve(session, description, action, failedSelector) {
    const css = await LlmSelectorFallback.resolveDescription(this._tools.fallback, session.tabId, description, action, failedSelector);
    if (!css) throw WebDriverError.noSuchElement('LLM could not resolve a selector');
    return css;
  }

  _webContentsFor(tabId) {
    const tabManager = this._browser.getTabManager ? this._browser.getTabManager() : null;
    const tabViewManager = tabManager && tabManager.tabViewManager;
    const entry = tabViewManager && tabViewManager.getEntry ? tabViewManager.getEntry(tabId) : null;
    if (!entry || !entry.webContents) throw WebDriverError.noSuchWindow('no webContents for tab');
    return entry.webContents;
  }

  static _requireDescription(session, req) {
    const body = LumabyteCommands._body(req);
    if (!body.description) throw WebDriverError.invalidArgument('description required');
    if (!session.llmFallback.enabled) throw WebDriverError.unsupportedOperation('lumabyte:llmFallback.enabled=false');
    return body;
  }

  static _clicked(res, resolvedSelector, resolvedVia) {
    return { ok: true, url: res.url || null, resolvedSelector, resolvedVia };
  }
}

module.exports = LumabyteCommands;
