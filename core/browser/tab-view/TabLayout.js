const CrashTracer = require('../../diagnostics/CrashTracer');

class TabLayout {
  constructor(registry, emitter) {
    this._registry = registry;
    this._emitter = emitter;
    this.currentBounds = { x: 0, y: 0, width: 0, height: 0 };
  }

  setBounds(bounds) {
    this.currentBounds = TabLayout._rounded(bounds);
    this._applyToActive();
    this._emitter.emit('boundsChanged', this.currentBounds);
  }

  applyTo(entry) {
    const b = this.currentBounds;
    try {
      if (!b.width || !b.height) {
        CrashTracer.mark('tab:bounds-hide', { id: entry.id });
        entry.view.setVisible(false);
        return;
      }
      if (this._registry.isActive(entry.id)) entry.view.setVisible(true);
      entry.view.setBounds({ x: b.x || 0, y: b.y || 0, width: b.width, height: b.height });
    } catch (err) {
      console.warn('[TabViewManager] setBounds failed:', err.message);
    }
  }

  static _rounded(bounds) {
    return {
      x: Math.round(bounds.x || 0),
      y: Math.round(bounds.y || 0),
      width: Math.round(bounds.width || 0),
      height: Math.round(bounds.height || 0),
    };
  }

  _applyToActive() {
    if (this._registry.activeTabId === null) return;
    const entry = this._registry.get(this._registry.activeTabId);
    if (entry) this.applyTo(entry);
  }
}

module.exports = TabLayout;
