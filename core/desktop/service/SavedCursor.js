class SavedCursor {
  constructor(api) {
    this._api = api;
    this._buffer = Buffer.alloc(8);
    this._saved = !!api.GetCursorPos(this._buffer);
  }

  get saved() {
    return this._saved;
  }

  restore() {
    if (this._saved) this._api.SetCursorPos(this._buffer.readInt32LE(0), this._buffer.readInt32LE(4));
  }
}

module.exports = SavedCursor;
