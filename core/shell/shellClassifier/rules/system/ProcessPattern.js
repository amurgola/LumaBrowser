const ShellWords = require('../../ShellWords');

class ProcessPattern {
  static REGEX = 'regex';
  static GLOB = 'glob';
  static EXACT = 'exact';

  static UNRELATED_NAMES = Object.freeze(['a', 'zz9', 'systemd', 'x-y_z', 'Q']);

  constructor(text, kind) {
    this.text = String(text ?? '');
    this.kind = kind;
    this._search = ProcessPattern._compile(ProcessPattern._stripExe(ShellWords.lower(this.text)), kind);
    Object.freeze(this);
  }

  hits(processName) {
    return this._search.test(ProcessPattern._stripExe(ShellWords.lower(processName)));
  }

  names(processName) {
    const whole = this.kind === ProcessPattern.REGEX ? ProcessPattern._anchored(this.text) : this._search;
    return whole.test(ProcessPattern._stripExe(ShellWords.lower(processName)));
  }

  hitsEverything() {
    return ProcessPattern.UNRELATED_NAMES.every((name) => this.hits(name));
  }

  isWildcard() {
    return this.kind === ProcessPattern.GLOB && /[*?]/.test(this.text);
  }

  static _stripExe(name) {
    return name.replace(/\.exe$/, '');
  }

  static _compile(text, kind) {
    if (kind === ProcessPattern.REGEX) return ProcessPattern._safeRegex(text, text);
    if (kind === ProcessPattern.GLOB) return new RegExp(`^${ProcessPattern._escape(text).replace(/\\\*/g, '.*').replace(/\\\?/g, '.')}$`);
    return ProcessPattern._literal(text);
  }

  static _anchored(text) {
    const core = ProcessPattern._stripExe(ShellWords.lower(text)).replace(/^\^/, '').replace(/\$$/, '');
    return ProcessPattern._safeRegex(`^(?:${core})$`, core);
  }

  static _safeRegex(body, source) {
    try {
      return new RegExp(body, 'i');
    } catch (_) {
      return ProcessPattern._literal(source);
    }
  }

  static _literal(text) {
    return new RegExp(`^${ProcessPattern._escape(text)}$`, 'i');
  }

  static _escape(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = ProcessPattern;
