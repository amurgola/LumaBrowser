class SherpaWorkerProcess {
  static STOP_GRACE_MS = 3000;

  constructor({ workerPath, serviceName, label, readyTimeoutMs, onMessage = () => {}, onExit = () => {}, onStderr = () => {}, fork = null }) {
    this._workerPath = workerPath;
    this._serviceName = serviceName;
    this._label = label;
    this._readyTimeoutMs = readyTimeoutMs;
    this._onMessage = onMessage;
    this._onExit = onExit;
    this._onStderr = onStderr;
    this._fork = fork;
    this._worker = null;
    this._state = 'idle';
    this._lastError = null;
    this._readyWaiters = [];
  }

  get state() {
    return this._state;
  }

  get lastError() {
    return this._lastError;
  }

  get running() {
    return this._worker !== null;
  }

  async start({ env, initConfig, timeoutMessage }) {
    this._state = 'starting';
    this._lastError = null;
    const worker = this._forkWorker(env);
    this._attach(worker);
    worker.postMessage({ type: 'init', config: initConfig });
    const ready = await this._waitForReady(timeoutMessage);
    this._state = 'ready';
    return ready;
  }

  post(message) {
    this._worker.postMessage(message);
  }

  tryPost(message) {
    try {
      if (this._worker) this._worker.postMessage(message);
    } catch (_) {}
  }

  async stop() {
    const worker = this._worker;
    if (!worker) {
      this._state = 'idle';
      return;
    }
    this._state = 'stopping';
    this._worker = null;
    await SherpaWorkerProcess._shutdown(worker);
    this._state = 'idle';
  }

  _forkWorker(env) {
    const fork = this._fork || require('electron').utilityProcess.fork;
    return fork(this._workerPath, [], { serviceName: this._serviceName, stdio: 'pipe', env });
  }

  _attach(worker) {
    this._worker = worker;
    if (worker.stdout) worker.stdout.on('data', () => {});
    if (worker.stderr) worker.stderr.on('data', (chunk) => this._logStderr(chunk));
    worker.on('exit', (code) => this._handleExit(worker, code));
    worker.on('message', (message) => this._handleMessage(message));
  }

  _logStderr(chunk) {
    const text = String(chunk).trim();
    if (text) this._onStderr(text);
  }

  _handleExit(worker, code) {
    if (this._worker === worker) this._markCrashed(code);
    const err = new Error(this._lastError || `${this._label} worker exited.`);
    this._flushReady(err);
    this._onExit(err);
  }

  _markCrashed(code) {
    this._worker = null;
    this._state = 'error';
    if (!this._lastError) this._lastError = `${this._label} worker exited unexpectedly (code=${code}).`;
  }

  _handleMessage(message) {
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'ready') this._flushReady(null, message);
    else if (message.type === 'init-error') this._handleInitError(message.message);
    else this._onMessage(message);
  }

  _handleInitError(text) {
    this._lastError = text || `${this._label} init failed`;
    this._state = 'error';
    this._flushReady(new Error(this._lastError));
    this.stop().catch(() => {});
  }

  _waitForReady(timeoutMessage) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
        this.stop().catch(() => {});
      }, this._readyTimeoutMs);
      this._readyWaiters.push({
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (err) => { clearTimeout(timer); reject(err); },
      });
    });
  }

  _flushReady(err, message) {
    for (const waiter of this._readyWaiters.splice(0)) {
      if (err) waiter.reject(err);
      else waiter.resolve(message);
    }
  }

  static _shutdown(worker) {
    try {
      worker.postMessage({ type: 'shutdown' });
    } catch (_) {}
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        try { worker.kill(); } catch (_) {}
        resolve();
      }, SherpaWorkerProcess.STOP_GRACE_MS);
      worker.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
}

module.exports = SherpaWorkerProcess;
