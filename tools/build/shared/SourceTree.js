const fs = require('fs');
const path = require('path');

class SourceTree {
  static ALWAYS_IGNORED = ['node_modules', '.git'];

  constructor(root, { ignoreTopDirs = [], files = null } = {}) {
    this.root = root;
    this._ignoredTop = new Set(ignoreTopDirs);
    this._files = files ? [...files] : null;
    this._set = null;
    this._sources = new Map();
  }

  jsFiles() {
    return this._allFiles().filter((rel) => rel.endsWith('.js'));
  }

  htmlFiles() {
    return this._allFiles().filter((rel) => rel.toLowerCase().endsWith('.html'));
  }

  has(rel) {
    return this._fileSet().has(rel);
  }

  read(rel) {
    if (!this._sources.has(rel)) this._sources.set(rel, SourceTree._readOrEmpty(this.abs(rel)));
    return this._sources.get(rel);
  }

  abs(rel) {
    return path.join(this.root, ...rel.split('/'));
  }

  relative(absPath) {
    const rel = path.relative(this.root, absPath).split(path.sep).join('/');
    return rel.startsWith('..') || path.isAbsolute(rel) ? null : rel;
  }

  _allFiles() {
    if (!this._files) this._files = this._walk(this.root, []);
    return this._files;
  }

  _fileSet() {
    if (!this._set) this._set = new Set(this._allFiles());
    return this._set;
  }

  _walk(dir, out) {
    for (const entry of SourceTree._entries(dir)) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!this._isIgnoredDir(full, entry.name)) this._walk(full, out);
      } else if (entry.isFile()) {
        out.push(this.relative(full));
      }
    }
    return out;
  }

  _isIgnoredDir(full, name) {
    if (SourceTree.ALWAYS_IGNORED.includes(name)) return true;
    return path.dirname(full) === this.root && this._ignoredTop.has(name);
  }

  static _entries(dir) {
    try { return fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return []; }
  }

  static _readOrEmpty(file) {
    try { return fs.readFileSync(file, 'utf8'); } catch (_) { return ''; }
  }
}

module.exports = SourceTree;
