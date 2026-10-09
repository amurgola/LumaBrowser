class HostListeners {
  constructor() {
    this._tls = null;
    this._web = null;
    this._rpcLending = null;
  }

  setTlsServer(server) {
    this._tls = server || null;
  }

  setWebServer(server) {
    this._web = server || null;
  }

  setRpcLending(service) {
    this._rpcLending = service || null;
  }

  hasWebServer() {
    return !!this._web;
  }

  getRpcLending() {
    return this._rpcLending;
  }

  async startOnEnable({ tlsPort, webPort, webEnabled }) {
    if (this._tls) HostListeners._warnOnFailure('TLS listener start failed:', await this._tls.start(tlsPort));
    if (webEnabled && this._web) HostListeners._warnOnFailure('web app start failed:', await this._web.start(webPort));
  }

  async stopOnDisable() {
    if (this._tls) await this._tls.stop();
    if (this._web) await this._web.stop();
    if (this._rpcLending) await HostListeners._quietly(() => this._rpcLending.release());
  }

  async shutdown() {
    if (this._tls) await HostListeners._quietly(() => this._tls.stop());
    if (this._web) await HostListeners._quietly(() => this._web.stop());
    if (this._rpcLending) await HostListeners._quietly(() => this._rpcLending.shutdown());
  }

  startTls(port) {
    return this._tls.start(port);
  }

  hasTlsServer() {
    return !!this._tls;
  }

  isTlsRunning() {
    return !!(this._tls && this._tls.isRunning());
  }

  tlsFingerprint() {
    return this._tls ? this._tls.getFingerprint() : null;
  }

  tlsInfo() {
    if (!this.isTlsRunning()) return null;
    return { port: this._tls.getPort(), fingerprint256: this._tls.getFingerprint() };
  }

  startWeb(port) {
    return this._web.start(port);
  }

  stopWeb() {
    return this._web.stop();
  }

  isWebRunning() {
    return !!(this._web && this._web.isRunning());
  }

  registerWebMount(prefix, handlers) {
    if (!this._web || typeof this._web.registerMount !== 'function') return () => {};
    return this._web.registerMount(prefix, handlers);
  }

  gpuLendSupported() {
    return !!(this._rpcLending && this._rpcLending.isSupported());
  }

  gpuLendStatus() {
    return this._rpcLending ? this._rpcLending.getStatus() : { active: false };
  }

  releaseGpusNow() {
    if (!this._rpcLending) return;
    try {
      const pending = this._rpcLending.release();
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    } catch (_) {}
  }

  static _warnOnFailure(label, result) {
    if (!result.success) console.warn(`[sharing] ${label}`, result.error);
  }

  static async _quietly(fn) {
    try {
      await fn();
    } catch (_) {}
  }
}

module.exports = HostListeners;
