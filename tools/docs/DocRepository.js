const fs = require('fs');
const path = require('path');
const DocGlob = require('./DocGlob');
const FrontMatterParser = require('./FrontMatterParser');
const GitQuery = require('./GitQuery');

class DocRepository {
  static DOC_ROOT = 'Documentation';
  static SKIPPED_DIRS = new Set(['node_modules', '.git']);

  static findRoot(start, fallback = path.resolve(__dirname, '..', '..')) {
    const top = GitQuery.run(start, ['rev-parse', '--show-toplevel']);
    return top && top.trim() ? top.trim() : fallback;
  }

  constructor(root) {
    this._root = root;
  }

  get root() {
    return this._root;
  }

  listDocs() {
    const out = [];
    this._walkDocs(path.join(this._root, DocRepository.DOC_ROOT), out);
    return out.sort();
  }

  loadDocs() {
    const docs = [];
    for (const full of this.listDocs()) {
      const doc = this._loadDoc(full);
      if (doc) docs.push(doc);
    }
    return docs;
  }

  expandInput(input, cwd = process.cwd()) {
    const abs = path.resolve(cwd, input);
    const rel = DocGlob.normalizePath(path.relative(this._root, abs));
    if (rel.startsWith('..') || !DocRepository._isDirectory(abs)) return [rel];
    const tracked = GitQuery.lines(this._root, ['ls-files', '--', rel || '.']);
    if (tracked.length) return tracked.map(DocGlob.normalizePath);
    return this._walkFiles(abs);
  }

  changedPaths() {
    const set = new Set();
    for (const args of [
      ['diff', '--name-only'],
      ['diff', '--cached', '--name-only'],
      ['ls-files', '--others', '--exclude-standard'],
    ]) {
      for (const line of GitQuery.lines(this._root, args)) set.add(DocGlob.normalizePath(line));
    }
    return [...set].sort();
  }

  _loadDoc(full) {
    const rel = DocGlob.normalizePath(path.relative(this._root, full));
    const fm = FrontMatterParser.parse(fs.readFileSync(full, 'utf8'), rel);
    if (!fm || !fm.applies_to) return null;
    return { file: rel, patterns: fm.applies_to, meta: fm.scope === 'meta', match: fm.applies_to.map(DocGlob.compile) };
  }

  _walkDocs(dir, out) {
    for (const e of DocRepository._entries(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) this._walkDocs(full, out);
      else if (e.isFile() && /\.md$/i.test(e.name)) out.push(full);
    }
  }

  _walkFiles(dir) {
    const files = [];
    const walk = (d) => {
      for (const e of DocRepository._entries(d)) {
        if (DocRepository.SKIPPED_DIRS.has(e.name)) continue;
        const f = path.join(d, e.name);
        if (e.isDirectory()) walk(f); else files.push(DocGlob.normalizePath(path.relative(this._root, f)));
      }
    };
    walk(dir);
    return files.sort();
  }

  static _entries(dir) {
    try { return fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return []; }
  }

  static _isDirectory(abs) {
    try { return fs.statSync(abs).isDirectory(); } catch (_) { return false; }
  }
}

module.exports = DocRepository;
