const ClipboardSnapshot = require('../../../../core/desktop/service/ClipboardSnapshot');

class SelectionClipboard {
  static COPY_TIMEOUT_MS = 800;
  static POLL_MS = 15;
  static SETTLE_MS = 40;
  static MODIFIER_WAIT_MS = 1500;
  static PASTE_RESTORE_MS = 600;
  static FOCUS_SETTLE_MS = 150;
  static UNSUPPORTED = 'Reading or pasting the selection is not available on this system';

  constructor({ keys, clipboard, sleep = SelectionClipboard._sleep, now = Date.now }) {
    this._keys = keys;
    this._clipboard = clipboard;
    this._sleep = sleep;
    this._now = now;
  }

  get supported() {
    return !!(this._keys && this._keys.supported);
  }

  async copySelection() {
    const blocked = this._blocked();
    if (blocked) return blocked;
    try {
      const hwnd = this._keys.foregroundWindow();
      if (this._keys.copyMode === 'primary') return this._fromPrimary(hwnd);
      await this.releaseModifiers();
      const saved = ClipboardSnapshot.take(this._clipboard);
      const before = this._keys.clipboardSequence();
      this._keys.sendCombo('copy');
      const changed = await this._waitForSequenceChange(before, SelectionClipboard.COPY_TIMEOUT_MS);
      if (!changed) return typeof this._keys.readPrimary === 'function' ? this._fromPrimary(hwnd) : SelectionClipboard._noSelection();
      await this._sleep(SelectionClipboard.SETTLE_MS);
      const text = this._clipboard.readText();
      this._restore(saved);
      if (!text || !text.trim()) return SelectionClipboard._noSelection();
      return { success: true, text, hwnd };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err), code: 'FAILED' };
    }
  }

  async pasteText(text, { hwnd = 0 } = {}) {
    const blocked = this._blocked();
    if (blocked) return blocked;
    if (typeof this._keys.canPaste === 'function' && !this._keys.canPaste()) {
      return { success: false, error: this._keys.noPasteReason || 'Pasting is not available on this system', code: 'UNSUPPORTED' };
    }
    try {
      if (hwnd && !(await this._ensureForeground(hwnd))) {
        return { success: false, error: 'The window the text came from is no longer in front', code: 'FOCUS_LOST' };
      }
      await this.releaseModifiers();
      const saved = ClipboardSnapshot.take(this._clipboard);
      this._clipboard.writeText(text);
      try {
        this._keys.sendCombo('paste');
      } finally {
        await this._sleep(SelectionClipboard.PASTE_RESTORE_MS);
      }
      return { success: true, restored: this._restoreIfOurs(saved, text) };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err), code: 'FAILED' };
    }
  }

  async releaseModifiers() {
    const deadline = this._now() + SelectionClipboard.MODIFIER_WAIT_MS;
    let polls = Math.ceil(SelectionClipboard.MODIFIER_WAIT_MS / SelectionClipboard.POLL_MS);
    let held = this._keys.heldModifiers();
    while (held.length && this._now() < deadline && polls-- > 0) {
      await this._sleep(SelectionClipboard.POLL_MS);
      held = this._keys.heldModifiers();
    }
    if (held.length) this._keys.releaseKeys(held);
    return held;
  }

  _blocked() {
    if (!this.supported) return { success: false, error: SelectionClipboard.UNSUPPORTED, code: 'UNSUPPORTED' };
    let reason = null;
    try { reason = typeof this._keys.unavailableReason === 'function' ? this._keys.unavailableReason() : null; } catch (_) { reason = null; }
    return reason ? { success: false, error: reason, code: 'NO_PERMISSION' } : null;
  }

  _fromPrimary(hwnd) {
    const text = this._keys.readPrimary();
    return text && text.trim() ? { success: true, text, hwnd, primary: true } : SelectionClipboard._noSelection();
  }

  async _waitForSequenceChange(before, timeoutMs) {
    const deadline = this._now() + timeoutMs;
    let polls = Math.ceil(timeoutMs / SelectionClipboard.POLL_MS);
    do {
      await this._sleep(SelectionClipboard.POLL_MS);
      if (this._keys.clipboardSequence() !== before) return true;
    } while (this._now() < deadline && polls-- > 0);
    return false;
  }

  async _ensureForeground(hwnd) {
    if (this._keys.foregroundWindow() === hwnd) return true;
    try { this._keys.focusWindow(hwnd); } catch (_) {}
    await this._sleep(SelectionClipboard.FOCUS_SETTLE_MS);
    return this._keys.foregroundWindow() === hwnd;
  }

  _restore(saved) {
    if (!saved) return false;
    try {
      ClipboardSnapshot.restore(this._clipboard, saved);
      return true;
    } catch (_) {
      return false;
    }
  }

  _restoreIfOurs(saved, text) {
    try {
      if (this._clipboard.readText() !== text) return false;
    } catch (_) {
      return false;
    }
    return this._restore(saved);
  }

  static _noSelection() {
    return { success: false, error: 'No text is selected', code: 'NO_SELECTION' };
  }

  static _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = SelectionClipboard;
