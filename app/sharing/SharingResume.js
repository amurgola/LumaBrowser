class SharingResume {
  static DELAY_MS = 3000;

  constructor({ hostService, clientService, notices, log = console, setTimeoutFn = setTimeout }) {
    this._host = hostService;
    this._client = clientService;
    this._notices = notices;
    this._log = log;
    this._setTimeout = setTimeoutFn;
  }

  schedule() {
    return this._setTimeout(() => { this.run(); }, SharingResume.DELAY_MS);
  }

  run() {
    let resumed = Promise.resolve();
    try {
      resumed = this._resumeHost().finally(() => this._checkPublicUrl());
      this._client.startPolling();
    } catch (err) {
      this._log.warn('[sharing] resume failed:', err && err.message);
    }
    return resumed;
  }

  async _resumeHost() {
    if (!this._host.isEnabled()) return;
    const result = await this._host.setEnabled(true);
    if (result && !result.success) this._log.warn('[sharing] resume failed:', result.error);
  }

  _checkPublicUrl() {
    return this._notices.checkPublicUrl(this._host).catch(() => null);
  }
}

module.exports = SharingResume;
