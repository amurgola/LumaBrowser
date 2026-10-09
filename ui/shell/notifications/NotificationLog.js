import NotificationLogHtml from './NotificationLogHtml.js';

export default class NotificationLog {
  static AUTOCLOSE_MS = 5000;

  static MAX_ENTRIES = 10;

  constructor() {
    this.entries = [];
    this.visible = false;
    this._hovered = false;
    this._timer = null;
    this._tile = null;
  }

  install() {
    if (window.ipcBridge && typeof window.ipcBridge.on === 'function') {
      window.ipcBridge.on('on-demand:tile', (rect) => this._setTile(rect));
    }
  }

  add(message, type = 'info') {
    this.entries.unshift({ message, type, time: new Date().toLocaleTimeString() });
    if (this.entries.length > NotificationLog.MAX_ENTRIES) this.entries.length = NotificationLog.MAX_ENTRIES;
    this.visible = true;
    this.render();
    this._scheduleAutoClose();
  }

  render() {
    if (!this.visible || !window.chromeOverlayAPI) return;
    window.chromeOverlayAPI.show({
      id: 'notif',
      html: NotificationLogHtml.render(this.entries, NotificationLog.AUTOCLOSE_MS),
      ...NotificationLog.place(window.innerWidth, window.innerHeight, this._tile, this.entries.length),
    });
  }

  static place(innerWidth, innerHeight, tile, count) {
    const width = Math.min(360, innerWidth - 24);
    const x = innerWidth - width - 20;
    let bottom = innerHeight - 40;
    const t = tile;
    if (t && t.x < x + width && t.x + t.width > x && t.y < bottom && t.y + t.height > bottom - 240) {
      bottom = Math.max(60, t.y - 12);
    }
    return { x, bottom, width, maxHeight: 240, estHeight: Math.min(240, count * 34 + 44) };
  }

  hide() {
    this.visible = false;
    this._hovered = false;
    this._clearTimer();
    if (window.chromeOverlayAPI) window.chromeOverlayAPI.hide('notif');
  }

  setHovered(hovering) {
    this._hovered = !!hovering;
    if (this._hovered) {
      this._clearTimer();
      return;
    }
    this.render();
    this._scheduleAutoClose();
  }

  _scheduleAutoClose() {
    this._clearTimer();
    if (this._hovered) return;
    this._timer = setTimeout(() => { this._timer = null; this.hide(); }, NotificationLog.AUTOCLOSE_MS);
  }

  _clearTimer() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  _setTile(rect) {
    this._tile = rect || null;
    if (this.visible) this.render();
  }
}
