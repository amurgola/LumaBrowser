const fs = require('fs');
const os = require('os');
const path = require('path');

class JournalFiles {
  static FOLDER = 'roleplay-logs';

  constructor({ dir = null } = {}) {
    this._dir = dir;
    this._resolved = null;
  }

  dir() {
    if (this._resolved) return this._resolved;
    const given = typeof this._dir === 'function' ? this._dir() : this._dir;
    this._resolved = given || JournalFiles.defaultDir();
    return this._resolved;
  }

  static defaultDir() {
    try {
      const { app } = require('electron');
      if (app && typeof app.getPath === 'function') return path.join(app.getPath('userData'), JournalFiles.FOLDER);
    } catch (_) {}
    return path.join(os.tmpdir(), 'luma-' + JournalFiles.FOLDER);
  }

  paths(conversationId) {
    const safe = String(conversationId || 'conversation').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80);
    return { md: path.join(this.dir(), safe + '.md'), jsonl: path.join(this.dir(), safe + '.jsonl') };
  }

  exists(conversationId) {
    try { return fs.existsSync(this.paths(conversationId).jsonl); } catch (_) { return false; }
  }

  append(conversationId, event, markdown) {
    try {
      const p = this.paths(conversationId);
      fs.mkdirSync(this.dir(), { recursive: true });
      fs.appendFileSync(p.jsonl, JSON.stringify(event) + '\n', 'utf8');
      if (markdown) fs.appendFileSync(p.md, markdown.replace(/\n*$/, '\n\n'), 'utf8');
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = JournalFiles;
