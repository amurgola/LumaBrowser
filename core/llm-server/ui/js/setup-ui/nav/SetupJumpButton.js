export default class SetupJumpButton {
  constructor({ api, doc = document }) {
    this._api = api || null;
    this._doc = doc;
  }

  start() {
    const btn = this._doc.getElementById('setupJumpBtn');
    const palette = this._api && this._api.palette;
    if (!btn || !palette || typeof palette.toggle !== 'function') return false;
    btn.hidden = false;
    btn.addEventListener('click', () => { palette.toggle().catch(() => {}); });
    this._syncKeys(btn, palette);
    return true;
  }

  async _syncKeys(btn, palette) {
    const keys = btn.querySelector('[data-jump-keys]');
    if (!keys || typeof palette.doubleShift !== 'function') return;
    try {
      const r = await palette.doubleShift();
      keys.hidden = !!(r && r.success && r.enabled === false);
    } catch (_) {}
  }
}
