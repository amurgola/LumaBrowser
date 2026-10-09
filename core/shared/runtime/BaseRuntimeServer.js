const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const ChildProcessRegistry = require('../../shell/ChildProcessRegistry');
const IdleTimer = require('./server/IdleTimer');
const ChildReaper = require('./server/ChildReaper');
const RuntimeLogRing = require('./server/RuntimeLogRing');
const RuntimeSpawnEnv = require('./server/RuntimeSpawnEnv');

class BaseRuntimeServer extends EventEmitter {
  static HEALTH_POLL_INTERVAL_MS = 200;
  static HEALTH_TIMEOUT_MS = 5 * 60 * 1000;
  static SETTLE_TIMEOUT_MS = 180000;

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  constructor() {
    super();
    this.state = 'idle';
    this.child = null;
    this.port = null;
    this.plan = null;
    this.startedAt = null;
    this.lastError = null;
    this.idleMs = 0;
    this.healthTimeoutMs = BaseRuntimeServer.HEALTH_TIMEOUT_MS;
    this._log = new RuntimeLogRing();
    this._idleHolds = 0;
    this._idle = new IdleTimer(() => this._onIdleExpired());
  }

  _logTag() { throw new Error(`${this.constructor.name} must implement _logTag()`); }
  _processNoun() { throw new Error(`${this.constructor.name} must implement _processNoun()`); }
  _loadingLabel() { throw new Error(`${this.constructor.name} must implement _loadingLabel()`); }
  async _healthCheck() { throw new Error(`${this.constructor.name} must implement _healthCheck()`); }

  _initLaunchState(_launch) {}
  async _afterHealthy() {}
  async _beforeForceKill() {}
  _afterStopped() {}
  _extraStatus() { return {}; }
  _settleTimeoutMs() { return BaseRuntimeServer.SETTLE_TIMEOUT_MS; }

  get logRing() {
    return this._log.entries;
  }

  get idleHeld() {
    return this._idleHolds > 0;
  }

  getStatus() {
    return {
      state: this.state,
      port: this.port,
      pid: this.child ? this.child.pid : null,
      plan: this.plan,
      startedAt: this.startedAt,
      lastError: this.lastError,
      logs: this._log.snapshot(),
      ...this._extraStatus(),
    };
  }

  async start(launch, { shouldCancel } = {}) {
    this._assertStartable(launch);
    this._resetForLaunch(launch);
    this._spawnChild(launch);
    this._wireChild();
    await this._awaitHealthyOrCleanUp(shouldCancel);
    await this._afterHealthy();
    this._setState('ready');
    this._armIdleTimer();
    return this.getStatus();
  }

  async stop() {
    this._disarmIdleTimer();
    if (this.state === 'idle') return this.getStatus();
    this._setState('stopping');
    await this._beforeForceKill();
    await this._forceKill();
    this._afterStopped();
    this._setState('idle');
    return this.getStatus();
  }

  setIdleTimeout(ms) {
    this.idleMs = Math.max(0, Number(ms) || 0);
    if (this.state === 'ready') this._armIdleTimer();
    else this._disarmIdleTimer();
  }

  markActive() {
    if (this.state === 'ready') this._armIdleTimer();
  }

