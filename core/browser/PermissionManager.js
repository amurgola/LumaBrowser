const { ipcMain } = require('electron');
const PermissionKinds = require('./PermissionKinds');
const SitePermissionStore = require('./SitePermissionStore');

class PermissionManager {
  static SITES_KEY = SitePermissionStore.SITES_KEY;
  static PROMPT_TIMEOUT_MS = 2 * 60 * 1000;
  static DECISIONS = ['once', 'always', 'block'];
  static _current = null;

  constructor({ db, getMainWindow, resolveTab, logger } = {}) {
    this._sites = new SitePermissionStore(db);
    this._getMainWindow = typeof getMainWindow === 'function' ? getMainWindow : () => null;
    this._resolveTab = typeof resolveTab === 'function' ? resolveTab : () => null;
    this._log = (logger && logger.log) || ((...a) => console.log(...a));
    this._onceGrants = new Map();
    this._pending = new Map();
    this._byRequestId = new Map();
    this._sessions = new WeakSet();
    this._seq = 0;
    this._registerIpc();
  }

  static install(instance) {
    PermissionManager._current = instance || null;
    return PermissionManager._current;
  }

  static current() {
    return PermissionManager._current;
  }

  attachSession(sess) {
    if (!sess || this._sessions.has(sess)) return;
    this._sessions.add(sess);
    sess.setPermissionRequestHandler((wc, permission, callback, details) => {
      this.handleRequest(wc, permission, callback, details);
    });
    if (typeof sess.setPermissionCheckHandler === 'function') {
      sess.setPermissionCheckHandler((wc, permission, requestingOrigin, details) =>
        this.check(wc, permission, requestingOrigin, details));
    }
  }

  handleRequest(wc, permission, callback, details) {
    const finish = this._completeOnce(wc, permission, callback, details);
    try {
      const request = this._readRequest(wc, permission, details);
      const verdict = PermissionManager._immediateVerdict(request);
      if (verdict) return finish(verdict.granted, verdict.why);
      this.decideMedia(wc, request.origin, request.kinds).then(
        (granted) => finish(granted),
        () => finish(false, 'error'),
      );
    } catch (_) {
      finish(false, 'error');
    }
  }

  check(wc, permission, requestingOrigin, details) {
    if (permission !== 'media') return true;
    const origin = PermissionKinds.originOf(requestingOrigin) || PermissionKinds.originOf(this._urlOf(wc, details));
    if (origin === PermissionKinds.APP_ORIGIN) return true;
    if (!origin) return false;
    const kinds = PermissionKinds.kindsOfCheck(details && details.mediaType);
    const tab = this._tabOf(wc);
    return kinds.every((k) => this._isAllowed(tab, origin, k) === true);
  }

  decideMedia(wc, origin, kinds) {
    const tab = this._tabOf(wc);
    const states = kinds.map((k) => this._isAllowed(tab, origin, k));
    if (states.includes(false)) return Promise.resolve(false);
    if (states.every((s) => s === true)) return Promise.resolve(true);
    if (!this._mayPrompt(tab)) return Promise.resolve(false);
    return this._prompt(wc, tab, origin, kinds);
  }

  respond(requestId, decision) {
    const entry = this._byRequestId.get(requestId);
    if (!entry) return false;
    this._settle(entry, PermissionManager.DECISIONS.includes(decision) ? decision : 'dismiss');
    return true;
  }

  onTabNavigated(tabId, url) {
    const origin = PermissionKinds.originOf(url);
    this._dropOnceGrantsOutside(tabId, origin);
    this._dismissWhere((entry) => entry.tabId === tabId && entry.origin !== origin);
  }

  onTabClosed(tabId) {
    this._onceGrants.delete(tabId);
    this._dismissWhere((entry) => entry.tabId === tabId);
  }

  onTabHidden(tabId) {
    this._dismissWhere((entry) => entry.tabId === tabId);
  }

  listSites() {
    return this._sites.list();
  }

  clearSite(origin) {
    return this._sites.clear(origin);
  }

  clearAllSites() {
    this._sites.clearAll();
  }

  _completeOnce(wc, permission, callback, details) {
    let done = false;
    return (granted, why) => {
      if (done) return;
      done = true;
      const url = this._urlOf(wc, details);
      this._log(`[permissions] ${granted ? 'granted' : 'denied'}: ${permission} (${url})${why ? ' ' + why : ''}`);
      try { callback(!!granted); } catch (_) {}
    };
  }

  _readRequest(wc, permission, details) {
    return {
      permission,
      origin: PermissionKinds.originOf(this._urlOf(wc, details)),
      kinds: PermissionKinds.kindsOf(permission, details),
    };
  }

  static _immediateVerdict({ permission, origin, kinds }) {
    if (permission === 'notifications') return { granted: true };
    if (permission === 'clipboard-sanitized-write') return { granted: origin === PermissionKinds.APP_ORIGIN };
    if (!kinds) return { granted: false, why: 'unsupported' };
    if (origin === PermissionKinds.APP_ORIGIN) return { granted: true, why: 'app ui' };
    if (!origin) return { granted: false, why: 'no origin' };
    return null;
  }

  _mayPrompt(tab) {
    if (!tab || tab.hidden) return false;
    return this._isWindowLive(this._getMainWindow());
  }

