const EventEmitter = require('events');
const OnDemandService = require('./OnDemandService');
const OnDemandPlacement = require('./OnDemandPlacement');
const OnDemandGeometry = require('./OnDemandGeometry');
const OnDemandTabLookup = require('./OnDemandTabLookup');
const OnDemandWindowFactory = require('./OnDemandWindowFactory');
const OnDemandKeyboard = require('./OnDemandKeyboard');
const OnDemandIpc = require('./OnDemandIpc');

class OnDemandOverlay extends EventEmitter {
  static ENABLED_KEY = 'core.onDemand.enabled';
  static POS_KEY = 'core.onDemand.pos';
  static PAD = OnDemandPlacement.PAD;
  static PAGE_ONLY_ERROR = 'Luma On Demand works on web pages only.';

  static SHELL_EVENTS = ['move', 'resize', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen', 'restore', 'show', 'hide', 'minimize'];

  constructor(mainWindow, tabViewManager, deps = {}) {
    super();
    this._setupDependencies(mainWindow, tabViewManager, deps);
    this._restoreSettings();
    this._setupInitialState();
    this.win = this._createWindow();
    OnDemandIpc.register(this);
    this._wireTabs();
    this._wireShellWindow();
    this._sync();
  }

  raiseVisible() {}

  isEnabled() {
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this._saveSetting(OnDemandOverlay.ENABLED_KEY, this.enabled);
    if (!this.enabled) this.expanded = false;
    this._sync();
  }

  setExpanded(expanded) {
    const next = Boolean(expanded);
    if (this.expanded === next) return;
    this.expanded = next;
    this._sync();
    if (next) this._focusPanel();
    else this._focusPage();
    this.emit(next ? 'expanded' : 'collapsed');
  }

  drag(dx, dy) {
    if (!this.visible) return;
    const rect = this.pageRect();
    const current = this.pos || OnDemandGeometry.defaultPosition(rect);
    this.pos = OnDemandGeometry.clampPosition({ x: current.x + (dx || 0), y: current.y + (dy || 0) }, rect);
    const inner = this._innerBounds();
    this._safely(() => this.win.setBounds(this._windowBounds(inner)));
    this._pushTile(this.expanded ? null : inner);
  }

  dragEnd() {
    if (this.pos) this._saveSetting(OnDemandOverlay.POS_KEY, this.pos);
  }

  markReady() {
    this.ready = true;
    this._pushState();
  }

  pageRect() {
    return this._lookup.pageRect();
  }

  tileBounds() {
    return this.visible && !this.expanded ? this._innerBounds() : null;
  }

  isOwnSender(e) {
    try {
      return Boolean(e && e.sender && e.sender === this.win.webContents);
    } catch (_) {
      return false;
    }
  }

  state() {
    const tabId = this._lookup.activeTabId();
    const entry = this._lookup.entry(tabId);
    return {
      enabled: this.enabled,
      visible: this.visible,
      expanded: this.expanded,
      platform: process.platform,
      pad: OnDemandOverlay.PAD,
      tab: entry ? { id: tabId, url: entry.url || '', title: entry.title || '' } : null,
      conversationId: this.service.trackedConversation(tabId),
      model: this.service.currentModelLabel(),
      hasModel: Boolean(this.service.currentModelRef()),
      stt: OnDemandOverlay._safeFlag(this._sttReady),
      tts: OnDemandOverlay._safeFlag(this._ttsReady),
    };
  }

  history() {
    return this.service.history(this._lookup.activeTabId());
  }

  abortTurn() {
    this.service.abort();
    return { success: true };
  }

  async sendTurn({ requestId, text, spoken } = {}) {
    const tabId = this._lookup.activeTabId();
    if (!OnDemandTabLookup.isWebPage(this._lookup.entry(tabId))) return { success: false, error: OnDemandOverlay.PAGE_ONLY_ERROR };
    const send = (type, payload) => this._sendToPanel('on-demand:chat-event', { requestId, type, payload });
    try {
      const result = await this.service.send({ tabId, text, spoken: Boolean(spoken), send });
      this._activeConv = this.service.trackedConversation(tabId);
      this._pushState();
      return result;
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      send('error', { message });
      return { success: false, error: message };
    }
  }

  destroy() {
    this._disposed = true;
    this._safely(() => this.service.dispose());
    this._safely(() => {
      if (!this.win.isDestroyed()) this.win.destroy();
    });
  }

  _setupDependencies(mainWindow, tabViewManager, deps) {
    this.mainWindow = mainWindow;
    this.tvm = tabViewManager;
    this.db = deps.db || { get: (_key, fallback) => fallback, set: () => {} };
    this._sttReady = typeof deps.sttReady === 'function' ? deps.sttReady : () => false;
    this._ttsReady = typeof deps.ttsReady === 'function' ? deps.ttsReady : () => false;
    this._log = typeof deps.log === 'function' ? deps.log : () => {};
    this._lookup = new OnDemandTabLookup(tabViewManager);
    this.service = new OnDemandService({
      getRouter: deps.getRouter || (() => global.__lumaChatRouter || null),
      chatModeRegistry: deps.chatModeRegistry || null,
      getTabInfo: (tabId) => this._lookup.tabInfo(tabId),
      log: this._log,
    });
    this._keyboard = new OnDemandKeyboard({
      tabViewManager,
      lookup: this._lookup,
      isExpanded: () => this.expanded,
      collapse: () => this.setExpanded(false),
    });
  }

  _restoreSettings() {
    this.enabled = this.db.get(OnDemandOverlay.ENABLED_KEY, true) !== false;
    const saved = this.db.get(OnDemandOverlay.POS_KEY, null);
    this.pos = OnDemandPlacement.isValidPosition(saved) ? saved : null;
  }

  _setupInitialState() {
    this.expanded = false;
    this.visible = false;
    this.ready = false;
    this._swept = false;
    this._disposed = false;
    this._lastTileRect = null;
    this._activeConv = null;
  }

  _createWindow() {
    return OnDemandWindowFactory.create(this.mainWindow, {
      onLoaded: () => this.markReady(),
      onInput: (event, input) => this._keyboard.handle(event, input),
      onClosed: () => { this._disposed = true; },
    });
  }

  _wireTabs() {
    const tvm = this.tvm;
    if (!tvm || typeof tvm.on !== 'function') return;
    tvm.on('tabSwitched', (tabId) => this._onTabSwitched(tabId));
    tvm.on('tabCreated', (tab) => this._onTabCreated(tab));
    tvm.on('tabClosed', (tabId) => this._onTabClosed(tabId));
    tvm.on('tabHidden', () => this._sync());
    tvm.on('boundsChanged', () => this._sync());
    tvm.on('tabNavigated', (tabId) => this._onActivePageChanged(tabId));
    tvm.on('tabTitleUpdated', (tabId) => this._onActivePageChanged(tabId));
  }

  _wireShellWindow() {
    const mw = this.mainWindow;
    if (!mw || typeof mw.on !== 'function') return;
    for (const eventName of OnDemandOverlay.SHELL_EVENTS) mw.on(eventName, () => this._sync());
  }

  _onTabSwitched(tabId) {
    const next = this.service.trackedConversation(tabId);
    if (this.expanded && (!next || next !== this._activeConv)) this.expanded = false;
    this._activeConv = next;
    this._sync();
  }

  _onTabCreated(tab) {
    if (tab && tab.openerTabId != null) this.service.adoptTab(tab.id, tab.openerTabId);
  }

  _onTabClosed(tabId) {
    this.service.onTabClosed(tabId);
    this._sync();
  }

  _onActivePageChanged(tabId) {
    if (tabId !== this._lookup.activeTabId()) return;
    this.service.refreshTab(tabId);
    this._pushState();
  }

  _sync() {
    if (this._disposed) return;
    this._sweepOnce();
    if (this._shouldShow()) this._showAtCurrentBounds();
    else this._hide();
    this._pushState();
  }

  _sweepOnce() {
    if (this._swept || !this.service.isReady()) return;
    this._swept = true;
    this._safely(() => this.service.sweep());
  }

  _shouldShow() {
    if (!this.enabled || this._disposed || !this._shellVisible()) return false;
    if (!OnDemandTabLookup.isShownPage(this._lookup.activeEntry())) return false;
    return OnDemandGeometry.rectUsable(this.pageRect());
  }

  _shellVisible() {
    try {
      const mw = this.mainWindow;
      return Boolean(mw) && !mw.isDestroyed() && mw.isVisible() && !mw.isMinimized();
    } catch (_) {
      return false;
    }
  }

  _showAtCurrentBounds() {
    const inner = this._innerBounds();
    this._safely(() => {
      this.win.setBounds(this._windowBounds(inner));
      if (!this.visible || !this.win.isVisible()) this.win.showInactive();
    });
    this.visible = true;
    this._pushTile(this.expanded ? null : inner);
  }

  _hide() {
    if (this.visible) {
      this.visible = false;
      this._safely(() => this.win.hide());
    }
    this._pushTile(null);
  }

  _innerBounds() {
    return OnDemandPlacement.innerBounds(this.pos, this.pageRect(), this.expanded);
  }

  _windowBounds(inner) {
    let origin = { x: 0, y: 0 };
    this._safely(() => {
      const content = this.mainWindow.getContentBounds();
      origin = { x: content.x, y: content.y };
    });
    return OnDemandPlacement.windowBounds(inner, origin);
  }

  _pushTile(inner) {
    const rect = OnDemandPlacement.tileRect(inner);
    const key = JSON.stringify(rect);
    if (key === this._lastTileRect) return;
    this._lastTileRect = key;
    this._safely(() => {
      const wc = this.mainWindow.webContents;
      if (wc && !wc.isDestroyed()) wc.send('on-demand:tile', rect);
    });
  }

  _pushState() {
    if (!this.ready || this._disposed) return;
    this._sendToPanel('on-demand:state', this.state());
  }

  _sendToPanel(channel, payload) {
    this._safely(() => {
      const wc = this.win.webContents;
      if (!wc.isDestroyed()) wc.send(channel, payload);
    });
  }

  _focusPanel() {
    this._safely(() => {
      this.win.focus();
      this.win.webContents.focus();
    });
  }

  _focusPage() {
    this._safely(() => this.mainWindow.focus());
    const entry = this._lookup.activeEntry();
    this._safely(() => {
      if (entry && entry.webContents && !entry.webContents.isDestroyed()) entry.webContents.focus();
    });
  }

  _saveSetting(key, value) {
    this._safely(() => this.db.set(key, value));
  }

  _safely(fn) {
    try {
      fn();
    } catch (_) {}
  }

  static _safeFlag(fn) {
    try {
      return Boolean(fn());
    } catch (_) {
      return false;
    }
  }
}

module.exports = OnDemandOverlay;
