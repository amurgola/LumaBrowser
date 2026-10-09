class RollbackBuffer {
  static HOLD_MARKERS = ['```', '<tool_call', '<function'];

  constructor(write) {
    this.write = write;
    this.pending = '';
  }

  push(text) {
    this.pending += text;
    const hold = RollbackBuffer._lastMarker(this.pending);
    if (hold === -1) { this._writeAll(); return; }
    if (hold > 0) {
      this.write(this.pending.slice(0, hold));
      this.pending = this.pending.slice(hold);
    }
  }

  rollback(chars) {
    const n = Math.min(Number(chars) || 0, this.pending.length);
    this.pending = n >= this.pending.length ? '' : this.pending.slice(0, -n);
  }

  flush() {
    if (this.pending) this._writeAll();
  }

  reset() {
    this.pending = '';
  }

  _writeAll() {
    this.write(this.pending);
    this.pending = '';
  }

  static _lastMarker(text) {
    let hold = -1;
    for (const marker of RollbackBuffer.HOLD_MARKERS) hold = Math.max(hold, text.lastIndexOf(marker));
    return hold;
  }
}

module.exports = RollbackBuffer;
