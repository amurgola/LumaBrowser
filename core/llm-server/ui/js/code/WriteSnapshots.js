export default class WriteSnapshots {
  static MAX = 40;

  constructor() {
    this._texts = new Map();
    this._held = new Set();
  }

  async record(path, phase, readText) {
    if (phase === 'approval') { this._held.add(path); this._store(path, await readText()); return true; }
    if (phase === 'run') { if (!this._held.has(path)) this._store(path, await readText()); return true; }
    this._held.delete(path);
    return false;
  }

  has(path) {
    return this._texts.has(path);
  }

  get(path) {
    return this._texts.get(path);
  }

  clear() {
    this._texts.clear();
    this._held.clear();
  }

  _store(path, text) {
    this._texts.delete(path);
    this._texts.set(path, text);
    while (this._texts.size > WriteSnapshots.MAX) this._texts.delete(this._texts.keys().next().value);
  }
}
