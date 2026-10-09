class TabInputSink {
  constructor({ getWebContents, log, sleep } = {}) {
    this._getWebContents = getWebContents || (() => null);
    this._log = log || (() => {});
    this._sleep = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this._chain = Promise.resolve();
  }

  hasLiveTarget() {
    return !!this._liveWebContents();
  }

  navigate(action) {
    const wc = this._liveWebContents();
    if (!wc) return;
    try {
      if (action === 'back') TabInputSink._goBack(wc);
      else if (action === 'forward') TabInputSink._goForward(wc);
      else if (action === 'reload') wc.reload();
    } catch (_) {}
  }

  enqueue(events) {
    this._chain = this._chain.then(() => this._send(events)).catch(() => {});
    return this._chain;
  }

  settled() {
    return this._chain;
  }

  async _send(events) {
    for (const { event, delay } of events) {
      if (delay) await this._sleep(delay);
      const wc = this._liveWebContents();
      if (!wc) return;
      try { wc.sendInputEvent(event); } catch (err) { this._log(`sendInputEvent failed: ${err && err.message}`); }
    }
  }

  _liveWebContents() {
    const wc = this._getWebContents();
    if (!wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed())) return null;
    return wc;
  }

  static _goBack(wc) {
    const nh = wc.navigationHistory || null;
    if (nh ? nh.canGoBack() : wc.canGoBack()) { if (nh) nh.goBack(); else wc.goBack(); }
  }

  static _goForward(wc) {
    const nh = wc.navigationHistory || null;
    if (nh ? nh.canGoForward() : wc.canGoForward()) { if (nh) nh.goForward(); else wc.goForward(); }
  }
}

module.exports = TabInputSink;