  holdIdle() {
    this._idleHolds += 1;
    this._idle.disarm();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this._idleHolds = Math.max(0, this._idleHolds - 1);
      if (this._idleHolds === 0 && this.state === 'ready') this._armIdleTimer();
    };
  }

  waitUntilSettled(timeoutMs = this._settleTimeoutMs()) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (result) => {
        if (done) return;
        done = true;
        this.removeListener('state-change', onChange);
        clearTimeout(timer);
        resolve(result);
      };
      const onChange = (ev) => {
        const settled = BaseRuntimeServer._settledResult(ev && ev.state);
        if (settled) finish(settled);
      };
      const timer = setTimeout(() => finish('timeout'), timeoutMs);
      this.on('state-change', onChange);
      const already = BaseRuntimeServer._settledResult(this.state);
      if (already) finish(already);
    });
  }

  static _settledResult(state) {
    return state === 'ready' || state === 'error' || state === 'idle' ? state : null;
  }

  _assertStartable(launch) {
    if (this.state !== 'idle' && this.state !== 'error') {
      throw new Error(`Cannot start: server is ${this.state}.`);
    }
    if (!launch || !launch.binaryPath) throw new Error('start: launch with binaryPath is required');
  }

  _resetForLaunch(launch) {
    this.plan = launch.plan;
    this.lastError = null;
    this._log.clear();
    this.port = launch.plan.port;
    this.healthTimeoutMs = Number(launch.healthTimeoutMs) > 0
      ? Number(launch.healthTimeoutMs) : BaseRuntimeServer.HEALTH_TIMEOUT_MS;
    this._initLaunchState(launch);
    this._setState('starting');
  }

  _spawnChild(launch) {
    try {
      const { cwd, env } = RuntimeSpawnEnv.build(launch.binaryPath, { cudaDevice: launch.cudaDevice });
      if (RuntimeSpawnEnv.isPinned(launch.cudaDevice)) {
        console.log(`${this._logTag()} pinned to CUDA device ${launch.cudaDevice}`);
      }
      this.child = ChildProcessRegistry.track(spawn(launch.binaryPath, launch.args, {
        windowsHide: true,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd,
        env,
      }));
    } catch (err) {
      this._setState('error', { error: err.message });
      this.lastError = err.message;
      throw err;
    }
    this.startedAt = Date.now();
  }

  _wireChild() {
    this.child.stdout.on('data', (chunk) => this._captureLog('stdout', chunk));
    this.child.stderr.on('data', (chunk) => this._captureLog('stderr', chunk));
    this.child.on('error', (err) => this._onChildError(err));
    this.child.on('exit', (code, signal) => this._onChildExit(code, signal));
  }

  _onChildExit(code, signal) {
    const child = this.child;
    this.child = null;
    if (this.state === 'stopping') {
      this._setState('idle', { exitCode: code, signal });
    } else if (child) {
      this.lastError = `${this._processNoun()} exited unexpectedly (code=${code}, signal=${signal}).`;
      this._setState('error', { exitCode: code, signal });
    }
  }

  _onChildError(err) {
    this.lastError = err && err.message;
    const child = this.child;
    this.child = null;
    if (child) ChildReaper.killNow(child);
    this._setState('error', { error: err && err.message });
  }

  async _awaitHealthyOrCleanUp(shouldCancel) {
    try {
      await this._waitForHealth(shouldCancel);
    } catch (err) {
      const tail = this._log.errorTail(this._processNoun());
      const msg = tail ? `${err.message}\n${tail}` : err.message;
      this.lastError = msg;
      await this._forceKill();
      this._setState('error', { error: msg });
      throw new Error(msg);
    }
  }

  async _waitForHealth(shouldCancel) {
    const deadline = Date.now() + this.healthTimeoutMs;
    while (Date.now() < deadline) {
      if (shouldCancel && shouldCancel()) {
        throw new Error(`Canceled while the ${this._loadingLabel()} was loading.`);
      }
      if (this.state === 'error' || !this.child) {
        throw new Error(this.lastError || `${this._processNoun()} exited before becoming healthy.`);
      }
      if (await this._isHealthy()) return;
      await BaseRuntimeServer.sleep(BaseRuntimeServer.HEALTH_POLL_INTERVAL_MS);
    }
    throw new Error(`${this._processNoun()} did not become healthy within ${Math.round(this.healthTimeoutMs / 1000)}s.`);
  }

  async _isHealthy() {
    try {
      return Boolean(await this._healthCheck());
    } catch (_) {
      return false;
    }
  }

  async _forceKill() {
    if (!this.child) return;
    await ChildReaper.reap(this.child);
  }

  _onIdleExpired() {
    console.log(`${this._logTag()} idle for ${Math.round(this.idleMs / 1000)}s, stopping`);
    this.stop().catch((err) => {
      console.warn(`${this._logTag()} idle stop failed:`, err && err.message);
    });
  }

  _armIdleTimer() {
    this._idle.set(this.idleMs);
    if (this._idleHolds > 0) {
      this._idle.disarm();
      return;
    }
    this._idle.arm();
  }

  _disarmIdleTimer() {
    this._idle.disarm();
  }

  _captureLog(stream, chunk) {
    for (const entry of this._log.capture(stream, chunk)) this.emit('log', entry);
  }

  _setState(next, payload) {
    if (this.state === next) return;
    this.state = next;
    this.emit('state-change', { state: next, payload: payload || null });
  }
}

module.exports = BaseRuntimeServer;
