const GameTool = require('../GameTool');

class ProjectTool extends GameTool {
  constructor(scope, budget) {
    super(scope);
    this._budget = budget;
  }

  _session() {
    const s = this._scope.session();
    s.calls = (s.calls || 0) + 1;
    return s;
  }

  get _code() {
    return this._scope.code;
  }

  _bounded(text, limitNote) {
    const bounded = this._budget.truncator.truncate(text, { strategy: 'head' });
    return `${bounded.text}${bounded.notice ? `\n${bounded.notice}` : ''}${limitNote || ''}`;
  }

  static _plural(n, one, many) {
    return n === 1 ? one : many;
  }

  static _skippedNote(res) {
    const dirs = res && Array.isArray(res.skippedDirs) ? res.skippedDirs : [];
    if (!dirs.length) return '';
    return ` (Search never descends into ${dirs.join(', ')}; to look inside one,`
      + ' name it in the glob, e.g. "build/**".)';
  }
}

module.exports = ProjectTool;
