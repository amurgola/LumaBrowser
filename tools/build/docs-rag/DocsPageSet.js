const fs = require('fs');
const path = require('path');

const DOCS_DIR = 'Documentation';
const PROD_SYNC_DIR = path.join('tools', 'build', 'prod-sync');

class DocsPageSet {
  static DOCS_DIR = DOCS_DIR;

  constructor({ rootDir, mode, listFiles } = {}) {
    this._rootDir = rootDir;
    this._mode = mode || DocsPageSet.detectMode(rootDir);
    this._listFiles = listFiles;
  }

  static detectMode(rootDir) {
    return fs.existsSync(path.join(rootDir, PROD_SYNC_DIR, 'ProdFileSet.js')) ? 'dev' : 'prod';
  }

  get mode() {
    return this._mode;
  }

  list() {
    return this._mode === 'dev' ? this._listDev() : this._listProd();
  }

  _listDev() {
    const ProdFileSet = require('../prod-sync/ProdFileSet');
    const DocScrubber = require('../prod-sync/DocScrubber');
    const scrubber = new DocScrubber({
      excludedDirs: ProdFileSet.DOC_EXCLUDED_DIRS,
      excludedSegments: ProdFileSet.EXCLUDED_ANY_DEPTH,
    });
    const prefix = `${DOCS_DIR}/`;
    return new ProdFileSet({ rootDir: this._rootDir, listFiles: this._listFiles }).list()
      .filter((rel) => rel.startsWith(prefix) && rel.endsWith('.md'))
      .map((rel) => rel.slice(prefix.length))
      .map((rel) => ({ rel, text: scrubber.scrub(this._read(rel), rel) }));
  }

  _listProd() {
    const docsRoot = path.join(this._rootDir, DOCS_DIR);
    if (!fs.existsSync(docsRoot)) return [];
    return DocsPageSet._walk(docsRoot, '')
      .sort()
      .map((rel) => ({ rel, text: this._read(rel) }));
  }

  _read(rel) {
    return fs.readFileSync(path.join(this._rootDir, DOCS_DIR, ...rel.split('/')), 'utf8');
  }

  static _walk(dir, relDir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) out.push(...DocsPageSet._walk(path.join(dir, entry.name), rel));
      else if (entry.isFile() && entry.name.endsWith('.md')) out.push(rel);
    }
    return out;
  }
}

module.exports = DocsPageSet;
