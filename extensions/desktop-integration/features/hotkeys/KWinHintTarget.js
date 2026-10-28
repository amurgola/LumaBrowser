const KWinWindows = require('../../shared/KWinWindows');

class KWinHintTarget {
  static forSession({ windows = KWinWindows.shared(), ownPid = process.pid } = {}) {
    return windows ? new KWinHintTarget({ windows, ownPid }) : null;
  }

  constructor({ windows, ownPid = process.pid }) {
    this._windows = windows;
    this._ownPid = ownPid;
    this._framed = 0;
    this._pending = null;
    this._stop = null;
  }

  get framed() {
    return this._framed;
  }

  get supported() {
    return !!this._windows;
  }

  begin() {
    this.end();
    this._stop = this._windows.watch((info) => this._onActivated(info));
  }

  end() {
    if (this._stop) { try { this._stop(); } catch (_) {} }
    this._stop = null;
    this._framed = 0;
    this._pending = null;
  }

  poll() {
    const next = this._pending;
    this._pending = null;
    return next;
  }

  frameOf(id) {
    return this._windows.frameOf(id);
  }

  titleOf(id) {
    return this._windows.titleOf(id);
  }

  _onActivated(info) {
    if (!info || info.initial || info.pid === this._ownPid) return;
    const next = info.desktop ? 0 : info.id;
    if (next === this._framed) return;
    this._framed = next;
    this._pending = next;
  }
}

module.exports = KWinHintTarget;
