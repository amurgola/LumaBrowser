const DocRepository = require('./DocRepository');
const DocResolver = require('./DocResolver');
const DocGlob = require('./DocGlob');

class DocsForCli {
  static USAGE = [
    'usage: node scripts/docs-for.js <path...> | --changed | --all  [--explain] [--json]',
    '',
    '  <path...>   files or directories (directories expand through git ls-files)',
    '  --changed   unstaged + staged + untracked paths in the working tree',
    '  --all       list every doc that declares applies_to, with its patterns',
    '  --explain   show the pattern that matched each path',
    '  --json      machine-readable output',
  ].join('\n');

  constructor(io = {}) {
    this._out = io.out || ((s) => process.stdout.write(s + '\n'));
    this._err = io.err || ((s) => process.stderr.write(s + '\n'));
    this._repo = new DocRepository(io.root || DocRepository.findRoot(process.cwd()));
  }

  execute(argv) {
    this._readArguments(argv);
    if (this._wantsUsage()) { this._out(DocsForCli.USAGE); return 0; }
    if (!this._loadDocs()) return 1;
    if (this._flags.has('--all')) return this._printAll();
    return this._printResolution(this._collectPaths());
  }

  _readArguments(argv) {
    this._flags = new Set(argv.filter((a) => a.startsWith('--')));
    this._inputs = argv.filter((a) => !a.startsWith('--'));
    this._json = this._flags.has('--json');
    this._explain = this._flags.has('--explain');
  }

  _wantsUsage() {
    if (this._flags.has('--help') || this._flags.has('-h')) return true;
    return !this._inputs.length && !this._flags.has('--changed') && !this._flags.has('--all');
  }

  _loadDocs() {
    try {
      this._docs = this._repo.loadDocs();
      return true;
    } catch (e) {
      this._err(`docs-for: ${e.message}`);
      return false;
    }
  }

  _printAll() {
    const docs = this._docs;
    if (this._json) {
      this._out(JSON.stringify({ docs: docs.map((d) => ({ file: d.file, meta: d.meta, patterns: d.patterns })) }, null, 2));
      return 0;
    }
    for (const d of docs) {
      this._out(d.meta ? `${d.file}  (meta, governs no code)` : d.file);
      if (!d.meta) for (const p of d.patterns) this._out(`  ${p}`);
    }
    this._out(`\n${docs.length} docs (${docs.filter((d) => d.meta).length} meta)`);
    return 0;
  }

  _collectPaths() {
    const paths = this._flags.has('--changed') ? this._repo.changedPaths() : [];
    for (const input of this._inputs) paths.push(...this._repo.expandInput(input));
    return [...new Set(paths)].sort();
  }

  _printResolution(paths) {
    const result = DocResolver.resolve(this._docs, paths);
    if (this._json) return this._printJson(result);
    if (!paths.length) { this._out(this._flags.has('--changed') ? 'No changed paths.' : 'No paths.'); return 0; }
    const { docSet, ungoverned } = this._printPerPath(result);
    this._printSummary(docSet, paths.length, ungoverned);
    return 0;
  }

  _printJson(result) {
    const paths = {};
    for (const [p, hits] of result) paths[p] = hits;
    this._out(JSON.stringify({ root: DocGlob.normalizePath(this._repo.root), paths }, null, 2));
    return 0;
  }

  _printPerPath(result) {
    const docSet = new Set();
    let ungoverned = 0;
    for (const [p, hits] of result) {
      this._out(p);
      if (!hits.length) { this._out('  (no governing doc)'); ungoverned += 1; continue; }
      for (const h of hits) {
        docSet.add(h.doc);
        this._out(this._explain ? `  ${h.doc}  (${h.pattern})` : `  ${h.doc}`);
      }
    }
    return { docSet, ungoverned };
  }

  _printSummary(docSet, pathCount, ungoverned) {
    const docs = docSet.size === 1 ? ' governs' : 's govern';
    this._out('');
    this._out(`${docSet.size} doc${docs} ${pathCount} path${pathCount === 1 ? '' : 's'}; ${ungoverned} ungoverned`);
    if (!docSet.size) return;
    this._out('Read before editing, update in the same change when behaviour moves:');
    for (const d of [...docSet].sort()) this._out(`  ${d}`);
  }
}

module.exports = DocsForCli;
