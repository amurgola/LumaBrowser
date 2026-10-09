const { EventEmitter } = require('events');
const TabShareList = require('./TabShareList');
const TabShareSettings = require('./TabShareSettings');
const TabShareTransport = require('./TabShareTransport');
const TabStreamer = require('./TabStreamer');

class TabShareService extends EventEmitter {
  static WEB_PREFIX = '/tab';
  static MODE_ERROR = 'Mode must be "view" or "interact".';
  static TAB_EVENTS = ['tabCreated', 'tabClosed', 'tabNavigated', 'tabTitleUpdated'];

  constructor({ db, browser, getHost, log, extensionDir, rtcCapturer, turnRelay } = {}) {
    super();
    this._browser = browser;
    this._getHost = getHost || (() => null);
    this._log = log || (() => {});
    this._shares = new TabShareList({ db, log: this._log });
    this._settings = new TabShareSettings({ db, log: this._log });
    this._transport = new TabShareTransport({
      settings: this._settings, getHost: this._getHost, getTvm: () => this._tvm(), log: this._log,
      extensionDir: extensionDir || __dirname, rtcCapturer, turnRelay,
    });
    this._streamers = new Map();
    this._tvmListeners = [];
    this._unmount = null;
    this._started = false;
  }


  start({ router = null, upgrade = null } = {}) {
    if (this._started) return;
    this._started = true;
    this._shares.load();
    this._settings.load();
    this._transport.startRelayIfEnabled(() => this._changed('settings', null));
    this._attachTabEvents();
    this._mountWebRoutes(router, upgrade);
  }

  destroy() {
    for (const streamer of this._streamers.values()) streamer.destroy('ended');
    this._streamers.clear();
    this._transport.destroy();
    this._detachTabEvents();
    if (this._unmount) { try { this._unmount(); } catch (_) {} this._unmount = null; }
    this._started = false;
    this.removeAllListeners();
  }


  availability() {
    const host = this._getHost();
    if (!host || typeof host.getShareLinkStatus !== 'function') {
      return { available: false, reason: 'Network Sharing is not available in this build.', baseUrl: null };
    }
    const st = host.getShareLinkStatus();
    return { available: !!st.available, reason: st.reason || null, baseUrl: st.baseUrl || null };
  }

  getStatus() {
    const a = this.availability();
    return {
      available: a.available,
      reason: a.reason,
      shares: this._shares.all().map((s) => this._public(s, a.baseUrl)),
      settings: this.getSettings(),
      rtc: this._transport.status(),
    };
  }

  getSettings() {
    return this._settings.get();
  }

  async updateSettings(patch = {}) {
    const result = this._settings.update(patch);
    if (result.error) return { success: false, error: result.error };
    const relay = result.relayChanged ? await this._transport.applyRelay() : { success: true };
    this._changed('settings', null);
    return { success: true, settings: this.getSettings(), relay };
  }

  turnHost() {
    return this._transport.turnHost();
  }

  rtcAvailable() {
    return this._transport.rtcAvailable();
  }


  getForTab(tabId) {
    const s = this._shares.byTab(tabId);
    return s ? this._public(s, this.availability().baseUrl) : null;
  }

  share(tabId, { mode = 'view' } = {}) {
    if (!TabShareList.isMode(mode)) return { success: false, error: TabShareService.MODE_ERROR };
    const a = this.availability();
    if (!a.available) return { success: false, error: a.reason || 'Sharing is unavailable.' };
    const entry = this._entry(tabId);
    const refusal = TabShareService._shareRefusal(entry);
    if (refusal) return { success: false, error: refusal };
    const existing = this._shares.byTab(tabId);
    const s = existing ? this._applyMode(existing, mode) : this._createShare(entry, mode);
    this._changed('shared', s.id);
    return { success: true, share: this._public(s, a.baseUrl) };
  }

