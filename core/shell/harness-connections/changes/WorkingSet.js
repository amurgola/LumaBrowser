const ConfigFile = require('../ConfigFile');

class WorkingSet {
  constructor({ readText = (file) => ConfigFile.readTextOr(file, null) } = {}) {
    this._readText = readText;
    this._files = new Map();
  }

  open(file, format) {
    const entry = this._entry(file);
    if (!entry.document) entry.document = format.open(entry.before);
    return entry.document;
  }

  original(file) {
    return this._entry(file).before;
  }

  replace(file, text) {
    this._entry(file).replacement = { text };
  }

  changes() {
    return [...this._files.entries()]
      .map(([file, entry]) => ({ file, before: entry.before, after: WorkingSet._after(entry) }))
      .filter((change) => change.after !== change.before);
  }

  commit(tx) {
    for (const { file, after } of this.changes()) {
      if (after === null) tx.remove(file);
      else tx.write(file, after);
    }
  }

  _entry(file) {
    if (!this._files.has(file)) this._files.set(file, { before: this._readText(file), document: null, replacement: null });
    return this._files.get(file);
  }

  static _after(entry) {
    if (entry.replacement) return entry.replacement.text;
    return entry.document && entry.document.edited() ? entry.document.toString() : entry.before;
  }
}

module.exports = WorkingSet;
