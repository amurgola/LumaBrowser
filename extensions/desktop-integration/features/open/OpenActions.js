const LinkUnwrap = require('./LinkUnwrap');
const SearchEngines = require('../../../../core/browser/SearchEngines');

class OpenActions {
  static MAX_URL = 8192;
  static MAX_QUERY = 2048;
  static MAX_PROMPT = 100000;

  constructor(deps) {
    this._deps = deps;
  }

  searchEngine() {
    const db = this._deps.services && this._deps.services.database;
    const engine = SearchEngines.byId(SearchEngines.currentId(db));
    return { id: engine.id, name: engine.name, url: engine.url };
  }

  searchUrl(query) {
    return SearchEngines.urlFor(this.searchEngine().id, query);
  }

  async openUrl(url, { unwrap = true, focus } = {}) {
    const raw = String(url == null ? '' : url).trim();
    if (!raw) return OpenActions._bad('url is required');
    if (raw.length > OpenActions.MAX_URL) return OpenActions._bad('url is too long');
    let target = raw;
    let unwrapped = null;
    if (unwrap && this._setting('unwrapLinks', true)) {
      unwrapped = LinkUnwrap.unwrap(raw);
      if (unwrapped.kind === 'invalid') return OpenActions._bad(unwrapped.error);
      if (unwrapped.kind === 'query' && this._setting('bingSearchesAsQuery', true)) {
        return this.search(unwrapped.query, { focus, from: raw });
      }
      target = unwrapped.url;
    } else if (!LinkUnwrap.isHttpUrl(raw)) {
      return OpenActions._bad('Only http and https links can be opened');
    } else {
      target = new URL(raw).href;
    }
    const opened = await this._openTab(target, focus);
    if (opened.status !== 200) return opened;
    const body = { ...opened.body, action: 'url', url: target };
    if (unwrapped && unwrapped.wrapped) body.from = raw;
    return { status: 200, body };
  }

  async search(query, { focus, from } = {}) {
    const text = String(query == null ? '' : query).trim();
    if (!text) return OpenActions._bad('query is required');
    if (text.length > OpenActions.MAX_QUERY) return OpenActions._bad('query is too long');
    const engine = this.searchEngine();
    const url = SearchEngines.urlFor(engine.id, text);
    const opened = await this._openTab(url, focus);
    if (opened.status !== 200) return opened;
    const body = { ...opened.body, action: 'query', query: text, url, engine: engine.id };
    if (from) body.from = from;
    return { status: 200, body };
  }

  async ask(prompt, { source } = {}) {
    const text = String(prompt == null ? '' : prompt).trim();
    if (!text) return OpenActions._bad('ask is required');
    if (text.length > OpenActions.MAX_PROMPT) return OpenActions._bad('ask is too long');
    const handoff = this._deps.handoff;
    if (!handoff || typeof handoff.open !== 'function') return OpenActions._fail(503, 'Chat handoff is not available');
    const result = await handoff.open({ prompt: text, autoSend: this._setting('askAutoSend', true), source });
    if (!result || !result.success) return OpenActions._fail(502, (result && result.error) || 'Chat handoff failed');
    return {
      status: 200,
      body: { success: true, action: 'ask', conversationId: result.conversationId || null, autoSent: !!result.autoSent },
    };
  }

  async _openTab(url, focus) {
    const browser = this._deps.browser;
    if (!browser || typeof browser.createTab !== 'function') return OpenActions._fail(503, 'The browser is not ready');
    let created;
    try {
      created = await browser.createTab(url, { kind: 'user' });
    } catch (err) {
      return OpenActions._fail(500, `Could not open a tab: ${err.message}`);
    }
    if (created && created.success === false) return OpenActions._fail(500, created.error || 'Could not open a tab');
    const tab = created && (created.tab || created);
    const shouldFocus = focus === undefined ? this._setting('focusWindow', true) : !!focus;
    const focused = shouldFocus && this._deps.windows ? !!this._deps.windows.focusMainWindow() : false;
    return { status: 200, body: { success: true, tabId: tab && tab.id != null ? tab.id : null, focused } };
  }

  _setting(key, fallback) {
    const settings = this._deps.settings;
    if (!settings || typeof settings.get !== 'function') return fallback;
    const value = settings.get(key, fallback);
    return value === undefined || value === null ? fallback : value;
  }

  static _bad(error) {
    return OpenActions._fail(400, error);
  }

  static _fail(status, error) {
    return { status, body: { success: false, error } };
  }
}

module.exports = OpenActions;
