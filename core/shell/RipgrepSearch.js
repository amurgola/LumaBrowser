const { spawn } = require('child_process');
const RipgrepBinary = require('./RipgrepBinary');
const RipgrepRun = require('./RipgrepRun');
const SearchSkipDirs = require('./SearchSkipDirs');

class RipgrepSearch {
  static DEFAULT_GREP_LIMIT = 100;
  static MAX_FILE_SIZE = '2M';

  constructor({ spawn: spawnFn = spawn, binaryPath } = {}) {
    this._spawn = spawnFn;
    this._binaryPath = binaryPath;
  }

  static available() {
    return RipgrepBinary.available();
  }

  grep(rootDir, options = {}) {
    const exe = this._binaryPath || RipgrepBinary.path();
    if (!exe) return Promise.reject(new Error('ripgrep is not available on this platform'));
    const child = this._spawnSearch(exe, rootDir, options);
    return new RipgrepRun(child, rootDir, RipgrepSearch._limitOf(options)).result();
  }

  static buildArgs(options = {}) {
    const args = ['--no-config', '--json', '--stats', '--no-require-git', '--max-filesize', RipgrepSearch.MAX_FILE_SIZE];
    args.push(...RipgrepSearch._skipDirGlobs(options.glob));
    if (options.ignoreCase) args.push('--ignore-case');
    if (options.glob) args.push('--glob', String(options.glob));
    args.push('-e', String(options.pattern), '--', '.');
    return args;
  }

  static _skipDirGlobs(glob) {
    return SearchSkipDirs.effectiveFor(glob).flatMap((dir) => ['--glob', `!**/${dir}`, '--glob', `!**/${dir}/**`]);
  }

  static _limitOf(options) {
    return Number(options.maxMatches) > 0 ? Math.floor(Number(options.maxMatches)) : RipgrepSearch.DEFAULT_GREP_LIMIT;
  }

  _spawnSearch(exe, rootDir, options) {
    return this._spawn(exe, RipgrepSearch.buildArgs(options), {
      cwd: rootDir,
      env: { ...process.env, RIPGREP_CONFIG_PATH: '' },
      windowsHide: true,
    });
  }
}

module.exports = RipgrepSearch;
