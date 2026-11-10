export default class SettingsJumpButton {
  constructor({ openPalette, isShortcutOn = null, doc = document }) {
    this._open = openPalette;
    this._isShortcutOn = isShortcutOn;
    this._doc = doc;
  }

  install() {
    const btn = this._doc.getElementById('settingsJumpBtn');
    if (!btn || typeof this._open !== 'function') return false;
    btn.hidden = false;
    btn.addEventListener('click', () => { this._open(); });
    this._doc.addEventListener('settings:open', () => { this._syncKeys(btn); });
    const toggle = this._doc.getElementById('gsPaletteShift');
    if (toggle) toggle.addEventListener('change', () => { SettingsJumpButton.showKeys(btn, toggle.checked); });
    this._syncKeys(btn);
    return true;
  }

  static showKeys(btn, on) {
    const keys = btn.querySelector('[data-jump-keys]');
    if (keys) keys.hidden = !on;
  }

  async _syncKeys(btn) {
    if (typeof this._isShortcutOn !== 'function') return;
    try { SettingsJumpButton.showKeys(btn, (await this._isShortcutOn()) !== false); } catch (_) {}
  }
}
