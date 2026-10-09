const os = require('os');
const FileProbe = require('./FileProbe');

class LibrarySource {
  static MIN_MODEL_BYTES = 64 * 1024 * 1024;

  constructor(env) {
    this._env = env || {};
  }

  get id() {
    throw new Error(`${this.constructor.name} must implement get id()`);
  }

  get label() {
    throw new Error(`${this.constructor.name} must implement get label()`);
  }

  scan() {
    for (const root of this.roots()) {
      if (!FileProbe.isDirectory(root)) continue;
      const found = this._scanRoot(root);
      if (found.length) return found.map((hit) => ({ source: this.id, sourceLabel: this.label, ...hit }));
    }
    return [];
  }

  roots() {
    throw new Error(`${this.constructor.name} must implement roots()`);
  }

  _scanRoot(root) {
    throw new Error(`${this.constructor.name} must implement _scanRoot(root)`);
  }

  static homeDir() {
    try {
      return os.homedir();
    } catch (_) {
      return null;
    }
  }
}

module.exports = LibrarySource;
