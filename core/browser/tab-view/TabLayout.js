const TabHosts = require('./TabHosts');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabLayout {
  static UNSEEN_VIEWPORT = { width: 1280, height: 800 };

  constructor(registry, hosts, emitter) {
    this._registry = registry;
    this._hosts = hosts;
    this._emitter = emitter;
    this._fullView = new Set();
    this._lent = new WeakSet();
    this._told = new WeakSet();
  }

  setFullView(hostId, on) {
    if (on) this._fullView.add(hostId); else this._fullView.delete(hostId);
  }

  get currentBounds() {
    return this._hosts.boundsOf(TabHosts.MAIN_ID);
  }

  setBounds(bounds, hostId = TabHosts.MAIN_ID) {
    const rounded = TabLayout._rounded(bounds);
    this._hosts.setBounds(hostId, rounded);
    this._applyToActive(hostId);
    this.refitBackground();
    if (hostId === TabHosts.MAIN_ID) this._emitter.emit('boundsChanged', rounded);
  }

  applyTo(entry) {
    try {
      if (this._registry.isActive(entry.id)) this._placeOnScreen(entry);
      else this._placeInBackground(entry);
    } catch (err) {
      console.warn('[TabViewManager] setBounds failed:', err.message);
    }
  }

  setViewSize(entry, size) {
    const sized = !!size && size.width > 0 && size.height > 0;
    entry.viewSize = sized ? { width: Math.round(size.width), height: Math.round(size.height) } : null;
    try {
      if (!sized && !this._registry.isActive(entry.id)) this._lend(entry, null);
      else this.applyTo(entry);
    } catch (err) {
      console.warn('[TabViewManager] setBounds failed:', err.message);
    }
  }

  refitBackground() {
    for (const entry of this._registry.entries()) {
      if (this._registry.isActive(entry.id)) continue;
      if (entry.viewSize || entry.silent || this._lent.has(entry)) this.applyTo(entry);
    }
  }

  _placeOnScreen(entry) {
    this._lent.delete(entry);
    this.stopTelling(entry);
    const area = this._areaOf(entry.hostId);
    if (!area.width || !area.height) {
      CrashTracer.mark('tab:bounds-hide', { id: entry.id });
      entry.view.setVisible(false);
      return;
    }
    entry.view.setVisible(true);
    entry.view.setBounds(this._onScreenBounds(entry, area));
  }

  _placeInBackground(entry) {
    if (entry.viewSize || entry.silent) { this._lend(entry, entry.viewSize); return; }
    this._unlend(entry);
    if (entry.hidden) this._tellViewport(entry, null);
    const area = this._areaOf(entry.hostId);
    if (!area.width || !area.height) {
      CrashTracer.mark('tab:bounds-hide', { id: entry.id });
      entry.view.setVisible(false);
      return;
    }
    entry.view.setBounds({ x: area.x || 0, y: area.y || 0, width: area.width, height: area.height });
  }

  _lend(entry, size) {
    const cover = this._coverOf(entry.hostId);
    if (!cover) { this._unlend(entry); this._tellViewport(entry, size); return; }
    this._lower(entry);
    const width = size ? Math.min(size.width, cover.width) : cover.width;
    const height = size ? Math.min(size.height, cover.height) : cover.height;
    entry.view.setBounds({ x: cover.x, y: cover.y, width, height });
    entry.view.setVisible(true);
    this._lent.add(entry);
    if (this._isShowing(entry.hostId)) this.stopTelling(entry);
    else this._tellViewport(entry, { width, height });
  }

  _tellViewport(entry, size) {
    if (!(entry.silent || entry.hidden) || !TabLayout._hasLivePage(entry)) return;
    const area = this._hosts.boundsOf(entry.hostId);
    const seen = area.width && area.height ? { width: area.width, height: area.height } : TabLayout.UNSEEN_VIEWPORT;
    const viewSize = size || seen;
    entry.view.webContents.enableDeviceEmulation({
      screenPosition: 'desktop', screenSize: viewSize, viewPosition: { x: 0, y: 0 }, viewSize, deviceScaleFactor: 0, scale: 1,
    });
    this._told.add(entry);
  }

  stopTelling(entry) {
    if (!this._told.has(entry)) return;
    this._told.delete(entry);
    if (TabLayout._hasLivePage(entry)) entry.view.webContents.disableDeviceEmulation();
  }

  static _hasLivePage(entry) {
    const wc = entry.view.webContents;
    return !wc.isDestroyed() && !!wc.getURL() && !wc.isCrashed();
  }

  _isShowing(hostId) {
    const win = this._hosts.liveWindowOf(hostId);
    return !!win && win.isVisible() && !win.isMinimized();
  }

  _unlend(entry) {
    if (!this._lent.has(entry)) return;
    this._lent.delete(entry);
    entry.view.setVisible(false);
  }

  _coverOf(hostId) {
    const activeId = this._registry.activeIn(hostId);
    const active = activeId === null ? null : this._registry.get(activeId);
    const area = this._areaOf(hostId);
    if (!active || !area.width || !area.height) return null;
    return this._onScreenBounds(active, area);
  }

  _onScreenBounds(entry, area) {
    const x = area.x || 0;
    const y = area.y || 0;
    const size = entry.viewSize;
    if (!size || this._fullView.has(entry.hostId)) return { x, y, width: area.width, height: area.height };
    const width = Math.min(size.width, area.width);
    const height = Math.min(size.height, area.height);
    return { x: x + Math.floor((area.width - width) / 2), y, width, height };
  }

  _lower(entry) {
    const win = this._hosts.liveWindowOf(entry.hostId);
    if (!win) return;
    const children = win.contentView.children;
    if (Array.isArray(children) && this._isUnderActive(children, entry)) return;
    win.contentView.removeChildView(entry.view);
    win.contentView.addChildView(entry.view, 0);
  }

  _isUnderActive(children, entry) {
    const activeId = this._registry.activeIn(entry.hostId);
    const active = activeId === null ? null : this._registry.get(activeId);
    const at = children.indexOf(entry.view);
    return !!active && at >= 0 && at < children.indexOf(active.view);
  }

  _areaOf(hostId) {
    return this._fullView.has(hostId) ? this._windowArea(hostId) : this._hosts.boundsOf(hostId);
  }

  _windowArea(hostId) {
    const win = this._hosts.liveWindowOf(hostId);
    try {
      const c = win.getContentBounds();
      return { x: 0, y: 0, width: c.width, height: c.height };
    } catch (_) {
      return this._hosts.boundsOf(hostId);
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
