class TriggerSource {
  static KIND = null;

  constructor({ triggerStore, runner, getUpstream } = {}) {
    if (!triggerStore || !runner) throw new Error(`${this.constructor.name} needs triggerStore + runner`);
    this.triggerStore = triggerStore;
    this.runner = runner;
    this._getUpstream = typeof getUpstream === 'function' ? getUpstream : () => null;
    this._upstream = null;
    this._unsubscribe = null;
  }

  upstream() {
    try { return this._getUpstream() || null; } catch (_) { return null; }
  }

  ensureSubscribed() {
    const upstream = this.upstream();
    if (!upstream || !this._canSubscribe(upstream)) return false;
    if (this._unsubscribe && this._upstream === upstream) return true;
    this.stop();
    this._upstream = upstream;
    this._unsubscribe = this._subscribe(upstream, (payload) => this._safelyHandle(payload));
    return true;
  }

  stop() {
    if (this._unsubscribe) { try { this._unsubscribe(); } catch (_) {} }
    this._unsubscribe = null;
    this._upstream = null;
  }

  _canSubscribe(_upstream) {
    throw new Error(`${this.constructor.name} must implement _canSubscribe`);
  }

  _subscribe(_upstream, _listener) {
    throw new Error(`${this.constructor.name} must implement _subscribe`);
  }

  _handle(_payload) {
    throw new Error(`${this.constructor.name} must implement _handle`);
  }

  _matchesTrigger(_trigger, _event) {
    throw new Error(`${this.constructor.name} must implement _matchesTrigger`);
  }

  _safelyHandle(payload) {
    try { this._handle(payload); } catch (_) {}
  }

  _deliverToMatching(event, dedupeKey) {
    const kind = this.constructor.KIND;
    const results = [];
    for (const trigger of this.triggerStore.list()) {
      if (trigger.kind !== kind || !this._matchesTrigger(trigger, event)) continue;
      try { results.push(this.runner.deliver(trigger.id, event, { dedupeKey, source: kind })); } catch (_) {}
    }
    return results;
  }
}

module.exports = TriggerSource;
