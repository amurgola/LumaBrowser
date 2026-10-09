const PowerShellArgs = require('./PowerShellArgs');
const ShellPathExpander = require('./ShellPathExpander');

class WorkingDirectoryTracker {
  static CHANGERS = new Set(['cd', 'chdir', 'set-location', 'sl', 'pushd', 'push-location', 'popd', 'pop-location']);
  static POPPERS = ['popd', 'pop-location'];
  static PUSHERS = ['pushd', 'push-location'];

  constructor(start, scope, env) {
    this._cwd = start;
    this._scope = scope;
    this._env = env;
    this._stack = [];
    this._known = true;
  }

  get cwd() {
    return this._cwd;
  }

  get known() {
    return this._known;
  }

  static changesDirectory(name) {
    return WorkingDirectoryTracker.CHANGERS.has(name);
  }

  change(name, args) {
    if (WorkingDirectoryTracker.POPPERS.includes(name)) return this._pop();
    const target = WorkingDirectoryTracker._targetOf(args);
    if (WorkingDirectoryTracker.PUSHERS.includes(name)) this._stack.push(this._cwd);
    if (!target) return this._goHome();
    if (target === '-') return this._goBack();
    return this._goTo(name, target);
  }

  resolve(word) {
    const expanded = ShellPathExpander.expand(ShellPathExpander.unquote(word), this._env);
    if (ShellPathExpander.hasUnresolvedVariable(expanded)) return null;
    if (!this._known && !this._scope.path.isAbsolute(expanded)) return null;
    return this._scope.path.resolve(this._cwd, expanded);
  }

  static _targetOf(args) {
    const named = PowerShellArgs.param(args, ['Path', 'LiteralPath']);
    return typeof named === 'string' ? named : args.find((arg) => !arg.startsWith('-')) || '';
  }

  _pop() {
    if (this._stack.length) this._cwd = this._stack.pop();
    else this._known = false;
    return null;
  }

  _goHome() {
    const home = ShellPathExpander.homeOf(this._env);
    if (home) this._cwd = home;
    else this._known = false;
    return null;
  }

  _goBack() {
    if (this._stack.length) this._cwd = this._stack[this._stack.length - 1];
    else this._known = false;
    return null;
  }

  _goTo(name, target) {
    const resolved = this.resolve(target);
    if (resolved == null) {
      this._known = false;
      return `${name} ${target}`;
    }
    this._cwd = resolved;
    return null;
  }
}

module.exports = WorkingDirectoryTracker;
