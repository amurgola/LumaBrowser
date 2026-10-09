const Accelerators = require('../Accelerators');
const TabErrorPage = require('./TabErrorPage');
const TabConsoleLog = require('./TabConsoleLog');

class TabPageEvents {
  static NEUTRALIZE_APP_REGION_CSS = '* { -webkit-app-region: no-drag !important; }';
  static CRASH_RETRY_WINDOW_MS = 10 * 1000;
  static CRASH_RELOAD_DELAY_MS = 250;
  static USABLE_FAVICON = /^(https?:\/\/|data:image\/)/i;

  constructor({ registry, channel, faviconCache = null, performAccelerator }) {
    this._registry = registry;
    this._channel = channel;
    this._faviconCache = faviconCache;
    this._performAccelerator = performAccelerator;
  }

  wire(entry) {
    const wc = entry.webContents;
    wc.on('dom-ready', () => TabPageEvents._neutralizeDragRegions(wc));
    wc.on('render-process-gone', (_event, details) => this._onRendererGone(entry, details));
    if (!entry.silent) wc.on('before-input-event', (event, input) => this._onInput(entry, event, input));
    wc.on('found-in-page', (_event, result) => this._onFound(entry, result));
    wc.on('page-favicon-updated', (_event, favicons) => this._onFavicon(entry, favicons));
    wc.on('console-message', (details) => TabPageEvents._onConsole(entry, details));
  }

  static _neutralizeDragRegions(wc) {
    wc.insertCSS(TabPageEvents.NEUTRALIZE_APP_REGION_CSS).catch(() => {});
  }

  _onRendererGone(entry, details) {
    if (details && details.reason === 'clean-exit') return;
    if (entry.isInternal() || entry.silent || entry.keepAlive) return;
    const now = Date.now();
    const again = now - (entry._crashedAt || 0) < TabPageEvents.CRASH_RETRY_WINDOW_MS;
    entry._crashedAt = now;
    if (again) TabErrorPage.show(entry, { code: 0, desc: 'CRASHED', url: entry.url });
    else TabPageEvents._reloadSoon(entry.webContents);
  }

  static _reloadSoon(wc) {
    setTimeout(() => {
      try { if (!wc.isDestroyed()) wc.reload(); } catch (_) {}
    }, TabPageEvents.CRASH_RELOAD_DELAY_MS);
  }

  _onInput(entry, event, input) {
    const action = Accelerators.match(input, { loading: entry.loading });
    if (!action) return;
    event.preventDefault();
    if (Accelerators.MAIN_HANDLED.has(action)) this._performAccelerator(entry, action);
    this._channel.send('tab-view:accelerator', { action, tabId: entry.id });
  }

  _onFound(entry, result) {
    this._channel.send('tab-view:found-in-page', {
      tabId: entry.id,
      requestId: result && result.requestId,
      activeMatchOrdinal: result ? result.activeMatchOrdinal : 0,
      matches: result ? result.matches : 0,
      finalUpdate: !!(result && result.finalUpdate),
    });
  }

  _onFavicon(entry, favicons) {
    const first = (favicons && favicons[0]) || null;
    entry.favicon = first && TabPageEvents.USABLE_FAVICON.test(first) ? first : null;
    this._channel.broadcast(entry);
    if (this._faviconCache && entry.favicon && entry.isRegularBrowsing()) this._cacheFavicon(entry);
  }

  _cacheFavicon(entry) {
    this._faviconCache.record(entry.url, entry.favicon).then((dataUrl) => {
      if (dataUrl && this._registry.get(entry.id) === entry) this._channel.broadcast(entry);
    }).catch(() => {});
  }

  static _onConsole(entry, { level, message, lineNumber, sourceId }) {
    if (entry.hidden) return;
    TabConsoleLog.add(entry, level === 'debug' ? 'verbose' : level, message, sourceId, lineNumber);
  }
}

module.exports = TabPageEvents;
