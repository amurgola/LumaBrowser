class InFlightTurn {
  constructor() {
    this.handle = null;
    this.local = false;
  }

  begin(handle, local) {
    this.handle = handle;
    this.local = !!(handle && local);
  }

  clear() {
    this.handle = null;
    this.local = false;
  }

  abort() {
    const wasLocal = this.local === true;
    const handle = this.handle;
    this.clear();
    if (handle) {
      try { handle.abort(); } catch (_) {}
    }
    return wasLocal;
  }

  isLocalLive() {
    return !!(this.handle && this.local);
  }
}

module.exports = InFlightTurn;
