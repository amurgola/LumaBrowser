export default class SingleListener {
  constructor() {
    this._listener = null;
  }

  on(cb) {
    this._listener = cb;
    return () => {
      if (this._listener === cb) this._listener = null;
    };
  }

  emit(event) {
    if (!this._listener) return;
    try {
      this._listener(event);
    } catch (_) {}
  }
}
