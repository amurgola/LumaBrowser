import PollingHint from './PollingHint.js';

export default class RamPinHint extends PollingHint {
  static POLL_MS = 1500;

  constructor(ctx, prefs) {
    super(ctx, 'ramPinHint');
    this._prefs = prefs;
  }

  static gb(bytes) {
    return ((bytes || 0) / (1024 * 1024 * 1024)).toFixed(1);
  }

  paint(hint, status) {
    const gb = RamPinHint.gb;
    if (status.state === 'pinning') {
      hint.textContent = `Pinning ${gb(status.lockedBytes)} / ${gb(status.totalBytes)} GB...`;
      return RamPinHint.POLL_MS;
    }
    if (status.state === 'pinned') { hint.textContent = `Pinned ${gb(status.totalBytes)} GB.`; return 0; }
    if (status.state === 'error') { hint.textContent = status.error || 'Pin failed.'; return 0; }
    hint.textContent = '';
    return status.enabled ? RamPinHint.POLL_MS : 0;
  }

  _available() {
    return !!(this._ctx.api && this._ctx.api.getRamPinStatus);
  }

  async _fetch() {
    const r = await this._ctx.api.getRamPinStatus();
    return r && r.success ? r.status : null;
  }

  _onStatus(status) {
    this._prefs.ramPinStatus = status;
  }
}
