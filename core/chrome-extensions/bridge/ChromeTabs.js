const EventEmitter = require('events');
const electron = require('electron');
const ChromeTab = require('./ChromeTab');
const ExtensionTabAccess = require('./ExtensionTabAccess');
const MatchPattern = require('./MatchPattern');

class ChromeTabs extends EventEmitter {
  static BOUND_FLAG = '_lumaChromeTabsBound';
  static WINDOW_ID_CURRENT = -2;
  static NORMAL_WINDOW = 'normal';
  static MATCHED_FLAGS = ['active', 'highlighted', 'pinned', 'audible', 'incognito', 'discarded', 'autoDiscardable'];
  static MATCHED_VALUES = ['status', 'index'];

  constructor({ broadcast, app = electron.app, webContents = electron.webContents, access = ExtensionTabAccess } = {}) {
    super();
    this._broadcast = broadcast;
    this._app = app;
    this._webContents = webContents;
    this._access = access;
    this._tabViewManager = null;
    this._focusedHostId = 0;
  }

  watch(tabViewManager) {
    this._tabViewManager = tabViewManager;
    tabViewManager.on('viewAttached', (wc, entry) => this._follow(wc, entry));
    tabViewManager.on('windowTabSwitched', (hostId, tabId) => this._activated(hostId, tabId));
    this._app.on('browser-window-focus', (_event, win) => this._windowFocused(win));
  }

  query(sess, extId, queryInfo) {
    const info = queryInfo || {};
    return this._entriesIn(sess)
      .map((entry) => this._seenBy(sess, extId, entry))
      .filter((seen) => this._matches(seen, info))
      .map((seen) => seen.tab);
  }

  get(sess, extId, tabId) {
    const entry = this._entryOf(this._webContentsById(tabId));
    if (!entry || entry.webContents.session !== sess) return null;
    return this._seenBy(sess, extId, entry).tab;
  }

  tabOf(wc) {
    const entry = this._entryOf(wc);
    return entry ? this._describe(entry) : null;
  }

  activeTabs() {
    const tvm = this._tabViewManager;
    if (!tvm) return [];
    const hostIds = [...new Set([...tvm.tabs.values()].map((entry) => entry.hostId))];
    return hostIds
      .map((hostId) => ({ window: tvm.getWindow(hostId), tabId: ChromeTabs._webContentsId(tvm.getEntry(tvm.activeTabIdIn(hostId))) }))
      .filter((shown) => shown.window);
  }

  static windowIdOf(hostId) {
    return hostId + 1;
  }

  _follow(wc, entry) {
    if (!wc || wc[ChromeTabs.BOUND_FLAG]) return;
    wc[ChromeTabs.BOUND_FLAG] = true;
    const tabId = wc.id;
    const sess = wc.session;
    this._send(sess, 'onCreated', entry, (tab) => [tab]);
    wc.on('did-start-loading', () => this._updated(sess, entry, { status: 'loading' }));
    wc.on('did-stop-loading', () => this._updated(sess, entry, { status: 'complete' }));
    wc.on('did-navigate', (_event, url) => {
      this.emit('navigated', tabId);
      this._updated(sess, entry, { url });
    });
    wc.on('did-navigate-in-page', (_event, url, isMainFrame) => { if (isMainFrame) this._updated(sess, entry, { url }); });
    wc.on('page-title-updated', (_event, title) => this._updated(sess, entry, { title }));
    wc.once('destroyed', () => {
      this.emit('removed', tabId);
      this._broadcast(sess, 'tabs', 'onRemoved', () => [tabId, { windowId: ChromeTabs.windowIdOf(entry.hostId), isWindowClosing: false }]);
    });
  }

  _updated(sess, entry, change) {
    const isPrivate = ChromeTab.PRIVATE_FIELDS.some((field) => field in change);
    this._send(sess, 'onUpdated', entry, (tab, readable) => (isPrivate && !readable ? null : [tab.id, change, tab]));
  }

