const fsp = require('fs').promises;
const path = require('path');
const RipgrepSearch = require('./RipgrepSearch');
const GitignoreFilter = require('./GitignoreFilter');
const ContainerPath = require('./ContainerPath');
const ContainerFs = require('./ContainerFs');
const ProjectWalker = require('./code-search/ProjectWalker');
const FileGrep = require('./code-search/FileGrep');
const SearchQuery = require('./code-search/SearchQuery');
const ContainerCodeSearch = require('./code-search/ContainerCodeSearch');

class CodeSearch {
  static FINAL_RIPGREP_ERROR = /could not be parsed|read safely/;

  constructor({ useRipgrep = true, respectGitignore = true, fsOps = null, ripgrep = null } = {}) {
    this._useRipgrep = useRipgrep !== false;
    this._respectGitignore = respectGitignore !== false;
    this._fs = fsOps;
    this._rg = ripgrep || new RipgrepSearch();
    this._ignoreCache = new Map();
  }

  async grep(rootDir, options = {}) {
    if (ContainerPath.isContainerPath(rootDir)) return ContainerCodeSearch.grep(rootDir, options);
    const fromRipgrep = await this._tryRipgrep(rootDir, options);
    if (fromRipgrep) return { ...fromRipgrep, skippedDirs: SearchQuery.skippedDirs(options) };
    return this._walkGrep(rootDir, options);
  }

  async find(rootDir, options = {}) {
    if (ContainerPath.isContainerPath(rootDir)) return ContainerCodeSearch.find(rootDir, options);
    const filter = SearchQuery.fileFilter(options);
    const limit = SearchQuery.findLimit(options);
    const files = [];
    let limitReached = false;
    await this._walker(rootDir, options).walk(async (_abs, rel) => {
      if (filter && !filter.test(rel)) return true;
      files.push(rel);
      limitReached = files.length >= limit;
      return !limitReached;
    });
    return { files: files.sort(), limitReached, skippedDirs: SearchQuery.skippedDirs(options) };
  }

  async listDir(absDir) {
    const at = ContainerPath.parse(absDir);
    const entries = at ? CodeSearch._containerEntries(at, absDir) : await CodeSearch._hostEntries(absDir);
    return entries.sort(CodeSearch._directoriesFirst);
  }

  async _tryRipgrep(rootDir, options) {
    if (!this._useRipgrep || !RipgrepSearch.available()) return null;
    try {
      return await this._rg.grep(rootDir, options);
    } catch (err) {
      if (CodeSearch.FINAL_RIPGREP_ERROR.test(err && err.message)) throw err;
      console.warn(`[code-search] ripgrep unavailable, using the built-in walk: ${err && err.message}`);
      return null;
    }
  }

  async _walkGrep(rootDir, options) {
    const regex = SearchQuery.pattern(options);
    const filter = SearchQuery.fileFilter(options);
    const limit = SearchQuery.grepLimit(options);
    const matches = [];
    let scanned = 0;
    let limitReached = false;
    await this._walker(rootDir, options).walk(async (abs, rel) => {
      if (filter && !filter.test(rel)) return true;
      scanned++;
      limitReached = await FileGrep.search(abs, rel, regex, limit, matches);
      return !limitReached;
    });
    return { matches, limitReached, scanned, skippedDirs: SearchQuery.skippedDirs(options) };
  }

  _walker(rootDir, options) {
    const ignore = this._ignoreFor(path.resolve(rootDir));
    return new ProjectWalker(rootDir, { ignore, allowDirs: SearchQuery.allowDirs(options) });
  }

  _ignoreFor(root) {
    if (!this._respectGitignore) return null;
    if (!this._ignoreCache.has(root)) {
      const filter = GitignoreFilter.forRoot(root, this._fs || undefined);
      this._ignoreCache.set(root, filter.empty ? null : filter);
    }
    return this._ignoreCache.get(root);
  }

  static _containerEntries(at, absDir) {
    return ContainerFs.list(at.container, at.posix, absDir)
      .map((e) => (e.type === 'd' ? { name: e.name, type: 'dir' } : { name: e.name, type: 'file', bytes: e.bytes }));
  }

  static async _hostEntries(absDir) {
    const entries = await fsp.readdir(absDir, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (e.isDirectory()) out.push({ name: e.name, type: 'dir' });
      else out.push({ name: e.name, type: 'file', bytes: await FileGrep.sizeOf(path.join(absDir, e.name)) });
    }
    return out;
  }

  static _directoriesFirst(a, b) {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  }
}

module.exports = CodeSearch;
