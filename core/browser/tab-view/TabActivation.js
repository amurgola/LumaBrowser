const TabHosts = require('./TabHosts');
const HiddenTabState = require('./HiddenTabState');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabActivation {
  constructor({ hosts, registry, channel, layout, emitter }) {
    this._hosts = hosts;
    this._registry = registry;
    this._channel = channel;
    this._layout = layout;
    this._emitter = emitter;
  }

  switchTo(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry || entry.silent) return { success: false };
    CrashTracer.mark('tab:switch', { from: this._registry.activeIn(entry.hostId), to: tabId, hidden: entry.hidden, windowId: entry.hostId });
    this._unhide(entry);
    this._hidePrevious(entry);
    this._show(entry);
    this._announce(entry);
    return { success: true };
  }

  cycle(delta, hostId = TabHosts.MAIN_ID) {
    const visible = this._registry.inStrip(hostId);
    if (!visible.length) return { success: false };
    const at = Math.max(0, visible.findIndex((entry) => this._registry.isActive(entry.id)));
    return this.switchTo(visible[(at + delta + visible.length) % visible.length].id);
  }

  selectByIndex(n, hostId = TabHosts.MAIN_ID) {
    const visible = this._registry.inStrip(hostId);
    if (!visible.length) return { success: false };
    const target = n <= 0 ? visible[visible.length - 1] : visible[Math.min(n, visible.length) - 1];
    return this.switchTo(target.id);
  }

  _unhide(entry) {
    if (!entry.hidden) return;
    entry.hidden = false;
    HiddenTabState.sync(entry);
    this._channel.broadcast(entry);
  }

  _hidePrevious(entry) {
    const activeId = this._registry.activeIn(entry.hostId);
    if (activeId === null || activeId === entry.id) return;
    const previous = this._registry.get(activeId);
    if (previous) previous.view.setVisible(false);
  }

  _show(entry) {
    this._registry.setActive(entry.hostId, entry.id);
    entry.lastActivatedAt = Date.now();
    entry.view.setVisible(true);
    this._raise(entry);
    this._layout.applyTo(entry);
    try { if (!entry.webContents.isDestroyed()) entry.webContents.focus(); } catch (_) {}
  }

  _raise(entry) {
    const win = this._hosts.liveWindowOf(entry.hostId);
    if (!win) return;
    try {
      win.contentView.removeChildView(entry.view);
      win.contentView.addChildView(entry.view);
    } catch (_) {}
  }

  _announce(entry) {
    if (entry.hostId === TabHosts.MAIN_ID) this._emitter.emit('tabSwitched', entry.id);
    this._emitter.emit('windowTabSwitched', entry.hostId, entry.id);
    this._channel.sendForTab(entry, 'tab:switched', { id: entry.id });
    this._channel.broadcast(entry);
  }
}

module.exports = TabActivation;
