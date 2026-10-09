class AllRenderers {
  constructor(webContents) {
    this._webContents = webContents;
  }

  send(channel, payload) {
    try {
      for (const wc of this._webContents.getAllWebContents()) {
        if (!wc.isDestroyed()) wc.send(channel, payload);
      }
    } catch (_) {}
  }

  emitter(channel) {
    return (type, payload) => this.send(channel, { type, payload });
  }
}

module.exports = AllRenderers;
