class TabHosts {
  static MAIN_ID = 0;
  static ZERO_BOUNDS = { x: 0, y: 0, width: 0, height: 0 };

  constructor(mainWindow) {
    this._hosts = new Map();
    this._nextId = TabHosts.MAIN_ID + 1;
    this._hosts.set(TabHosts.MAIN_ID, TabHosts._host(TabHosts.MAIN_ID, mainWindow));
  }

  add(window, options = {}) {
    const id = this._nextId++;
    this._hosts.set(id, { ...TabHosts._host(id, window), privatePartition: options.privatePartition || null });
    return id;
  }

  privatePartitionOf(hostId) {
    const host = this._hosts.get(hostId);
    return (host && host.privatePartition) || null;
  }

  remove(hostId) {
    if (hostId === TabHosts.MAIN_ID) return false;
    return this._hosts.delete(hostId);
  }

  has(hostId) {
    return this._hosts.has(hostId);
  }

  ids() {
    return [...this._hosts.keys()];
  }

  resolve(hostId) {
    return Number.isInteger(hostId) && this._hosts.has(hostId) ? hostId : TabHosts.MAIN_ID;
  }

  windowOf(hostId) {
    const host = this._hosts.get(hostId);
    return host ? host.window : null;
  }

  liveWindowOf(hostId) {
    const win = this.windowOf(hostId);
    return TabHosts.isLive(win) ? win : null;
  }

  boundsOf(hostId) {
    const host = this._hosts.get(hostId);
    return host ? host.bounds : TabHosts.ZERO_BOUNDS;
  }

  setBounds(hostId, bounds) {
    const host = this._hosts.get(hostId);
    if (host) host.bounds = bounds;
  }

  idForSender(webContents) {
    if (!webContents) return TabHosts.MAIN_ID;
    for (const host of this._hosts.values()) {
      if (TabHosts.isLive(host.window) && host.window.webContents === webContents) return host.id;
    }
    return TabHosts.MAIN_ID;
  }

  isChrome(webContents) {
    if (!webContents) return false;
    for (const host of this._hosts.values()) {
      if (TabHosts.isLive(host.window) && host.window.webContents === webContents) return true;
    }
    return false;
  }

  static isLive(win) {
    return !!win && !(typeof win.isDestroyed === 'function' && win.isDestroyed());
  }

  static _host(id, window) {
    return { id, window, bounds: { ...TabHosts.ZERO_BOUNDS } };
  }
}

module.exports = TabHosts;
