class QuitController {
  static KEEP_OPEN = 0;
  static RETRY = 1;
  static FORCE = 2;
  static DEFAULT_TIMEOUT_MS = 5000;

  static DIALOG = {
    type: 'warning',
    title: 'LumaBrowser could not finish quitting',
    message: 'Background processes could not be confirmed stopped.',
    detail: 'Retry quit tries to stop background work again. Force quit closes LumaBrowser even though a model server may still be running and holding GPU memory.',
    buttons: ['Keep LumaBrowser open', 'Retry quit', 'Force quit'],
    defaultId: 1,
    cancelId: 0,
    noLink: true,
  };

  constructor(host) {
    this._host = host;
    this._timeoutMs = host.timeoutMs || QuitController.DEFAULT_TIMEOUT_MS;
    this._log = host.log || console;
    this._setTimeout = host.setTimeout || setTimeout;
    this._systemShutdown = false;
    this._quitting = false;
  }

  get isQuitting() {
    return this._quitting;
  }

  markSystemShutdown() {
    this._systemShutdown = true;
  }

  async requestQuit() {
    if (this._quitting) return 'already-quitting';
    this._quitting = true;
    for (;;) {
      const outcome = await this._runCleanupWithTimeout();
      if (outcome === 'done') return this._exitCleanly();
      if (!this._canPrompt()) return this._forceExitWithoutAsking();
      const response = await this._askUser();
      if (response === QuitController.KEEP_OPEN) return this._keepOpen();
      if (response === QuitController.RETRY) {
        this._log.warn('[quit] retrying shutdown');
        continue;
      }
      return this._forceQuitByUser();
    }
  }

  async _runCleanupWithTimeout() {
    const timer = this._timeoutAfter(this._timeoutMs);
    try {
      return await Promise.race([this._runCleanup(), timer.promise]);
    } finally {
      timer.cancel();
    }
  }

  _runCleanup() {
    return Promise.resolve().then(this._host.cleanup).then(() => 'done', (err) => {
      this._log.error('Error during shutdown cleanup:', err);
      return 'done';
    });
  }

  _timeoutAfter(ms) {
    let handle;
    const promise = new Promise((resolve) => {
      handle = this._setTimeout(() => resolve('timeout'), ms);
      if (handle && typeof handle.unref === 'function') handle.unref();
    });
    return { promise, cancel: () => clearTimeout(handle) };
  }

  _canPrompt() {
    if (this._systemShutdown) return false;
    return this._host.canPrompt ? this._host.canPrompt() : true;
  }

  async _askUser() {
    try {
      return (await this._host.showDialog(QuitController.DIALOG)).response;
    } catch (err) {
      this._log.error('[quit] quit-failure dialog failed, forcing exit:', err && err.message);
      return QuitController.FORCE;
    }
  }

  _exitCleanly() {
    this._host.exit(0);
    return 'exited';
  }

  _forceExitWithoutAsking() {
    this._log.warn('[quit] cleanup timed out, forcing exit');
    this._forceExit(0);
    return 'exited';
  }

  _keepOpen() {
    this._log.warn('[quit] user kept LumaBrowser open after a hung shutdown');
    this._quitting = false;
    return 'kept-open';
  }

  _forceQuitByUser() {
    this._log.warn('[quit] force quit accepted by user');
    this._forceExit(1);
    return 'exited';
  }

  _forceExit(code) {
    this._killChildren();
    this._host.exit(code);
  }

  _killChildren() {
    try {
      const killed = this._host.killChildren ? this._host.killChildren() : [];
      if (killed && killed.length) this._log.warn(`[quit] force quit killed ${killed.length} child process(es): ${killed.join(', ')}`);
    } catch (_) {}
  }
}

module.exports = QuitController;
