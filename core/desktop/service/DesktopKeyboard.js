const DesktopKeys = require('../DesktopKeys');
const ClipboardSnapshot = require('./ClipboardSnapshot');

class DesktopKeyboard {
  static VK_RETURN = 0x0d;
  static KEY_GAP_MS = 15;
  static PASTE_RESTORE_MS = 600;

  constructor({ win, input, sleep }) {
    this._win = win;
    this._input = input;
    this._sleep = sleep;
  }

  async combo(w, combo) {
    const held = [];
    try {
      for (const e of DesktopKeys.comboEvents(combo)) {
        this._input.send(w, [this._keyEvent(e, e.up)]);
        DesktopKeyboard._trackHeld(held, e);
        await this._sleep(DesktopKeyboard.KEY_GAP_MS);
      }
    } finally {
      if (held.length) this._input.release(held.reverse().map((h) => this._keyEvent(h, true)));
    }
  }

  typeKeys(w, text) {
    for (const ch of text) {
      if (ch === '\n') this.enter(w);
      else this._input.send(w, this._unicodeEvents(ch));
    }
  }

  enter(w) {
    const K = this._win.KEYEVENTF;
    this._input.send(w, [this._win.keyInput({ vk: DesktopKeyboard.VK_RETURN }), this._win.keyInput({ vk: DesktopKeyboard.VK_RETURN, flags: K.KEYUP })]);
  }

  async paste(w, text, clipboard) {
    const saved = ClipboardSnapshot.take(clipboard);
    clipboard.writeText(text);
    let restored = false;
    try {
      await this.combo(w, 'ctrl+v');
    } finally {
      await this._sleep(DesktopKeyboard.PASTE_RESTORE_MS);
      restored = DesktopKeyboard._restoreIfOurs(clipboard, saved, text);
    }
    return restored;
  }

  _keyEvent(e, up) {
    const K = this._win.KEYEVENTF;
    return this._win.keyInput({ vk: e.vk, flags: (up ? K.KEYUP : 0) | (e.extended ? K.EXTENDEDKEY : 0) });
  }

  _unicodeEvents(ch) {
    const K = this._win.KEYEVENTF;
    const units = [];
    for (let i = 0; i < ch.length; i++) units.push(ch.charCodeAt(i));
    return [
      ...units.map((u) => this._win.keyInput({ scan: u, flags: K.UNICODE })),
      ...units.map((u) => this._win.keyInput({ scan: u, flags: K.UNICODE | K.KEYUP })),
    ];
  }

  static _trackHeld(held, e) {
    if (!e.up) {
      held.push(e);
      return;
    }
    const i = held.findIndex((h) => h.vk === e.vk);
    if (i >= 0) held.splice(i, 1);
  }

  static _restoreIfOurs(clipboard, saved, text) {
    if (!saved) return false;
    try {
      if (clipboard.readText() !== text) return false;
      ClipboardSnapshot.restore(clipboard, saved);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = DesktopKeyboard;
