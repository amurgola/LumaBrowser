const { WebContentsView, ipcMain, session } = require('electron');
const path = require('path');

class ChromeOverlay {
  static SURFACE_COLOR = '#141b2c';
  static DEFAULT_MAX_HEIGHT = 600;
  static DEFAULT_EST_HEIGHT = 220;
  static WARM_LAYERS = ['popup', 'notif'];
  static HIDDEN_BOUNDS = { x: 0, y: 0, width: 0, height: 0 };

  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.layers = new Map();
    this._registerIpc();
    this._warmLayers();
  }

  show({ id = 'popup', html, x, y, bottom, width, maxHeight, estHeight }) {
    const layer = this._layer(id);
    this._revealLayer(layer, { x, y, bottom, width, maxHeight });
    this._placeLayer(layer, ChromeOverlay._estimatedHeight(maxHeight, estHeight));
    this._sendContent(layer, { html, maxHeight });
  }

  setActive({ id = 'popup', activeIndex } = {}) {
    const layer = this.layers.get(id);
    if (layer && layer.visible) layer.view.webContents.send('overlay:set-active', { activeIndex });
  }

  hide({ id = 'popup' } = {}) {
    const layer = this.layers.get(id);
    if (!layer) return;
    layer.visible = false;
    layer.pending = null;
    layer.view.setVisible(false);
    layer.view.setBounds(ChromeOverlay.HIDDEN_BOUNDS);
  }

  measure(sender, { height } = {}) {
    const layer = this.layers.get(this._idForSender(sender));
    if (!layer || !layer.visible || !layer.pending) return;
    this._placeLayer(layer, ChromeOverlay._measuredHeight(height, layer.pending.maxHeight));
  }

  raiseVisible() {
    for (const layer of this.layers.values()) {
      if (layer.visible) this._raise(layer);
    }
  }

  destroy() {
    for (const layer of this.layers.values()) {
      try { this.mainWindow.contentView.removeChildView(layer.view); } catch (_) {}
      try { layer.view.webContents.destroy(); } catch (_) {}
    }
    this.layers.clear();
  }

  _warmLayers() {
    try {
      for (const id of ChromeOverlay.WARM_LAYERS) this._layer(id);
    } catch (_) {}
  }

  _layer(id) {
    return this.layers.get(id) || this._createLayer(id);
  }

  _createLayer(id) {
    const view = this._createView();
    const layer = { id, view, visible: false, pending: null, ready: false, pendingContent: null };
    this._wireLayerLoad(layer);
    view.webContents.loadFile(path.join(__dirname, 'overlay', 'overlay.html'));
    this.layers.set(id, layer);
    return layer;
  }

  _createView() {
    const view = new WebContentsView({
      webPreferences: {
        session: session.defaultSession,
        preload: path.join(__dirname, 'overlay', 'overlay-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });
    try { view.setBackgroundColor(ChromeOverlay.SURFACE_COLOR); } catch (_) {}
    view.setVisible(false);
    view.setBounds(ChromeOverlay.HIDDEN_BOUNDS);
    this.mainWindow.contentView.addChildView(view);
    return view;
  }

  _wireLayerLoad(layer) {
    const wc = layer.view.webContents;
    wc.once('did-finish-load', () => {
      layer.ready = true;
      if (layer.pendingContent) wc.send('overlay:content', layer.pendingContent);
      this._restoreShellFocus();
    });
    wc.on('focus', () => this._restoreShellFocus());
  }

  _revealLayer(layer, pending) {
    const wasVisible = layer.visible;
    layer.pending = pending;
    layer.visible = true;
    if (!wasVisible) this._raise(layer);
    layer.view.setVisible(true);
  }

  _placeLayer(layer, height) {
    const { x, y, bottom, width } = layer.pending;
    const top = bottom != null ? Math.max(0, bottom - height) : (y || 0);
    layer.view.setBounds({ x: Math.round(x), y: Math.round(top), width: Math.round(width), height: Math.max(0, height) });
  }

  _sendContent(layer, content) {
    if (layer.ready) layer.view.webContents.send('overlay:content', content);
    else layer.pendingContent = content;
  }

  _restoreShellFocus() {
    try {
      const win = this.mainWindow;
      if (!win || win.isDestroyed() || !win.isFocused()) return;
      const wc = win.webContents;
      if (wc && !wc.isDestroyed() && !wc.isFocused()) wc.focus();
    } catch (_) {}
  }

  _idForSender(sender) {
    for (const [id, layer] of this.layers) {
      if (layer.view && layer.view.webContents === sender) return id;
    }
    return null;
  }

  _raise(layer) {
    try {
      this.mainWindow.contentView.removeChildView(layer.view);
      this.mainWindow.contentView.addChildView(layer.view);
    } catch (_) {}
  }

  _forward(channel, sender, payload) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const layer = this._idForSender(sender);
    const p = payload || {};
    this.mainWindow.webContents.send(channel, { ...p, layer, id: p.id != null ? p.id : layer });
  }

  _registerIpc() {
    ipcMain.on('chrome-overlay:show', (_e, payload) => this.show(payload || {}));
    ipcMain.on('chrome-overlay:set-active', (_e, p) => this.setActive(p || {}));
    ipcMain.on('chrome-overlay:hide', (_e, p) => this.hide(p || {}));
    ipcMain.on('chrome-overlay:measure', (e, p) => this.measure(e.sender, p || {}));
    ipcMain.on('chrome-overlay:action', (e, payload) => this._forward('chrome-overlay:action', e.sender, payload));
    ipcMain.on('chrome-overlay:hover', (e, payload) => this._forward('chrome-overlay:hover', e.sender, payload));
  }

  static _estimatedHeight(maxHeight, estHeight) {
    return Math.round(Math.min(maxHeight || ChromeOverlay.DEFAULT_MAX_HEIGHT, estHeight || ChromeOverlay.DEFAULT_EST_HEIGHT));
  }

  static _measuredHeight(height, maxHeight) {
    return Math.max(0, Math.min(Math.round(height || 0), Math.round(maxHeight || ChromeOverlay.DEFAULT_MAX_HEIGHT)));
  }
}

module.exports = ChromeOverlay;
