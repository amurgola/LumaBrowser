const TabErrorPage = require('./TabErrorPage');
const TabHistory = require('./TabHistory');
const HiddenTabState = require('./HiddenTabState');
const PermissionManager = require('../PermissionManager');
const FaviconCache = require('../FaviconCache');

class TabLoadEvents {
  static HISTORY_LIMIT = 50;

  constructor({ channel, zoom, persisted, emitter }) {
    this._channel = channel;
    this._zoom = zoom;
    this._persisted = persisted;
    this._emitter = emitter;
  }

  wire(entry) {
    const wc = entry.webContents;
    wc.on('did-start-loading', () => this._onStartLoading(entry));
    wc.on('did-start-navigation', (...args) => entry.applyNavEvent('start', TabLoadEvents._navigationFacts(...args)));
    wc.on('did-redirect-navigation', (...args) => entry.applyNavEvent('redirect', TabLoadEvents._navigationFacts(...args)));
    wc.on('did-finish-load', () => this._onSettled(entry, 'finish'));
    wc.on('did-stop-loading', () => this._onSettled(entry, 'stop'));
    wc.on('did-navigate', (_event, url, httpResponseCode) => this._onCommit(entry, url, httpResponseCode));
    wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) =>
      this._onFail(entry, { errorCode, errorDescription, validatedURL, isMainFrame }));
    wc.on('did-navigate-in-page', (_event, url, isMainFrame) => this._onInPage(entry, url, isMainFrame));
    wc.on('page-title-updated', (_event, title) => this._onTitle(entry, title));
  }

  static _navigationFacts(event, url, isInPlace, isMainFrame) {
    const d = event && typeof event === 'object' && typeof event.url === 'string' ? event : {};
    return {
      url: typeof d.url === 'string' ? d.url : url,
      isSameDocument: typeof d.isSameDocument === 'boolean' ? d.isSameDocument : !!isInPlace,
      isMainFrame: typeof d.isMainFrame === 'boolean' ? d.isMainFrame : (isMainFrame !== false),
    };
  }

  static _isLoading(wc) {
    try { return !!(wc && !wc.isDestroyed() && typeof wc.isLoading === 'function' && wc.isLoading()); } catch (_) { return false; }
  }

  _onStartLoading(entry) {
    entry.loading = true;
    this._channel.broadcast(entry);
  }

  _onSettled(entry, kind) {
    if (!entry.applyNavEvent(kind, { isLoading: TabLoadEvents._isLoading(entry.webContents) }).apply) return;
    entry.loading = false;
    TabHistory.refreshButtons(entry);
    this._channel.broadcast(entry);
    if (entry.hidden) HiddenTabState.syncPriority(entry);
  }

  _onCommit(entry, url, httpResponseCode) {
    entry.applyNavEvent('commit', { url });
    TabLoadEvents._tellPermissions(entry, url);
    entry.lastHttpStatus = typeof httpResponseCode === 'number' && httpResponseCode > 0 ? httpResponseCode : null;
    const displayUrl = TabLoadEvents._takeDisplayUrl(entry, url);
    if (TabErrorPage.isErrorPage(url)) this._commitErrorPage(entry, url);
    else this._commitPage(entry, displayUrl);
  }

  static _tellPermissions(entry, url) {
    const pm = PermissionManager.current();
    if (pm) pm.onTabNavigated(entry.id, url);
  }

  static _takeDisplayUrl(entry, url) {
    if (!entry._renderedSourceUrl) return url;
    const source = entry._renderedSourceUrl;
    entry._renderedSourceUrl = null;
    return source;
  }

  _commitErrorPage(entry, url) {
    entry._errorPageFor = TabErrorPage.targetOf(url) || entry.url;
    entry.url = entry._errorPageFor;
    entry.favicon = null;
    TabHistory.refreshButtons(entry);
    this._channel.broadcast(entry);
  }

  _commitPage(entry, displayUrl) {
    entry._errorPageFor = null;
    if (FaviconCache.hostOf(entry.url) !== FaviconCache.hostOf(displayUrl)) entry.favicon = null;
    entry.url = displayUrl;
    entry.lastNavigatedAt = Date.now();
    TabLoadEvents._recordVisit(entry, displayUrl);
    this._zoom.applyStored(entry, displayUrl);
    TabHistory.refreshButtons(entry);
    this._channel.broadcast(entry);
    this._emitter.emit('tabNavigated', entry.id, displayUrl);
    if (entry.keepAlive) this._persisted.save();
  }

  static _recordVisit(entry, url) {
    entry.history.push({ url, title: entry.title, visitedAt: Date.now() });
    if (entry.history.length > TabLoadEvents.HISTORY_LIMIT) entry.history.shift();
  }

  _onFail(entry, { errorCode, errorDescription, validatedURL, isMainFrame }) {
    const decision = entry.applyNavEvent('fail', { url: validatedURL, errorCode, isMainFrame });
    if (!decision.apply || entry.isInternal() || entry.silent) return;
    const target = validatedURL || entry.url;
    if (TabErrorPage.isErrorPage(target)) return;
    TabErrorPage.show(entry, { code: errorCode, desc: errorDescription || '', url: target, gen: decision.gen });
  }

  _onInPage(entry, url, isMainFrame) {
    if (!entry.applyNavEvent('inPage', { url, isMainFrame }).apply) return;
    entry.url = url;
    entry.lastNavigatedAt = Date.now();
    TabHistory.refreshButtons(entry);
    this._channel.broadcast(entry);
    this._emitter.emit('tabNavigated', entry.id, url);
  }

  _onTitle(entry, title) {
    if (!entry.applyNavEvent('title', {}).apply) return;
    entry.title = title;
    this._channel.broadcast(entry);
    this._emitter.emit('tabTitleUpdated', entry.id, title);
    if (entry.keepAlive) this._persisted.save();
  }
}

module.exports = TabLoadEvents;
