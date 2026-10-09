const BaseRuntimeServer = require('../../shared/runtime/BaseRuntimeServer');
const FreePort = require('../../shared/runtime/FreePort');
const FailureInterpreter = require('./FailureInterpreter');
const LlmCapsProbe = require('./LlmCapsProbe');
const WslHostFailover = require('../../music-server/server/WslHostFailover');

class LlmRuntimeServer extends BaseRuntimeServer {
  static PORT_RANGE = FreePort.portWindow('llm');
  static VRAM_RECLAIM_SETTLE_MS = 600;
  static HEALTH_REQUEST_TIMEOUT_MS = 1500;
  static ERROR_TAIL_LINES = 15;

  static findFreePort(opts = {}) {
    return FreePort.findFreePort({ range: LlmRuntimeServer.PORT_RANGE, ...opts });
  }

  constructor() {
    super();
    this.dirty = false;
    this.authKey = null;
    this.modelPath = null;
    this.caps = null;
    this.recallProbe = null;
    this._hosts = new WslHostFailover({ logTag: this._logTag() });
  }

  _logTag() { return '[llm-server]'; }
  _processNoun() { return 'llama-server'; }
  _loadingLabel() { return 'server'; }

  baseUrl() {
    return `http://${this._hosts.host}:${this.port}`;
  }

  markDirty() {
    if (this.state === 'ready' || this.state === 'starting') this.dirty = true;
  }

  async ensureStopped() {
    this._disarmIdleTimer();
    const hadChild = await this._reapAnyChild();
    this.authKey = null;
    this.dirty = false;
    this._setState('idle');
    if (hadChild) await BaseRuntimeServer.sleep(LlmRuntimeServer.VRAM_RECLAIM_SETTLE_MS);
    return this.getStatus();
  }

  _initLaunchState(launch) {
    this.dirty = false;
    this.authKey = LlmRuntimeServer._nonEmptyString(launch.authKey);
    this.modelPath = LlmRuntimeServer._nonEmptyString(launch.modelPath);
    this._hosts = new WslHostFailover({
      plan: { ...(launch.plan || {}), host: null },
      logTag: this._logTag(),
      onHostChange: (host) => { if (this.plan) this.plan.host = host; },
    });
  }

  async _healthCheck() {
    return this._hosts.probe(this.port, { timeoutMs: LlmRuntimeServer.HEALTH_REQUEST_TIMEOUT_MS });
  }

  async _afterHealthy() {
    this.caps = await new LlmCapsProbe({
      baseUrl: this.baseUrl(),
      authKey: this.authKey,
      modelPath: this.modelPath,
      recallProbe: this.recallProbe,
      logTag: this._logTag(),
    }).execute();
  }

  async _beforeForceKill() {
    await this._hosts.killPort(this.port);
  }

  _afterStopped() {
    this.authKey = null;
    this.dirty = false;
    this.caps = null;
    this.modelPath = null;
    this._hosts.killPortDetached(this.port);
  }

  _extraStatus() {
    return {
      dirty: this.dirty,
      lastErrorInfo: this._lastErrorInfo(),
      caps: this.caps,
      modelPath: this.modelPath || null,
      host: this._hosts.host,
      mode: this._hosts.mode,
    };
  }

  _lastErrorInfo() {
    if (this.state !== 'error') return null;
    const tail = this.logRing
      .filter((e) => e.stream === 'stderr')
      .slice(-LlmRuntimeServer.ERROR_TAIL_LINES)
      .map((e) => e.line)
      .join('\n');
    return FailureInterpreter.interpret(`${this.lastError || ''}\n${tail}`);
  }

  async _reapAnyChild() {
    if (!this.child) return false;
    if (this.state !== 'stopping') this._setState('stopping');
    await this._forceKill();
    this.child = null;
    return true;
  }

  static _nonEmptyString(value) {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}

module.exports = LlmRuntimeServer;
