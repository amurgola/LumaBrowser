class BackgroundRunGate {
  constructor() {
    this._token = null;
    this._owner = null;
    this._since = 0;
  }

  get busy() {
    return this._token !== null;
  }

  get owner() {
    return this._owner;
  }

  tryAcquire(owner = 'unknown') {
    if (this.busy) return null;
    this._hold(Symbol(owner), owner);
    return this._token;
  }

  release(token) {
    if (token === null || token !== this._token) return false;
    this._hold(null, null);
    return true;
  }

  status() {
    return { busy: this.busy, owner: this._owner, forMs: this.busy ? Date.now() - this._since : 0 };
  }

  _hold(token, owner) {
    this._token = token;
    this._owner = owner;
    this._since = token === null ? 0 : Date.now();
  }
}

module.exports = BackgroundRunGate;
