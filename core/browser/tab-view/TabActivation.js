const HiddenTabState = require('./HiddenTabState');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabActivation {
  constructor({ mainWindow, registry, channel, layout, emitter }) {
    this._mainWindow = mainWindow;
    this._registry = registry;
    this._channel = channel;
    this._layout = layout;
    this._emitter = emitter;
  }

  switchTo(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry || entry.silent) return { success: false };
    CrashTracer.mark('tab:switch', { from: this._registry.activeTabId, to: tabId, hidden: entry.hidden });
    this._unhide(entry);
    this._hidePrevious(tabId);
    this._show(entry);
    this._announce(entry);
    return { success: true };
  }

  cycle(delta) {
    const visible = this._registry.inStrip();
    if (!visible.length) return { success: false };
    const at = Math.max(0, visible.findIndex((entry) => this._registry.isActive(entry.id)));
    return this.switchTo(visible[(at + delta + visible.length) % visible.length].id);
  }

  selectByIndex(n) {
    const visible = this._registry.inStrip();
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

  _hidePrevious(tabId) {
    const activeId = this._registry.activeTabId;
    if (activeId === null || activeId === tabId) return;
    const previous = this._registry.get(activeId);
    if (previous) previous.view.setVisible(false);
  }

  _show(entry) {
    this._registry.activeTabId = entry.id;
    entry.lastActivatedAt = Date.now();
    entry.view.setVisible(true);
    this._raise(entry);
    this._layout.applyTo(entry);
    try { if (!entry.webContents.isDestroyed()) entry.webContents.focus(); } catch (_) {}
  }

  _raise(entry) {
    try {
      this._mainWindow.contentView.removeChildView(entry.view);
      this._mainWindow.contentView.addChildView(entry.view);
    } catch (_) {}
  }

  _announce(entry) {
    this._emitter.emit('tabSwitched', entry.id);
    this._channel.send('tab:switched', { id: entry.id });
    this._channel.broadcast(entry);
  }
}

module.exports = TabActivation;
