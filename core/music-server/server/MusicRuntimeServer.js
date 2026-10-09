const BaseRuntimeServer = require('../../shared/runtime/BaseRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');
const WslHostFailover = require('./WslHostFailover');

class MusicRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('music');
  static HEALTH_REQUEST_TIMEOUT_MS = 2000;
  static SETTLE_TIMEOUT_MS = 1200000;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: MusicRuntimeServer.PORT_RANGE, ...opts });
  }

  constructor() {
    super();
    this._hosts = new WslHostFailover({ logTag: this._logTag() });
  }

  _logTag() { return '[music-server]'; }
  _processNoun() { return 'sgl-omni'; }
  _loadingLabel() { return 'music server'; }
  _settleTimeoutMs() { return MusicRuntimeServer.SETTLE_TIMEOUT_MS; }

  _initLaunchState(launch) {
    this._hosts = new WslHostFailover({
      plan: launch.plan || {},
      logTag: this._logTag(),
      onHostChange: (host) => { this.plan.host = host; },
    });
  }

  async _healthCheck() {
    return this._hosts.probe(this.port, { timeoutMs: MusicRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS });
  }

  async _beforeForceKill() {
    await this._hosts.killPort(this.port);
  }

  _afterStopped() {
    this._hosts.killPortDetached(this.port);
  }

  _extraStatus() {
    return { mode: this._hosts.mode, distro: this._hosts.distro, host: (this.plan && this.plan.host) || null };
  }
}

module.exports = MusicRuntimeServer;