  _activated(hostId, tabId) {
    const entry = this._tabViewManager.getEntry(tabId);
    if (!entry || ChromeTabs._isGone(entry.webContents)) return;
    this.emit('activated', hostId);
    const details = { tabId: entry.webContents.id, windowId: ChromeTabs.windowIdOf(hostId) };
    this._broadcast(entry.webContents.session, 'tabs', 'onActivated', () => [details]);
  }

  _windowFocused(win) {
    const tvm = this._tabViewManager;
    if (!win || !tvm.isChromeSender(win.webContents)) return;
    const hostId = tvm.windowIdForSender(win.webContents);
    if (hostId === this._focusedHostId) return;
    this._focusedHostId = hostId;
    this._broadcast(null, 'windows', 'onFocusChanged', () => [ChromeTabs.windowIdOf(hostId)]);
  }

  _send(sess, name, entry, argsOf) {
    if (ChromeTabs._isGone(entry.webContents)) return;
    this._broadcast(sess, 'tabs', name, (extId) => {
      const seen = this._seenBy(sess, extId, entry);
      return argsOf(seen.tab, seen.readable);
    });
  }

  _seenBy(sess, extId, entry) {
    const full = this._describe(entry);
    const isInternal = typeof entry.isInternal === 'function' && entry.isInternal();
    const readable = !isInternal && this._access.canRead(sess, extId, full.url);
    return { tab: readable ? full : ChromeTab.withoutPrivateFields(full), url: full.url, readable };
  }

  _describe(entry) {
    const tvm = this._tabViewManager;
    return ChromeTab.fromWebContents(entry.webContents, {
      active: tvm.activeTabIdIn(entry.hostId) === entry.id,
      index: tvm.order.indexOf(entry.id),
      windowId: ChromeTabs.windowIdOf(entry.hostId),
      pinned: entry.pinned || entry.userPinned,
      incognito: typeof entry.isPrivate === 'function' && entry.isPrivate(),
    });
  }

  _matches({ tab, url, readable }, info) {
    if (ChromeTabs.MATCHED_FLAGS.some((flag) => typeof info[flag] === 'boolean' && tab[flag] !== info[flag])) return false;
    if (ChromeTabs.MATCHED_VALUES.some((key) => !ChromeTabs._isUnset(info[key]) && tab[key] !== info[key])) return false;
    if (typeof info.muted === 'boolean' && tab.mutedInfo.muted !== info.muted) return false;
    if (info.windowType && info.windowType !== ChromeTabs.NORMAL_WINDOW) return false;
    if (!this._windowMatches(tab, info)) return false;
    return ChromeTabs._isUnset(info.url) || (readable && [].concat(info.url).some((pattern) => MatchPattern.matches(pattern, url)));
  }

  _windowMatches(tab, info) {
    const focused = ChromeTabs.windowIdOf(this._focusedHostId);
    if (Number.isInteger(info.windowId)) {
      const wanted = info.windowId === ChromeTabs.WINDOW_ID_CURRENT ? focused : info.windowId;
      if (tab.windowId !== wanted) return false;
    }
    return ['currentWindow', 'lastFocusedWindow'].every((key) => typeof info[key] !== 'boolean' || (tab.windowId === focused) === info[key]);
  }

  _entriesIn(sess) {
    const tvm = this._tabViewManager;
    if (!tvm) return [];
    return tvm.order.map((id) => tvm.getEntry(id)).filter((entry) => entry && !ChromeTabs._isGone(entry.webContents) && entry.webContents.session === sess);
  }

  _entryOf(wc) {
    const tvm = this._tabViewManager;
    if (!tvm || ChromeTabs._isGone(wc)) return null;
    const id = tvm.findTabIdByWebContents(wc);
    return id === null || id === undefined ? null : tvm.getEntry(id);
  }

  _webContentsById(tabId) {
    if (!Number.isInteger(tabId)) return null;
    try { return this._webContents.fromId(tabId) || null; } catch (_) { return null; }
  }

  static _webContentsId(entry) {
    return entry && !ChromeTabs._isGone(entry.webContents) ? entry.webContents.id : null;
  }

  static _isGone(wc) {
    return !wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed());
  }

  static _isUnset(value) {
    return value === undefined || value === null;
  }
}

module.exports = ChromeTabs;
