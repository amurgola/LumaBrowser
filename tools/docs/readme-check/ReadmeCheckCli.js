const fs = require('fs');
const path = require('path');
const ReadmeCheck = require('./ReadmeCheck');

class ReadmeCheckCli {
  static ROOT = path.resolve(__dirname, '..', '..', '..');
  static README = 'README.md';
  static FEATURES_DIR = path.join('Documentation', 'features');

  constructor({ log = (m) => console.log(m), rootDir = ReadmeCheckCli.ROOT } = {}) {
    this._log = log;
    this._root = rootDir;
  }

  execute(argv) {
    let options;
    try { options = this._parse(argv); } catch (err) {
      this._log(err.message);
      return 2;
    }
    let failed = 0;
    for (const rel of options.files) {
      const abs = path.resolve(this._root, rel);
      if (!fs.existsSync(abs)) { this._log(`${rel}: not found`); failed++; continue; }
      const isReadme = path.basename(abs).toLowerCase() === 'readme.md' && path.dirname(abs) === this._root;
      const result = ReadmeCheck.run(fs.readFileSync(abs, 'utf8'), {
        maxWords: isReadme ? options.maxWords : Infinity,
        baseDir: path.dirname(abs),
        exists: (p) => fs.existsSync(p),
        readText: (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } },
      });
      const budget = isReadme ? ` of ${options.maxWords}` : '';
      this._log(`${rel}: ${result.words} words${budget}, ${result.problems.length} problem${result.problems.length === 1 ? '' : 's'}`);
      result.problems.forEach((p) => this._log(`  ${p}`));
      failed += result.problems.length;
    }
    return failed ? 1 : 0;
  }

  _parse(argv) {
    const o = { maxWords: ReadmeCheck.DEFAULT_MAX_WORDS, files: [] };
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--max-words') {
        const n = Number(argv[++i]);
        if (!Number.isInteger(n) || n <= 0) throw new Error('--max-words wants a whole number of words');
        o.maxWords = n;
      } else if (argv[i].startsWith('--')) {
        throw new Error(`unknown option ${argv[i]}\nusage: npm run readme:check [-- --max-words <n>] [files...]`);
      } else o.files.push(argv[i]);
    }
    if (!o.files.length) o.files = this._defaultFiles();
    return o;
  }

  _defaultFiles() {
    const dir = path.join(this._root, ReadmeCheckCli.FEATURES_DIR);
    const pages = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => path.join(ReadmeCheckCli.FEATURES_DIR, f))
      : [];
    return [ReadmeCheckCli.README, ...pages];
  }
}

module.exports = ReadmeCheckCli;
