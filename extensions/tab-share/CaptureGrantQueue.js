class CaptureGrantQueue {
  static CAPTURE_TIMEOUT_MS = 15000;

  constructor({ getFrameForTab, toPage, log, timeoutMs = CaptureGrantQueue.CAPTURE_TIMEOUT_MS } = {}) {
    this._getFrameForTab = getFrameForTab || (() => null);
    this._toPage = toPage || (() => {});
    this._log = log || (() => {});
    this._timeoutMs = timeoutMs;
    this._chain = Promise.resolve();
    this._pendingFrame = null;
    this._waiters = new Map();
  }

  request(tabId) {
    this._chain = this._chain.then(() => new Promise((resolve) => this._grant(tabId, resolve))).catch(() => {});
    return this._chain;
  }

  done(tabId, ok, error) {
    const waiter = this._waiters.get(tabId);
    if (waiter) waiter(ok, error);
  }

  takePendingFrame() {
    const frame = this._pendingFrame;
    this._pendingFrame = null;
    return frame;
  }

  _grant(tabId, resolve) {
    const frame = this._getFrameForTab(tabId);
    if (!frame) {
      this._toPage({ k: 'capture-denied', tabId, error: 'tab not available' });
      resolve();
      return;
    }
    const timer = setTimeout(() => this._onTimeout(tabId, resolve), this._timeoutMs);
    this._waiters.set(tabId, (ok, error) => this._onDone(tabId, timer, ok, error, resolve));
    this._pendingFrame = frame;
    this._toPage({ k: 'capture-go', tabId });
  }

  _onDone(tabId, timer, ok, error, resolve) {
    clearTimeout(timer);
    this._waiters.delete(tabId);
    this._pendingFrame = null;
    if (!ok) this._log(`capture of tab ${tabId} failed: ${error || 'unknown'}`);
    resolve();
  }

  _onTimeout(tabId, resolve) {
    this._pendingFrame = null;
    this._waiters.delete(tabId);
    this._log(`capture of tab ${tabId} timed out`);
    resolve();
  }
}

module.exports = CaptureGrantQueue;
