const TabHosts = require('./TabHosts');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabLayout {
  constructor(registry, hosts, emitter) {
    this._registry = registry;
    this._hosts = hosts;
    this._emitter = emitter;
  }

  get currentBounds() {
    return this._hosts.boundsOf(TabHosts.MAIN_ID);
  }

  setBounds(bounds, hostId = TabHosts.MAIN_ID) {
    const rounded = TabLayout._rounded(bounds);
    this._hosts.setBounds(hostId, rounded);
    this._applyToActive(hostId);
    if (hostId === TabHosts.MAIN_ID) this._emitter.emit('boundsChanged', rounded);
  }

  applyTo(entry) {
    const b = this._hosts.boundsOf(entry.hostId);
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

  _applyToActive(hostId) {
    const activeId = this._registry.activeIn(hostId);
    if (activeId === null) return;
    const entry = this._registry.get(activeId);
    if (entry) this.applyTo(entry);
  }
}

module.exports = TabLayout;
