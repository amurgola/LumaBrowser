class HookBaseUrls {
  constructor({ getPort, getHostService, getWebServer }) {
    this._getPort = getPort;
    this._getHostService = getHostService;
    this._getWebServer = getWebServer;
  }

  getter() {
    return () => this.get();
  }

  get() {
    const port = this._getPort();
    const out = { local: `http://127.0.0.1:${port}` };
    try {
      this._addLan(out, port);
      this._addPublic(out);
    } catch (_) {}
    return out;
  }

  _addLan(out, port) {
    const host = this._getHostService();
    const lan = host ? host.lanAddress() : null;
    if (lan && lan !== '127.0.0.1') out.lan = `http://${lan}:${port}`;
  }

  _addPublic(out) {
    const web = this._getWebServer();
    const host = this._getHostService();
    if (!web || !host || !web.isRunning()) return;
    const status = host.getShareLinkStatus();
    if (status && status.baseUrl) out.public = status.baseUrl;
  }
}

module.exports = HookBaseUrls;
