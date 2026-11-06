const path = require('path');

class PaletteView {
  static BACKGROUND = '#00000000';
  static HIDDEN = { x: 0, y: 0, width: 0, height: 0 };
  static HTML = path.join(__dirname, 'ui', 'palette.html');
  static PRELOAD = path.join(__dirname, 'ui', 'palette-preload.js');

  constructor(win, { electron, info = () => ({}) }) {
    this.win = win;
    this._electron = electron;
    this._info = info;
    this.view = null;
    this.visible = false;
    this._ready = false;
    this._pendingShow = null;
    this._returnFocus = null;
    this._onResize = () => { if (this.visible) this._fit(); };
    win.on('resize', this._onResize);
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  show() {
    if (!this.win || this.win.isDestroyed()) return;
    this._ensureView();
    this._returnFocus = this._focusedContents();
    this.visible = true;
    this._raise();
    this._fit();
    this.view.setVisible(true);
    const payload = { ...this._info(), openedAt: Date.now() };
    if (this._ready) this._present(payload);
    else this._pendingShow = payload;
  }

  hide({ restoreFocus = true } = {}) {
    if (!this.visible || !this.view) return;
    this.visible = false;
    this.view.setVisible(false);
    this.view.setBounds(PaletteView.HIDDEN);
    try { this.view.webContents.send('palette:hidden'); } catch (_) {}
    const back = this._returnFocus;
    this._returnFocus = null;
    if (restoreFocus && back && !back.isDestroyed()) back.focus();
  }

  raiseIfVisible() {
    if (this.visible) this._raise();
  }

  isSender(sender) {
    return !!(this.view && sender && this.view.webContents === sender);
  }

  send(channel, payload) {
    if (this.view && !this.view.webContents.isDestroyed()) this.view.webContents.send(channel, payload);
  }

  destroy() {
    try { this.win.removeListener('resize', this._onResize); } catch (_) {}
    if (!this.view) return;
    try { this.win.contentView.removeChildView(this.view); } catch (_) {}
    try { this.view.webContents.close(); } catch (_) {}
    this.view = null;
  }

  _ensureView() {
    if (this.view) return;
    const { WebContentsView } = this._electron;
    this.view = new WebContentsView({
      webPreferences: { preload: PaletteView.PRELOAD, contextIsolation: true, nodeIntegration: false, sandbox: false },
    });
    try { this.view.setBackgroundColor(PaletteView.BACKGROUND); } catch (_) {}
    this.view.setVisible(false);
    this.view.setBounds(PaletteView.HIDDEN);
    this.win.contentView.addChildView(this.view);
    const wc = this.view.webContents;
    wc.once('did-finish-load', () => {
      this._ready = true;
      if (this._pendingShow && this.visible) this._present(this._pendingShow);
      this._pendingShow = null;
    });
    wc.on('blur', () => setTimeout(() => { if (this.visible && !wc.isDestroyed() && !wc.isFocused()) this.hide({ restoreFocus: false }); }, 120));
    wc.loadFile(PaletteView.HTML);
  }

  _present(payload) {
    const wc = this.view.webContents;
    wc.focus();
    wc.send('palette:show', payload);
  }

  _fit() {
    const [width, height] = this.win.getContentSize();
    this.view.setBounds({ x: 0, y: 0, width, height });
  }

  _raise() {
    try {
      this.win.contentView.removeChildView(this.view);
      this.win.contentView.addChildView(this.view);
    } catch (_) {}
  }

  _focusedContents() {
    try {
      const wc = this._electron.webContents.getFocusedWebContents();
      return wc && !(this.view && wc === this.view.webContents) ? wc : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = PaletteView;
