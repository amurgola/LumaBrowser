const fsp = require('fs').promises;
const path = require('path');
const SearchSkipDirs = require('../SearchSkipDirs');

class ProjectWalker {
  static YIELD_EVERY = 200;

  constructor(rootDir, { ignore = null, allowDirs = new Set() } = {}) {
    this._root = path.resolve(rootDir);
    this._ignore = ignore;
    this._allowDirs = allowDirs;
    this._processed = 0;
  }

  async walk(visit) {
    const stack = [this._root];
    while (stack.length) {
      const entries = await ProjectWalker._readDir(stack.pop());
      const stopped = await this._visitEntries(entries, stack, visit);
      if (stopped) return;
    }
  }

  async _visitEntries(entries, stack, visit) {
    for (const { dir, entry } of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (this._entersDirectory(entry.name, abs)) stack.push(abs);
      } else if (entry.isFile()) {
        if (await this._visitFile(abs, visit) === false) return true;
      }
    }
    return false;
  }

  _entersDirectory(name, abs) {
    if (SearchSkipDirs.isSkipped(name) && !this._allowDirs.has(name)) return false;
    return !(this._ignore && this._ignore.ignores(this._relativeOf(abs), true));
  }

  async _visitFile(abs, visit) {
    const rel = this._relativeOf(abs);
    if (this._ignore && this._ignore.ignores(rel, false)) return true;
    if (await visit(abs, rel) === false) return false;
    if (++this._processed % ProjectWalker.YIELD_EVERY === 0) await new Promise((resolve) => setImmediate(resolve));
    return true;
  }

  _relativeOf(abs) {
    return path.relative(this._root, abs).split(path.sep).join('/');
  }

  static async _readDir(dir) {
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      return entries.map((entry) => ({ dir, entry }));
    } catch (_) {
      return [];
    }
  }
}

module.exports = ProjectWalker;
