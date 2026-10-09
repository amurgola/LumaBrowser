export default class PreviewSlot {
  constructor(ctx) {
    this._ctx = ctx;
    this._node = null;
    this._raf = 0;
    this._lastKey = '';
    this._ro = null;
  }

  bind(slotEl) {
    if (this._node === slotEl) { this.poke(); return; }
    this._disconnect();
    this._node = slotEl;
    this._lastKey = '';
    if (this._node && window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this.poke());
      try { this._ro.observe(this._node); } catch (_) {}
    }
    this.poke();
  }

  poke() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => this._measure());
  }

  release() {
    this._disconnect();
    if (!this._node) return;
    this._node = null;
    this._lastKey = '';
    const api = this._ctx.api;
    if (api && api.tabPreview) {
      try { api.tabPreview.rect({ x: 0, y: 0, width: 0, height: 0, visible: false }); } catch (_) {}
    }
  }

  _measure() {
    this._raf = 0;
    const api = this._ctx.api;
    if (!api || !api.tabPreview || !this._node || !this._node.isConnected) return;
    const rect = this._rect();
    const key = rect.x + ',' + rect.y + ',' + rect.width + ',' + rect.height + ',' + rect.visible;
    if (key === this._lastKey) return;
    this._lastKey = key;
    try { api.tabPreview.rect(rect); } catch (_) {}
  }

  _rect() {
    const r = this._node.getBoundingClientRect();
    const scroll = this._ctx.els.scroll;
    const view = scroll ? scroll.getBoundingClientRect() : null;
    const visible = !!(view && r.width > 0 && r.height > 0 && r.top >= view.top && r.bottom <= view.bottom);
    return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), visible };
  }

  _disconnect() {
    if (this._ro) { try { this._ro.disconnect(); } catch (_) {} this._ro = null; }
  }
}
