const axios = require('axios');
const AuthProxy = require('./AuthProxy');
const BaseRuntimeServer = require('../../shared/runtime/BaseRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');

class ImageRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('image');
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: ImageRuntimeServer.PORT_RANGE, ...opts });
  }

  constructor({ apiSecurity } = {}) {
    super();
    this.privatePort = null;
    this.apiSecurity = apiSecurity || null;
    this.authProxy = null;
  }

  _logTag() { return '[image-server]'; }
  _processNoun() { return 'sd-server'; }
  _loadingLabel() { return 'image server'; }

  _initLaunchState(launch) {
    this.privatePort = typeof launch.plan.privatePort === 'number' ? launch.plan.privatePort : launch.plan.port;
  }

  async _healthCheck() {
    const res = await axios.get(`http://127.0.0.1:${this.privatePort}/sdcpp/v1/jobs`, {
      timeout: ImageRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });
    return res.status >= 200 && res.status < 600;
  }

  async _afterHealthy() {
    if (!this._needsProxy()) return;
    try {
      this.authProxy = new AuthProxy({ apiSecurity: this.apiSecurity });
      await this.authProxy.start({ publicPort: this.port, privatePort: this.privatePort });
    } catch (err) {
      await this._failProxyStart(err);
    }
  }

  async _beforeForceKill() {
    if (!this.authProxy) return;
    try { await this.authProxy.stop(); } catch (_) {}
    this.authProxy = null;
  }

  _extraStatus() {
    return {
      privatePort: this.privatePort,
      authProxy: this.authProxy ? this.authProxy.isRunning() : false,
    };
  }

  _needsProxy() {
    return !!this.apiSecurity && this.privatePort !== this.port;
  }

  async _failProxyStart(err) {
    const message = `Auth proxy failed to start: ${err.message}`;
    this.authProxy = null;
    await this._forceKill();
    this.lastError = message;
    this._setState('error', { error: message });
    throw new Error(message);
  }
}

module.exports = ImageRuntimeServer;
