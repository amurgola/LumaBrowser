const ShellWords = require('./ShellWords');

class RedirectTarget {
  static NULL_TARGETS = Object.freeze(['/dev/null', 'nul', 'nul:', '$null', '/dev/stdout', '/dev/stderr', '&1', '&2']);

  static isNull(target) {
    const unquoted = ShellWords.lower(target).replace(/^["']|["']$/g, '');
    return RedirectTarget.NULL_TARGETS.includes(unquoted);
  }
}

module.exports = RedirectTarget;