  _isAllowed(tab, origin, kind) {
    const remembered = this._sites.answerFor(origin, kind);
    if (remembered === 'allow') return true;
    if (remembered === 'block') return false;
    if (tab && this._hasOnceGrant(tab.id, origin, kind)) return true;
    return null;
  }

  _hasOnceGrant(tabId, origin, kind) {
    const once = this._onceGrants.get(tabId);
    return !!(once && once.has(`${origin}|${kind}`));
  }

  _prompt(wc, tab, origin, kinds) {
    const sorted = kinds.slice().sort();
    const existing = this._pending.get(`${tab.id}|${origin}|${sorted.join('+')}`);
    if (existing) return existing.promise;
    const entry = this._createPendingEntry(tab, origin, sorted);
    this._watchSyntheticTab(wc, tab);
    this._sendPrompt(entry, tab);
    return entry.promise;
  }

  _createPendingEntry(tab, origin, kinds) {
    const key = `${tab.id}|${origin}|${kinds.join('+')}`;
    const requestId = `perm-${++this._seq}-${Date.now()}`;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    const entry = { key, requestId, tabId: tab.id, origin, kinds, resolve, promise, timer: null };
    entry.timer = setTimeout(() => this._settle(entry, 'dismiss'), PermissionManager.PROMPT_TIMEOUT_MS);
    if (entry.timer && typeof entry.timer.unref === 'function') entry.timer.unref();
    this._pending.set(key, entry);
    this._byRequestId.set(requestId, entry);
    return entry;
  }

  _watchSyntheticTab(wc, tab) {
    if (!tab.synthetic || !wc || typeof wc.once !== 'function') return;
    try { wc.once('destroyed', () => this.onTabClosed(tab.id)); } catch (_) {}
  }

  _sendPrompt(entry, tab) {
    this._send('permission:prompt', {
      requestId: entry.requestId,
      tabId: tab.synthetic ? null : tab.id,
      origin: entry.origin,
      host: PermissionKinds.hostOf(entry.origin),
      kinds: entry.kinds,
      what: PermissionKinds.describe(entry.kinds),
    });
  }

  _settle(entry, decision) {
    if (!this._pending.has(entry.key)) return;
    this._forget(entry);
    const granted = this._applyDecision(entry, decision);
    this._send('permission:prompt-close', { requestId: entry.requestId });
    entry.resolve(granted);
  }

  _forget(entry) {
    this._pending.delete(entry.key);
    this._byRequestId.delete(entry.requestId);
    if (entry.timer) clearTimeout(entry.timer);
  }

  _applyDecision(entry, decision) {
    if (decision === 'once') {
      this._grantOnce(entry.tabId, entry.origin, entry.kinds);
      return true;
    }
    if (decision === 'always') {
      this._sites.remember(entry.origin, entry.kinds, 'allow');
      return true;
    }
    if (decision === 'block') this._sites.remember(entry.origin, entry.kinds, 'block');
    return false;
  }

  _grantOnce(tabId, origin, kinds) {
    let once = this._onceGrants.get(tabId);
    if (!once) {
      once = new Set();
      this._onceGrants.set(tabId, once);
    }
    for (const k of kinds) once.add(`${origin}|${k}`);
  }

  _dropOnceGrantsOutside(tabId, origin) {
    const once = this._onceGrants.get(tabId);
    if (!once) return;
    for (const grant of Array.from(once)) {
      if (!origin || !grant.startsWith(`${origin}|`)) once.delete(grant);
    }
    if (!once.size) this._onceGrants.delete(tabId);
  }

  _dismissWhere(predicate) {
    for (const entry of Array.from(this._pending.values())) {
      if (predicate(entry)) this._settle(entry, 'dismiss');
    }
  }

  _urlOf(wc, details) {
    if (details && typeof details.requestingUrl === 'string' && details.requestingUrl) return details.requestingUrl;
    try { return (wc && !wc.isDestroyed() && wc.getURL()) || ''; } catch (_) { return ''; }
  }

  _tabOf(wc) {
    let tab = null;
    try { tab = this._resolveTab(wc) || null; } catch (_) { tab = null; }
    if (tab) return tab;
    if (wc && wc.id != null) return { id: `wc:${wc.id}`, hidden: false, synthetic: true };
    return null;
  }

  _isWindowLive(win) {
    return !!win && !(typeof win.isDestroyed === 'function' && win.isDestroyed());
  }

  _send(channel, payload) {
    const win = this._getMainWindow();
    if (!this._isWindowLive(win)) return;
    try { win.webContents.send(channel, payload); } catch (_) {}
  }

  _registerIpc() {
    try {
      ipcMain.on('permission:decision', (_e, p) => {
        if (p && p.requestId) this.respond(String(p.requestId), p.decision);
      });
      ipcMain.handle('core.settings.sitePermissions.list', () => this.listSites());
      ipcMain.handle('core.settings.sitePermissions.clear', (_e, origin) => ({ success: this.clearSite(String(origin || '')) }));
      ipcMain.handle('core.settings.sitePermissions.clearAll', () => { this.clearAllSites(); return { success: true }; });
    } catch (_) {}
  }
}

module.exports = PermissionManager;
