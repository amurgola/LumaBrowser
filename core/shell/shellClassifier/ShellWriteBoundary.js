const ShellDialect = require('./ShellDialect');
const ShellParser = require('./ShellParser');
const RedirectTarget = require('./RedirectTarget');
const WriteTargets = require('./WriteTargets');
const ShellCommandName = require('./ShellCommandName');
const WritePathScope = require('./WritePathScope');
const WorkingDirectoryTracker = require('./WorkingDirectoryTracker');

class ShellWriteBoundary {
  static KNOWN_NON_WRITERS = new Set([
    'echo', 'printf', 'cat', 'ls', 'dir', 'grep', 'find', 'rg', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'tr', 'awk', 'sed',
    'git', 'npm', 'npx', 'pnpm', 'yarn', 'bun', 'node', 'python', 'python3', 'py', 'pip', 'cargo', 'go', 'dotnet', 'make',
    'cmake', 'tsc', 'eslint', 'prettier', 'jest', 'vitest', 'pytest', 'mvn', 'gradle', 'gradlew', 'javac', 'java', 'gcc',
    'g++', 'clang', 'cl', 'msbuild', 'nvcc', 'rustc', 'ruby', 'bundle', 'php', 'composer', 'test-path', 'get-childitem',
    'get-content', 'select-string', 'write-output', 'write-host', 'pwd', 'get-location', 'which', 'where', 'type', 'findstr',
    'true', 'false', 'test', '[', 'date', 'hostname', 'whoami', 'env', 'printenv', 'set', 'export', 'unset', 'exit', 'sleep',
    'start-sleep', 'diff', 'compare-object', 'measure-object', 'select-object', 'where-object', 'foreach-object', 'sort-object',
    'format-table', 'format-list', 'out-string', 'convertto-json', 'convertfrom-json', 'jq', 'yq', 'tree', 'stat', 'file', 'du', 'df',
  ]);

  static NON_WRITER_VERBS = /^(get|test|select|measure|compare|convertto|convertfrom|show|find|resolve|format|out-string|write-)/;

  static check(command, cwd, allowedRoots, options = {}) {
    return new ShellWriteBoundary()._execute(command, cwd, allowedRoots, options);
  }

  _execute(command, cwd, allowedRoots, options) {
    this._setupSharedVariablesFromParameters(command, cwd, allowedRoots, options);
    for (const parsed of ShellParser.parseLine(command, { dialect: this._dialect })) this._inspect(parsed);
    return this._result();
  }

  _setupSharedVariablesFromParameters(command, cwd, allowedRoots, options) {
    const roots = (Array.isArray(allowedRoots) ? allowedRoots : [allowedRoots]).filter(Boolean).map(String);
    const start = String(cwd || roots[0] || process.cwd());
    const env = options.env || process.env;
    this._scope = new WritePathScope(start, roots, env);
    this._dialect = ShellWriteBoundary._dialectFor(command, options, this._scope.isWindows);
    this._directory = new WorkingDirectoryTracker(start, this._scope, env);
    this._outside = [];
    this._unverifiable = [];
  }

  static _dialectFor(command, options, windows) {
    if (options.dialect && options.dialect !== 'auto') return ShellDialect.normalize(options.dialect);
    return ShellDialect.guess(command, options.platform || (windows ? 'win32' : 'linux'));
  }

  _inspect(command) {
    const name = command.name ? ShellCommandName.base(command.name) : null;
    if (name && WorkingDirectoryTracker.changesDirectory(name)) {
      this._changeDirectory(name, command.args);
      return;
    }
    this._checkRedirects(command.redirects);
    if (name) this._checkProgram(name, command.args);
  }

  _checkProgram(name, args) {
    const targets = WriteTargets.of(name, args, this._dialect);
    if (targets) this._checkTargets(name, targets);
    else if (ShellWriteBoundary._isKnownNonWriter(name)) this._checkWorkingDirectory(name);
    else this._unverifiable.push(name);
  }

  _changeDirectory(name, args) {
    const unresolved = this._directory.change(name, args);
    if (unresolved) this._unverifiable.push(unresolved);
  }

  _checkRedirects(redirects) {
    for (const redirect of redirects) {
      if (RedirectTarget.isNull(redirect.target)) continue;
      this._checkPath(redirect.target, `${redirect.op} ${redirect.target}`);
    }
  }

  _checkTargets(name, targets) {
    for (const target of targets) {
      if (!target || target.startsWith('-')) continue;
      this._checkPath(target, `${name} ${target}`);
    }
  }

  _checkPath(word, description) {
    const absolute = this._directory.resolve(word);
    if (absolute == null) this._unverifiable.push(description);
    else if (!this._scope.allows(absolute)) this._outside.push(absolute);
  }

  static _isKnownNonWriter(name) {
    return ShellWriteBoundary.KNOWN_NON_WRITERS.has(name) || ShellWriteBoundary.NON_WRITER_VERBS.test(name);
  }

  _checkWorkingDirectory(name) {
    if (!this._directory.known) this._unverifiable.push(name);
    else if (!this._scope.allows(this._directory.cwd)) this._outside.push(this._scope.normalize(this._directory.cwd));
  }

  _result() {
    const outside = [...new Set(this._outside)];
    const unverifiable = [...new Set(this._unverifiable)];
    return { within: outside.length === 0 && unverifiable.length === 0, outside, unverifiable, dialect: this._dialect };
  }
}

module.exports = ShellWriteBoundary;
