class TabFullscreen {
  constructor({ registry, hosts, layout, channel }) {
    this._registry = registry;
    this._hosts = hosts;
    this._layout = layout;
    this._channel = channel;
    this._active = new Map();
  }

  wire(entry) {
    const wc = entry.webContents;
    wc.on('enter-html-full-screen', () => this.enter(entry));
    wc.on('leave-html-full-screen', () => this.leave(entry));
  }

  isFullscreen(entry) {
    const state = entry && this._active.get(entry.hostId);
    return !!(state && state.tabId === entry.id);
  }

  enter(entry) {
    const win = this._hosts.liveWindowOf(entry.hostId);
    if (!win || this._active.has(entry.hostId)) return;
    const onResize = () => this._layout.applyTo(entry);
    this._active.set(entry.hostId, { tabId: entry.id, wasFullScreen: win.isFullScreen(), onResize, win });
    this._layout.setFullView(entry.hostId, true);
    win.on('resize', onResize);
    if (!win.isFullScreen()) win.setFullScreen(true);
    this._layout.applyTo(entry);
    this._channel.sendForTab(entry, 'tab-view:page-fullscreen', { tabId: entry.id, on: true });
  }

  leave(entry) {
    const state = this._active.get(entry.hostId);
    if (!state || state.tabId !== entry.id) return;
    this._active.delete(entry.hostId);
    this._layout.setFullView(entry.hostId, false);
    try { state.win.removeListener('resize', state.onResize); } catch (_) {}
    if (!state.wasFullScreen && !state.win.isDestroyed()) state.win.setFullScreen(false);
    this._layout.applyTo(entry);
    this._channel.sendForTab(entry, 'tab-view:page-fullscreen', { tabId: entry.id, on: false });
  }

  exitPage(entry) {
    if (!this.isFullscreen(entry)) return false;
    try { entry.webContents.executeJavaScript('document.exitFullscreen && document.fullscreenElement && document.exitFullscreen()', true).catch(() => {}); } catch (_) {}
    this.leave(entry);
    return true;
  }

  onSwitched(hostId) {
    const state = this._active.get(hostId);
    if (!state) return;
    const entry = this._registry.get(state.tabId);
    if (entry && !this._registry.isActive(entry.id)) this.exitPage(entry);
  }
}

module.exports = TabFullscreen;
