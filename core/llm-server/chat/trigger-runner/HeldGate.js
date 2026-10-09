class HeldGate {
  static RETRY_MS = 2000;

  constructor(gate, owner) {
    this._gate = gate;
    this._owner = owner;
    this._token = null;
    this._closed = false;
  }

  get held() {
    return this._token !== null;
  }

  acquire() {
    if (this._closed || this.held) return this.held;
    this._token = this._gate.tryAcquire(this._owner);
    return this.held;
  }

  release() {
    if (!this.held) return;
    this._gate.release(this._token);
    this._token = null;
  }

  reacquire(stillWanted) {
    if (this._closed || this.held || !stillWanted()) return;
    if (this.acquire()) return;
    const again = setTimeout(() => this.reacquire(stillWanted), HeldGate.RETRY_MS);
    if (again.unref) again.unref();
  }

  close() {
    this._closed = true;
    this.release();
  }
}

module.exports = HeldGate;