  setMode(shareId, mode) {
    if (!TabShareList.isMode(mode)) return { success: false, error: TabShareService.MODE_ERROR };
    const s = this._shares.byId(shareId);
    if (!s) return { success: false, error: 'Share not found.' };
    if (s.mode !== mode) {
      this._applyMode(s, mode);
      this._changed('mode', s.id);
    }
    return { success: true, share: this._public(s, this.availability().baseUrl) };
  }

  stop(shareId) {
    const s = this._shares.byId(shareId);
    if (!s) return { success: false, error: 'Share not found.' };
    this._dropStreamer(s.id, 'ended');
    this._transport.release(s.tabId);
    this._shares.remove(s.id);
    this._undoAutoPersist(s);
    this._changed('stopped', s.id);
    return { success: true };
  }

  stopAll() {
    for (const s of [...this._shares.all()]) this.stop(s.id);
    return { success: true };
  }

  resolve(token) {
    const t = String(token || '');
    if (!TabShareList.isToken(t)) return null;
    if (!this.availability().available) return null;
    return this._shares.byToken(t);
  }

  resolveStreamer(token) {
    const s = this.resolve(token);
    if (!s || s.tabId == null) return null;
    return this._ensureStreamer(s);
  }

  viewerCount(shareId) {
    const streamer = this._streamers.get(shareId);
    return streamer ? streamer.viewerCount : 0;
  }

  videoViewerCount(shareId) {
    const streamer = this._streamers.get(shareId);
    return streamer ? streamer.videoViewerCount : 0;
  }


  static _shareRefusal(entry) {
    if (!entry) return 'That tab no longer exists.';
    if ((entry.kind && entry.kind !== 'user') || entry.silent) return 'Only regular browsing tabs can be shared.';
    return null;
  }

  _createShare(entry, mode) {
    const s = TabShareList.create(entry, mode);
    this._shares.add(s);
    this._autoPersist(entry);
    this._ensureStreamer(s);
    return s;
  }

  _autoPersist(entry) {
    const tvm = this._tvm();
    if (entry.keepAlive || typeof tvm.setTabPersistence !== 'function') return;
    try { tvm.setTabPersistence(entry.id, true); } catch (err) { this._log(`persist failed: ${err && err.message}`); }
  }

  _undoAutoPersist(s) {
    const tvm = this._tvm();
    const entry = tvm && s.tabId != null && tvm.getEntry ? tvm.getEntry(s.tabId) : null;
    if (!entry || s.persistedBefore || !entry.keepAlive || entry.hidden || typeof tvm.setTabPersistence !== 'function') return;
    try { tvm.setTabPersistence(s.tabId, false); } catch (_) {}
  }

  _applyMode(s, mode) {
    if (s.mode === mode) return s;
    s.mode = mode;
    this._shares.save();
    const streamer = this._streamers.get(s.id);
    if (streamer) streamer.broadcastMode();
    return s;
  }

  _ensureStreamer(s) {
    const existing = this._streamers.get(s.id);
    if (existing) return existing;
    const tvm = this._tvm();
    if (!tvm || s.tabId == null) return null;
    const streamer = this._createStreamer(tvm, s);
    this._streamers.set(s.id, streamer);
    return streamer;
  }

  _createStreamer(tvm, s) {
    const streamer = new TabStreamer({
      getWebContents: () => { const e = tvm.getEntry(s.tabId); return e ? e.webContents : null; },
      getView: () => { const e = tvm.getEntry(s.tabId); return e ? e.view : null; },
      getFallbackBounds: () => tvm.currentBounds || null,
      getMode: () => s.mode,
      getMeta: () => ({ title: s.title, url: s.url }),
      log: this._log,
      rtc: this._transport.hooksFor(s),
    });
    streamer.on('viewers', () => this._changed('viewers', s.id));
    streamer.on('transport', () => this._changed('viewers', s.id));
    return streamer;
  }

  _dropStreamer(shareId, reason) {
    const streamer = this._streamers.get(shareId);
    if (!streamer) return;
    streamer.destroy(reason);
    this._streamers.delete(shareId);
  }


