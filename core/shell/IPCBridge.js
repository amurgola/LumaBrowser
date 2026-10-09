const { ipcMain } = require('electron');
const ScopedIPCBridge = require('./ipc-bridge/ScopedIPCBridge');

class IPCBridge {
  constructor() {
    this._handlers = new Map();
    this._listeners = new Map();
  }

  handle(namespace, channel, handler) {
    const fullChannel = IPCBridge._channel(namespace, channel);
    if (this._handlers.has(fullChannel)) {
      console.warn(`IPCBridge: overwriting handler for "${fullChannel}"`);
      ipcMain.removeHandler(fullChannel);
    }
    ipcMain.handle(fullChannel, handler);
    this._handlers.set(fullChannel, handler);
  }

  on(namespace, channel, handler) {
    const fullChannel = IPCBridge._channel(namespace, channel);
    ipcMain.on(fullChannel, handler);
    this._listeners.set(fullChannel, handler);
  }

  removeHandle(namespace, channel) {
    this._removeHandler(IPCBridge._channel(namespace, channel));
  }

  removeOn(namespace, channel) {
    this._removeListener(IPCBridge._channel(namespace, channel));
  }

  forExtension(extensionId) {
    return new ScopedIPCBridge(this, `ext.${extensionId}`);
  }

  forCore(coreName) {
    return new ScopedIPCBridge(this, `core.${coreName}`);
  }

  removeAllForExtension(extensionId) {
    const prefix = `ext.${extensionId}.`;
    for (const channel of [...this._handlers.keys()]) {
      if (channel.startsWith(prefix)) this._removeHandler(channel);
    }
    for (const channel of [...this._listeners.keys()]) {
      if (channel.startsWith(prefix)) this._removeListener(channel);
    }
  }

  getRegisteredChannels() {
    return {
      handlers: [...this._handlers.keys()],
      listeners: [...this._listeners.keys()],
    };
  }

  destroy() {
    for (const channel of [...this._handlers.keys()]) this._removeHandler(channel);
    for (const channel of [...this._listeners.keys()]) this._removeListener(channel);
  }

  _removeHandler(fullChannel) {
    ipcMain.removeHandler(fullChannel);
    this._handlers.delete(fullChannel);
  }

  _removeListener(fullChannel) {
    const handler = this._listeners.get(fullChannel);
    if (!handler) return;
    ipcMain.removeListener(fullChannel, handler);
    this._listeners.delete(fullChannel);
  }

  static _channel(namespace, channel) {
    return `${namespace}.${channel}`;
  }
}

module.exports = IPCBridge;
