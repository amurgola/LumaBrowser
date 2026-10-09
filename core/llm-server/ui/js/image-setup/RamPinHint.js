export default class RamPinHint {
  static POLL_MS = 1500;

  static HINT_ID = 'imgRamPinHint';

  constructor(store, getApi) {
    this._store = store;
    this._api = getApi;
    this._timer = null;
  }

  async refresh() {
    this._stop();
    if (!this._api().getRamPinStatus || !document.getElementById(RamPinHint.HINT_ID)) return;
    const status = await this._store.loadRamPinStatus();
    if (!status) return;
    const hint = document.getElementById(RamPinHint.HINT_ID);
    if (!hint) return;
    const { text, poll } = RamPinHint.describe(status);
    hint.textContent = text;
    if (poll) this._timer = setTimeout(() => this.refresh(), RamPinHint.POLL_MS);
  }

  static describe(status) {
    const gb = (b) => ((b || 0) / (1024 * 1024 * 1024)).toFixed(1);
    if (status.state === 'pinning') return { text: `Pinning ${gb(status.lockedBytes)} / ${gb(status.totalBytes)} GB...`, poll: true };
    if (status.state === 'pinned') return { text: `Pinned ${gb(status.totalBytes)} GB.`, poll: false };
    if (status.state === 'error') return { text: status.error || 'Pin failed.', poll: false };
    return { text: '', poll: !!status.enabled };
  }

  _stop() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }
}
