const os = require('os');
const RamPinFitGate = require('./RamPinFitGate');
const RamPinWorkerLauncher = require('./RamPinWorkerLauncher');

class RamPinService {
  static GIB = 1024 * 1024 * 1024;

  static _instances = new Set();

  constructor({ name, isEnabled, resolveTarget, fork, memory } = {}) {
    this._name = name || 'luma-ram-pin';
    this._isEnabled = isEnabled || (() => false);
    this._resolveTarget = resolveTarget || (async () => ({ error: 'No pin target resolver configured.' }));
    this._fork = fork || ((workerPath) => RamPinWorkerLauncher.fork(workerPath, this._name));
    this._memory = memory || { freeBytes: () => os.freemem(), totalBytes: () => os.totalmem() };
    this._worker = null;
    this._chain = Promise.resolve();
    this._resetPinState();
    RamPinService._instances.add(this);
  }

  isSupported() {
    return process.platform === 'win32' || process.platform === 'linux';
  }

  getStatus() {
    const supported = this.isSupported();
    return {
      supported,
      reason: supported ? null : 'RAM pinning is available on Windows and Linux.',
      enabled: !!this._isEnabled(),
      state: this._state,
      error: this._error,
      totalBytes: this._totalBytes,
      lockedBytes: this._lockedBytes,
      modelName: this._modelName,
    };
  }

  isActiveFor(key) {
    return !!key && this._key === key && (this._state === 'pinned' || this._state === 'pinning');
  }

  apply() {
    this._chain = this._chain.then(() => this._applyOnce()).catch((err) => {
      this._fail((err && err.message) || String(err));
    });
    return this._chain;
  }

  async stop() {
    const worker = this._worker;
    this._worker = null;
    this._resetPinState();
    if (!worker) return;
    try { worker.postMessage({ type: 'unpin' }); } catch (_) {}
    try { worker.kill(); } catch (_) {}
  }

  async _applyOnce() {
    if (!this._isEnabled() || !this.isSupported()) return this.stop();
    const target = await this._resolveTarget();
    if (!target || target.error) return this._refuseTarget(target);
    if (this._alreadyPinning(target)) return undefined;
    await this.stop();
    const fit = this._checkFit(target);
    if (!fit.ok) return this._fail(fit.message);
    this._beginPin(target);
    return this._startWorker(target.files);
  }

  async _refuseTarget(target) {
    await this.stop();
    this._fail((target && target.error) || 'Could not resolve the model to pin.');
  }

  _alreadyPinning(target) {
    return Boolean(this._worker) && this._key === target.key && this._state !== 'error';
  }

  _checkFit(target) {
    return RamPinFitGate.evaluate({
      freeBytes: this._memory.freeBytes() - this._pendingBytesElsewhere(),
      totalRamBytes: this._memory.totalBytes(),
      pinBytes: target.totalBytes,
      modelName: target.modelName,
    });
  }

  _pendingBytesElsewhere() {
    let pending = 0;
    for (const other of RamPinService._instances) {
      if (other !== this) pending += other._unlockedClaimBytes();
    }
    return pending;
  }

  _unlockedClaimBytes() {
    if (this._state !== 'pinning' && this._state !== 'pinned') return 0;
    return Math.max(0, (this._totalBytes || 0) - (this._lockedBytes || 0));
  }

  _beginPin(target) {
    this._state = 'pinning';
    this._error = null;
    this._totalBytes = target.totalBytes;
    this._lockedBytes = 0;
    this._key = target.key;
    this._modelName = target.modelName;
  }

  _startWorker(files) {
    const worker = this._fork(RamPinWorkerLauncher.WORKER_PATH);
    this._worker = worker;
    this._pipeOutput(worker);
    worker.on('message', (message) => { if (this._worker === worker && message) this._onMessage(message); });
    worker.on('exit', (code) => { if (this._worker === worker) this._onExit(code); });
    worker.postMessage({ type: 'pin', files });
  }

  _pipeOutput(worker) {
    if (worker.stdout) worker.stdout.on('data', (d) => console.log(`[${this._name}]`, String(d).trimEnd()));
    if (worker.stderr) worker.stderr.on('data', (d) => console.warn(`[${this._name}]`, String(d).trimEnd()));
  }

  _onMessage(message) {
    if (message.type === 'progress') this._onProgress(message);
    else if (message.type === 'pinned') this._onPinned(message);
    else if (message.type === 'error') this._onWorkerError(message);
  }

  _onProgress(message) {
    this._lockedBytes = message.lockedBytes || 0;
    this._totalBytes = message.totalBytes || this._totalBytes;
  }

  _onPinned(message) {
    this._state = 'pinned';
    this._totalBytes = message.totalBytes || this._totalBytes;
    this._lockedBytes = this._totalBytes;
    const gib = (this._totalBytes / RamPinService.GIB).toFixed(2);
    console.log(`[${this._name}] pinned ${gib} GiB in ${(message.seconds || 0).toFixed(1)}s`);
  }

  _onWorkerError(message) {
    this._fail(message.message || 'RAM pin failed.');
    console.warn(`[${this._name}] worker error:`, this._error);
  }

  _onExit(code) {
    this._worker = null;
    if (this._state === 'error') return;
    console.warn(`[${this._name}] worker exited unexpectedly (code ${code}); model unpinned`);
    this._state = 'idle';
    this._lockedBytes = 0;
    this._key = null;
  }

  _fail(message) {
    this._state = 'error';
    this._error = message;
  }

  _resetPinState() {
    this._state = 'idle';
    this._error = null;
    this._totalBytes = this._totalBytes || 0;
    this._lockedBytes = 0;
    this._key = null;
    this._modelName = null;
  }
}

module.exports = RamPinService;
