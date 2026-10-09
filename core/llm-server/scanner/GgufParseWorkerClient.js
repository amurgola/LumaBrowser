const GgufParser = require('../GgufParser');

class GgufParseWorkerClient {
  static IDLE_MS = 30 * 1000;

  constructor({ spawn, parse = (filePath) => GgufParser.parseHeader(filePath), idleMs = GgufParseWorkerClient.IDLE_MS }) {
    this._spawn = spawn;
    this._parseInProcess = parse;
    this._idleMs = idleMs;
    this._worker = null;
    this._broken = false;
    this._nextId = 0;
    this._pending = new Map();
    this._idleTimer = null;
  }

  parse(filePath) {
    const worker = this._ensureWorker();
    if (!worker) return this._parseInProcess(filePath);
    return new Promise((resolve) => this._send(worker, filePath, resolve));
  }

  stop() {
    this._clearIdleTimer();
    const worker = this._worker;
    this._worker = null;
    if (worker) {
      try { worker.terminate(); } catch (_) {}
    }
  }

  _ensureWorker() {
    if (this._worker || this._broken) return this._worker;
    try {
      const worker = this._spawn();
      worker.unref();
      this._listen(worker);
      this._worker = worker;
    } catch (_) {
      this._broken = true;
      this._worker = null;
    }
    return this._worker;
  }

  _listen(worker) {
    worker.on('message', (message) => this._onMessage(message));
    worker.on('error', () => {
      this._broken = true;
      if (this._worker === worker) this.stop();
      this._failPendingToFallback();
    });
    worker.on('exit', () => {
      if (this._worker !== worker) return;
      this._worker = null;
      this._failPendingToFallback();
    });
  }

  _send(worker, filePath, resolve) {
    const id = ++this._nextId;
    this._pending.set(id, { resolve, fallback: () => this._parseInProcess(filePath).then(resolve) });
    this._clearIdleTimer();
    try {
      worker.postMessage({ id, filePath });
    } catch (_) {
      this._pending.delete(id);
      this._parseInProcess(filePath).then(resolve);
    }
  }

  _onMessage({ id, res }) {
    const pending = this._pending.get(id);
    if (pending) {
      this._pending.delete(id);
      pending.resolve(res);
    }
    if (this._pending.size === 0) this._armIdleTimer();
  }

  _armIdleTimer() {
    this._clearIdleTimer();
    this._idleTimer = setTimeout(() => this.stop(), this._idleMs);
    if (this._idleTimer.unref) this._idleTimer.unref();
  }

  _clearIdleTimer() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = null;
  }

  _failPendingToFallback() {
    const pending = [...this._pending.values()];
    this._pending.clear();
    for (const p of pending) p.fallback();
  }
}

module.exports = GgufParseWorkerClient;
