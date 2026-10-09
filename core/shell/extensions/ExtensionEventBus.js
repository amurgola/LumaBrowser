class ExtensionEventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(callback);
  }

  emit(event, data) {
    for (const callback of this._listeners.get(event) || []) {
      try { callback(data); } catch (e) { console.error(`Event error [${event}]:`, e); }
    }
  }

  off(event, callback) {
    const callbacks = this._listeners.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index >= 0) callbacks.splice(index, 1);
  }
}

module.exports = ExtensionEventBus;
