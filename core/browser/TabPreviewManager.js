const { EventEmitter } = require('events');
const { ipcMain } = require('electron');
const TabPreviewGeometry = require('./TabPreviewGeometry');

class TabPreviewManager extends EventEmitter {
  static MODE_KEY = 'core.chat.tabPreview';
  static FRAME_INTERVAL_MS = 1500;
  static HIDDEN_BOUNDS = { x: 0, y: 0, width: 0, height: 0 };
  static DOC_HEIGHT_SCRIPT = 'Math.max(document.documentElement.scrollHeight||0, document.body ? document.body.scrollHeight||0 : 0)';

  constructor(mainWindow, tabViewManager, { db } = {}) {
    super();
    this.mainWindow = mainWindow;
    this.tabViewManager = tabViewManager;
    this.preview = null;
    this._db = db || null;
    this._frameTimer = null;
    this._frameInFlight = false;
    this._navHook = null;
    this._wireManagerEvents();
    this._registerIpc();
  }

  mode() {
    if (!this._db) return 'live';
    return this._db.get(TabPreviewManager.MODE_KEY, 'live') === 'off' ? 'off' : 'live';
  }

  isEnabled() {
    return this.mode() !== 'off';
  }

  setEnabled(enabled) {
    this._persistMode(enabled);
    if (!enabled) this.detach();
    return { success: true, enabled: this.isEnabled() };
  }

  attach({ tabId, hostTabId } = {}) {
    const entry = this.tabViewManager.getEntry(tabId);
    const refusal = this._attachRefusal(entry, tabId, hostTabId);
    if (refusal) return { success: false, error: refusal };
    if (this.preview && this.preview.tabId !== tabId) this.detach();
    if (!this.isEnabled()) return { success: false, error: 'Tab preview is off' };
    this._beginPreview(entry, tabId, hostTabId);
    return { success: true };
  }

  setRect(rect) {
    if (!this.preview || !rect) return { success: false };
    this.preview.rect = TabPreviewManager._numericRect(rect);
    this.preview.wantVisible = rect.visible !== false;
    this._apply();
    return { success: true, shown: this.preview.shown };
  }

  detach() {
    const p = this.preview;
    if (!p) return { success: false };
    this.preview = null;
    this._stopFrames();
    this._releaseEntry(p);
    this.emit('detached', { tabId: p.tabId, hostTabId: p.hostTabId });
    return { success: true };
  }

  focus() {
    if (!this.preview) return { success: false };
    return this.tabViewManager.switchToTab(this.preview.tabId);
  }

  previewedTabId() {
    return this.preview ? this.preview.tabId : null;
  }

  async captureFrame({ maxWidth = 640, quality = 70 } = {}) {
    const entry = this.preview ? this.tabViewManager.getEntry(this.preview.tabId) : null;
    if (!entry) return null;
    try {
      const image = await entry.webContents.capturePage();
      if (!image || image.isEmpty()) return null;
      return TabPreviewManager._encodeFrame(image, maxWidth, quality);
    } catch (_) {
      return null;
    }
  }

  reapply() {
    this._apply({ forceRaise: true });
  }

  destroy() {
    this.detach();
    this._stopFrames();
    ipcMain.removeAllListeners('tab-preview:rect');
    ipcMain.removeAllListeners('tab-preview:detach');
    ipcMain.removeAllListeners('tab-preview:focus');
    try { ipcMain.removeHandler('tab-preview:get-enabled'); } catch (_) {}
    try { ipcMain.removeHandler('tab-preview:set-enabled'); } catch (_) {}
  }

  _persistMode(enabled) {
    if (!this._db) return;
    try { this._db.set(TabPreviewManager.MODE_KEY, enabled ? 'live' : 'off'); } catch (_) {}
  }

  _attachRefusal(entry, tabId, hostTabId) {
    if (!entry || !this.tabViewManager.getEntry(hostTabId)) return 'Unknown tab';
    if (tabId === hostTabId) return 'A tab cannot preview itself';
    if (entry.silent) return 'Silent tabs cannot be previewed';
    return null;
  }

