class RunControl {
  constructor({ isBridgeAborted = () => false, shouldAbort = null } = {}) {
    this.aborted = false;
    this._live = null;
    this.isAborted = () => this.aborted || isBridgeAborted() || (typeof shouldAbort === 'function' && !!shouldAbort());
    this.completionControl = {
      isAborted: this.isAborted,
      onHandle: (handle) => {
        this._live = handle;
        if (this.isAborted()) this.stop();
      },
    };
  }

  stop() {
    this.aborted = true;
    const live = this._live;
    this._live = null;
    if (live && typeof live.abort === 'function') {
      try { live.abort(); } catch (_) {}
    }
  }

  clearLive() {
    this._live = null;
  }
}

module.exports = RunControl;
