class GlobalShortcuts {
  constructor({ globalShortcut = null, bridge = null, log = null } = {}) {
    this._electron = globalShortcut;
    this._bridge = bridge;
    this._log = log || { warn: () => {} };
    this._bindings = new Map();
    this._unwatch = bridge && typeof bridge.onStateChange === 'function' ? bridge.onStateChange(() => this.rehome()) : null;
  }

  get backend() {
    return this._bridge && this._bridge.running ? this._bridge : this._electron;
  }

  get viaBridge() {
    return this.backend === this._bridge && !!this._bridge;
  }

  register(accelerator, callback) {
    const backend = this.backend;
    this._bindings.set(accelerator, { callback, on: null });
    if (!backend) return false;
    const ok = this._registerOn(backend, accelerator, callback);
    if (ok) this._bindings.get(accelerator).on = backend;
    return ok;
  }

  unregister(accelerator) {
    const entry = this._bindings.get(accelerator);
    this._bindings.delete(accelerator);
    if (entry && entry.on) this._unregisterOn(entry.on, accelerator);
  }

  unregisterAll() {
    for (const accelerator of [...this._bindings.keys()]) this.unregister(accelerator);
  }

  isRegistered(accelerator) {
    const entry = this._bindings.get(accelerator);
    return !!(entry && entry.on);
  }

  rehome() {
    const backend = this.backend;
    for (const [accelerator, entry] of this._bindings) {
      if (entry.on === backend) continue;
      if (entry.on) this._unregisterOn(entry.on, accelerator);
      entry.on = backend && this._registerOn(backend, accelerator, entry.callback) ? backend : null;
    }
  }

  dispose() {
    this.unregisterAll();
    if (this._unwatch) { try { this._unwatch(); } catch (_) {} this._unwatch = null; }
  }

  _registerOn(backend, accelerator, callback) {
    try {
      return backend.register(accelerator, callback) !== false;
    } catch (err) {
      this._log.warn(`shortcut ${accelerator} not registered: ${(err && err.message) || err}`);
      return false;
    }
  }

  _unregisterOn(backend, accelerator) {
    try { backend.unregister(accelerator); } catch (_) {}
  }
}

module.exports = GlobalShortcuts;