  _beginPreview(entry, tabId, hostTabId) {
    entry.previewing = true;
    this.preview = {
      tabId, hostTabId, rect: null, wantVisible: false, shown: false,
      zoom: null, fitKey: null, fitDirty: false, fitting: false,
    };
    this._watchNavigation(entry);
    this._startFrames();
    this.emit('attached', { tabId, hostTabId });
  }

  _releaseEntry(p) {
    const entry = this.tabViewManager.getEntry(p.tabId);
    if (!entry) return;
    entry.previewing = false;
    this._unwatchNavigation(entry);
    this._unpaint(entry, p.tabId);
    if (p.zoom != null) this._restoreZoom(entry);
  }

  _dropPreview() {
    const p = this.preview;
    this.preview = null;
    this._navHook = null;
    this._stopFrames();
    this.emit('detached', { tabId: p.tabId, hostTabId: p.hostTabId });
  }

  _wireManagerEvents() {
    const tvm = this.tabViewManager;
    if (!tvm || typeof tvm.on !== 'function') return;
    tvm.on('tabSwitched', () => this.reapply());
    tvm.on('boundsChanged', () => this._apply());
    tvm.on('tabClosed', (id) => this._onTabClosed(id));
  }

  _onTabClosed(id) {
    if (!this.preview) return;
    if (id === this.preview.tabId || id === this.preview.hostTabId) this._dropPreview();
  }

  _apply({ forceRaise = false } = {}) {
    const p = this.preview;
    if (!p) return;
    const entry = this.tabViewManager.getEntry(p.tabId);
    if (!entry) return this._dropPreview();
    const bounds = this._windowRect(p);
    if (!bounds) {
      this._unpaint(entry, p.tabId);
      p.shown = false;
      return;
    }
    this._paint(entry, p, bounds, forceRaise);
  }

  _paint(entry, p, bounds, forceRaise) {
    try {
      if (!p.shown || forceRaise) this._raise(entry, p.tabId);
      entry.view.setVisible(true);
      entry.view.setBounds(bounds);
      p.shown = true;
      this._fitZoom(bounds);
    } catch (err) {
      console.warn('[TabPreviewManager] apply failed:', err && err.message);
    }
  }

  _raise(entry, tabId) {
    this.mainWindow.contentView.removeChildView(entry.view);
    this.mainWindow.contentView.addChildView(entry.view);
    this.emit('raised', { tabId });
  }

  _windowRect(p) {
    if (!p.rect || !p.wantVisible) return null;
    const tvm = this.tabViewManager;
    if (tvm.activeTabId !== p.hostTabId || tvm.activeTabId === p.tabId) return null;
    const host = tvm.getEntry(p.hostTabId);
    const content = tvm.currentBounds;
    if (!host || !content || !content.width || !content.height) return null;
    return TabPreviewGeometry.toWindowRect(p.rect, content, TabPreviewManager._zoomOf(host));
  }

  _unpaint(entry, tabId) {
    if (this.tabViewManager.activeTabId === tabId) return this._handBackPromotedZoom(entry);
    try {
      entry.view.setVisible(false);
      entry.view.setBounds(TabPreviewManager.HIDDEN_BOUNDS);
    } catch (_) {}
  }

  _handBackPromotedZoom(entry) {
    if (!this.preview || this.preview.zoom == null) return;
    this.preview.zoom = null;
    this.preview.fitKey = null;
    this._restoreZoom(entry);
  }

  async _fitZoom(bounds) {
    const p = this.preview;
    if (!this._claimFit(p, bounds)) return;
    const tabId = p.tabId;
    try {
      const entry = this.tabViewManager.getEntry(tabId);
      if (entry) await this._fitEntry(entry, tabId, bounds);
    } finally {
      if (this.preview && this.preview.tabId === tabId) this.preview.fitting = false;
    }
  }

  _claimFit(p, bounds) {
    if (!p || !bounds || !bounds.width || !bounds.height) return false;
    const key = `${bounds.width}x${bounds.height}`;
    if (p.fitting || (p.fitKey === key && !p.fitDirty)) return false;
    p.fitting = true;
    p.fitKey = key;
    p.fitDirty = false;
    return true;
  }

