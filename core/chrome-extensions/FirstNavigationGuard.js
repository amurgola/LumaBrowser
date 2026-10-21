class FirstNavigationGuard {
  static STALL_MS = 1500;

  constructor(wc, { stallMs = FirstNavigationGuard.STALL_MS } = {}) {
    this._wc = wc;
    this._stallMs = stallMs;
    this._url = null;
    this.done = false;
    this._onStart = (_e, url, _isInPlace, isMainFrame) => { if (isMainFrame && !this._url) this._url = url; };
    this._onCommit = () => { this.done = true; };
    this._onFail = (_e, _code, _desc, _url, isMainFrame) => { if (isMainFrame) this.done = true; };
    this._listening = typeof wc.on === 'function';
    if (!this._listening) {
      this.done = true;
      return;
    }
    wc.on('did-start-navigation', this._onStart);
    wc.on('did-navigate', this._onCommit);
    wc.on('did-fail-load', this._onFail);
  }

  async restartIfStalled() {
    if (!this.done) await new Promise((resolve) => setTimeout(resolve, this._stallMs));
    this.dispose();
    if (this.done || !this._url || this._wc.isDestroyed() || this._wc.isLoading()) return false;
    this._wc.loadURL(this._url).catch(() => {});
    return true;
  }

  dispose() {
    if (!this._listening) return;
    this._listening = false;
    this._wc.removeListener('did-start-navigation', this._onStart);
    this._wc.removeListener('did-navigate', this._onCommit);
    this._wc.removeListener('did-fail-load', this._onFail);
  }
}

module.exports = FirstNavigationGuard;
