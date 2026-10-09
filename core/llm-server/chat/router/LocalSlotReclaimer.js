class LocalSlotReclaimer {
  static GRACE_MS = 4000;

  constructor({ llmServerService, isLocalTurnLive, graceMs = LocalSlotReclaimer.GRACE_MS }) {
    this._service = llmServerService;
    this._isLocalTurnLive = isLocalTurnLive;
    this._graceMs = graceMs;
    this._timer = null;
  }

  reclaim() {
    const server = this._service && this._service.runtimeServer;
    if (!server) return;
    try { server.markDirty(); } catch (_) {}
    this._scheduleStop(server);
  }

  cancelPending() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  _scheduleStop(server) {
    this.cancelPending();
    this._timer = setTimeout(() => {
      this._timer = null;
      if (this._shouldStop(server)) server.ensureStopped().catch(() => {});
    }, this._graceMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  _shouldStop(server) {
    if (this._isLocalTurnLive()) return false;
    if (!server.dirty) return false;
    return server.getStatus().state === 'ready';
  }
}

module.exports = LocalSlotReclaimer;
