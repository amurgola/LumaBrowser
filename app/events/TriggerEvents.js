class TriggerEvents {
  static CHANNEL = 'core.llmServer.triggers.event';
  static RECONCILE_DELAY_MS = 50;

  constructor({ renderers, getFileWatch, getSources, setTimeoutFn = setTimeout }) {
    this._renderers = renderers;
    this._getFileWatch = getFileWatch;
    this._getSources = getSources;
    this._setTimeout = setTimeoutFn;
    this._timer = null;
  }

  emit(type, payload) {
    this._renderers.send(TriggerEvents.CHANNEL, { type, payload });
    if (type === 'triggers-changed') this._scheduleReconcile();
  }

  emitter() {
    return (type, payload) => this.emit(type, payload);
  }

  _scheduleReconcile() {
    if (this._timer || !this._getFileWatch()) return;
    this._timer = this._setTimeout(() => {
      this._timer = null;
      this._reconcile();
    }, TriggerEvents.RECONCILE_DELAY_MS);
  }

  _reconcile() {
    try { this._getFileWatch().reconcile(); } catch (_) {}
    for (const source of this._getSources()) {
      try { if (source) source.ensureSubscribed(); } catch (_) {}
    }
  }
}

module.exports = TriggerEvents;
