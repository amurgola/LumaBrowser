export default class OpenFiles {
  constructor() {
    this._files = new Map();
    this.activePath = null;
  }

  get size() {
    return this._files.size;
  }

  get(path) {
    return this._files.get(path);
  }

  has(path) {
    return this._files.has(path);
  }

  set(path, entry) {
    this._files.set(path, entry);
  }

  delete(path) {
    const entry = this._files.get(path);
    if (entry && !entry.image && entry.model) { try { entry.model.dispose(); } catch (_) {} }
    this._files.delete(path);
  }

  paths() {
    return Array.from(this._files.keys());
  }

  entries() {
    return Array.from(this._files.entries());
  }

  active() {
    return this.activePath ? this._files.get(this.activePath) || null : null;
  }

  activeText() {
    const entry = this.active();
    return entry && !entry.image ? entry : null;
  }

  dirtyCount() {
    return this.entries().filter(([, f]) => f.dirty).length;
  }

  hasUnsaved() {
    return this.dirtyCount() > 0;
  }

  clear() {
    for (const path of this.paths()) this.delete(path);
    this.activePath = null;
  }
}
