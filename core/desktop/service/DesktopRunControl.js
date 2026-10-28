const DesktopError = require('../DesktopError');

class DesktopRunControl {
  static STOP_GRACE_MS = 3000;
  static STOPPED_MESSAGE = 'Stopped by the user (the desktop Stop key). Do not retry: end the task and ask the user how to go on.';

  constructor({ now = Date.now } = {}) {
    this._now = now;
    this._paused = false;
    this._stoppedAt = null;
    this._waiters = new Set();
    this._listeners = new Set();
  }

  get paused() {
    return this._paused;
  }

  get stopped() {
    return this._stoppedAt != null && this._now() - this._stoppedAt < DesktopRunControl.STOP_GRACE_MS;
  }

  get waiting() {
    return [...this._waiters].map((w) => w.info);
  }

  pause() {
    if (this._paused) return false;
    this._paused = true;
    this._emit('pause');
    return true;
  }

  resume() {
    if (!this._paused) return false;
    this._paused = false;
    this._emit('resume');
    this._release(null);
    return true;
  }

  stop() {
    this._stoppedAt = this._now();
    const wasPaused = this._paused;
    this._paused = false;
    this._emit('stop', { wasPaused });
    this._release(DesktopRunControl.stoppedResult());
    return true;
  }

  clear() {
    this._stoppedAt = null;
  }

  async hold(info = {}) {
    if (this.stopped) return DesktopRunControl.stoppedResult();
    if (!this._paused) return null;
    return new Promise((resolve) => {
      const waiter = { info, resolve };
      this._waiters.add(waiter);
      this._emit('waiting', { info });
    });
  }

  check() {
    if (this.stopped) throw new DesktopError(DesktopRunControl.STOPPED_MESSAGE, DesktopError.STOPPED);
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  static stoppedResult() {
    return { success: false, error: DesktopRunControl.STOPPED_MESSAGE, code: DesktopError.STOPPED };
  }

  _release(result) {
    const waiters = [...this._waiters];
    this._waiters.clear();
    for (const w of waiters) w.resolve(result);
  }

  _emit(event, detail = {}) {
    for (const fn of this._listeners) {
      try { fn(event, detail); } catch (_) {}
    }
  }
}

module.exports = DesktopRunControl;