  _attachTabEvents() {
    const tvm = this._tvm();
    if (!tvm) return;
    const handlers = {
      tabCreated: (t) => this._onTabCreated(t),
      tabClosed: (id) => this._onTabClosed(id),
      tabNavigated: (id, url) => this._onTabMeta(id, { url }),
      tabTitleUpdated: (id, title) => this._onTabMeta(id, { title }),
    };
    for (const ev of TabShareService.TAB_EVENTS) {
      tvm.on(ev, handlers[ev]);
      this._tvmListeners.push([ev, handlers[ev]]);
    }
    for (const entry of tvm.tabs ? tvm.tabs.values() : []) this._tryBind(entry);
  }

  _detachTabEvents() {
    const tvm = this._tvm();
    if (tvm) for (const [ev, fn] of this._tvmListeners) { try { tvm.off(ev, fn); } catch (_) {} }
    this._tvmListeners = [];
  }

  _mountWebRoutes(router, upgrade) {
    const host = this._getHost();
    if (host && typeof host.registerWebMount === 'function') {
      this._unmount = host.registerWebMount(TabShareService.WEB_PREFIX, { router, upgrade });
    } else {
      this._log('web backend has no registerWebMount; tab links will not be served');
    }
  }

  _onTabCreated(serialized) {
    const entry = this._entry(serialized && serialized.id);
    if (entry) this._tryBind(entry);
  }

  _tryBind(entry) {
    if (!entry || !entry.keepAlive) return;
    if (this._shares.byTab(entry.id)) return;
    const dormant = this._shares.dormantIn(entry.partition);
    const s = dormant.find((x) => x.url === entry.url) || (dormant.length === 1 ? dormant[0] : null);
    if (!s) return;
    s.tabId = entry.id;
    s.title = entry.title || s.title;
    this._shares.save();
    this._ensureStreamer(s);
    this._changed('bound', s.id);
  }

  _onTabClosed(tabId) {
    const s = this._shares.byTab(tabId);
    if (!s) return;
    this._transport.release(tabId);
    s.tabId = null;
    this._dropStreamer(s.id, 'tab-closed');
    this._shares.save();
    this._changed('dormant', s.id);
  }

  _onTabMeta(tabId, { url, title }) {
    const s = this._shares.byTab(tabId);
    if (!s || !TabShareService._applyMeta(s, url, title)) return;
    this._shares.save();
    const streamer = this._streamers.get(s.id);
    if (streamer) streamer.broadcastMeta();
    this._changed('meta', s.id);
  }

  static _applyMeta(s, url, title) {
    let dirty = false;
    if (typeof url === 'string' && url && url !== s.url) { s.url = url; dirty = true; }
    if (typeof title === 'string' && title !== s.title) { s.title = title; dirty = true; }
    return dirty;
  }


  _tvm() {
    try {
      const tm = this._browser && typeof this._browser.getTabManager === 'function' ? this._browser.getTabManager() : null;
      return tm && tm.tabViewManager ? tm.tabViewManager : null;
    } catch (_) {
      return null;
    }
  }

  _entry(tabId) {
    const tvm = this._tvm();
    return tvm && tvm.getEntry ? tvm.getEntry(tabId) : null;
  }

  _public(s, baseUrl) {
    return {
      id: s.id,
      tabId: s.tabId,
      live: s.tabId != null,
      mode: s.mode,
      url: baseUrl ? `${baseUrl}${TabShareService.WEB_PREFIX}/${s.token}` : null,
      pageUrl: s.url || '',
      title: s.title || '',
      viewers: this.viewerCount(s.id),
      videoViewers: this.videoViewerCount(s.id),
      createdAt: s.createdAt,
    };
  }

  _changed(reason, shareId) {
    this.emit('changed', { reason, shareId, status: this.getStatus() });
  }
}

module.exports = TabShareService;
