class ScopedIPCBridge {
  constructor(bridge, namespace) {
    this._bridge = bridge;
    this.namespace = namespace;
  }

  handle(channel, handler) {
    this._bridge.handle(this.namespace, channel, handler);
  }

  on(channel, handler) {
    this._bridge.on(this.namespace, channel, handler);
  }

  removeHandle(channel) {
    this._bridge.removeHandle(this.namespace, channel);
  }

  removeOn(channel) {
    this._bridge.removeOn(this.namespace, channel);
  }

  send(window, channel, data) {
    if (window && !window.isDestroyed()) {
      window.webContents.send(`${this.namespace}.${channel}`, data);
    }
  }
}

module.exports = ScopedIPCBridge;