  async _fitEntry(entry, tabId, bounds) {
    const wc = entry.webContents;
    const base = TabPreviewGeometry.widthZoom(bounds.width);
    this._setZoom(wc, base);
    const docHeight = await TabPreviewManager._measureDocHeight(wc);
    if (!this.preview || this.preview.tabId !== tabId) return;
    const zoom = TabPreviewGeometry.fittedZoom(base, bounds.height, docHeight);
    if (zoom !== base) this._setZoom(wc, zoom);
    this.preview.zoom = zoom;
  }

  _watchNavigation(entry) {
    this._unwatchNavigation(entry);
    const onSettled = () => this._onNavigationSettled(entry);
    entry.webContents.on('did-stop-loading', onSettled);
    this._navHook = { entry, onSettled };
  }

  _onNavigationSettled(entry) {
    const p = this.preview;
    if (!p || p.tabId !== entry.id) return;
    p.fitDirty = true;
    const bounds = this._windowRect(p);
    if (bounds && p.shown) this._fitZoom(bounds);
  }

  _unwatchNavigation(entry) {
    const hook = this._navHook;
    if (!hook || (entry && hook.entry !== entry)) return;
    try { hook.entry.webContents.removeListener('did-stop-loading', hook.onSettled); } catch (_) {}
    this._navHook = null;
  }

  _setZoom(wc, zoom) {
    try { if (!wc.isDestroyed()) wc.setZoomFactor(zoom); } catch (_) {}
  }

  _restoreZoom(entry) {
    if (entry) this._setZoom(entry.webContents, entry.zoomLevel || 1);
  }

  _startFrames() {
    this._stopFrames();
    this._frameTimer = setInterval(() => { this._tickFrame(); }, TabPreviewManager.FRAME_INTERVAL_MS);
    if (this._frameTimer && typeof this._frameTimer.unref === 'function') this._frameTimer.unref();
  }

  _stopFrames() {
    if (!this._frameTimer) return;
    clearInterval(this._frameTimer);
    this._frameTimer = null;
  }

  async _tickFrame() {
    const p = this.preview;
    if (!p || !p.shown || this._frameInFlight) return;
    this._frameInFlight = true;
    try {
      const frame = await this.captureFrame();
      if (frame && this.preview === p && p.shown) this._sendFrame(p, frame);
    } catch (_) {}
    finally { this._frameInFlight = false; }
  }

  _sendFrame(p, frame) {
    const host = this.tabViewManager.getEntry(p.hostTabId);
    if (host && !host.webContents.isDestroyed()) {
      host.webContents.send('tab-preview:frame', { tabId: p.tabId, ...frame });
    }
  }

  _tabIdForSender(sender) {
    for (const [id, entry] of this.tabViewManager.tabs) {
      if (entry.webContents === sender) return id;
    }
    return null;
  }

  _isFromHost(e) {
    return !!this.preview && this._tabIdForSender(e.sender) === this.preview.hostTabId;
  }

  _registerIpc() {
    ipcMain.on('tab-preview:rect', (e, rect) => { if (this._isFromHost(e)) this.setRect(rect || {}); });
    ipcMain.on('tab-preview:detach', (e) => { if (this._isFromHost(e)) this.detach(); });
    ipcMain.on('tab-preview:focus', (e) => { if (this._isFromHost(e)) this.focus(); });
    ipcMain.handle('tab-preview:get-enabled', () => ({ success: true, enabled: this.isEnabled() }));
    ipcMain.handle('tab-preview:set-enabled', (_e, enabled) => this.setEnabled(!!enabled));
  }

  static _numericRect(rect) {
    return {
      x: Number(rect.x) || 0,
      y: Number(rect.y) || 0,
      width: Number(rect.width) || 0,
      height: Number(rect.height) || 0,
    };
  }

  static _zoomOf(entry) {
    try { return entry.webContents.getZoomFactor() || 1; } catch (_) { return 1; }
  }

  static async _measureDocHeight(wc) {
    try { return await wc.executeJavaScript(TabPreviewManager.DOC_HEIGHT_SCRIPT, false); } catch (_) { return 0; }
  }

  static _encodeFrame(image, maxWidth, quality) {
    const scaled = image.getSize().width > maxWidth ? image.resize({ width: maxWidth }) : image;
    const out = scaled.getSize();
    return {
      dataUrl: `data:image/jpeg;base64,${scaled.toJPEG(quality).toString('base64')}`,
      width: out.width,
      height: out.height,
    };
  }
}

module.exports = TabPreviewManager;
