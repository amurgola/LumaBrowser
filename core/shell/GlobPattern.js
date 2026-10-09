class GlobPattern {
  static SPECIALS = /[.+^${}()|[\]\\]/g;

  static toSource(glob, { braces = false } = {}) {
    const text = String(glob);
    let source = '';
    for (let i = 0; i < text.length; i++) {
      const step = GlobPattern._token(text, i, braces);
      source += step.source;
      i = step.end;
    }
    return source;
  }

  static toRegExp(glob) {
    return new RegExp(`(^|/)${GlobPattern.toSource(glob, { braces: true })}$`);
  }

  static escape(text) {
    return String(text).replace(GlobPattern.SPECIALS, '\\$&');
  }

  static _token(text, i, braces) {
    const ch = text[i];
    if (ch === '*' && text[i + 1] === '*') return GlobPattern._doubleStar(text, i + 1);
    if (ch === '*') return { source: '[^/]*', end: i };
    if (ch === '?') return { source: '[^/]', end: i };
    if (ch === '{' && braces) return GlobPattern._alternation(text, i);
    return { source: GlobPattern.escape(ch), end: i };
  }

  static _doubleStar(text, secondStar) {
    if (text[secondStar + 1] === '/') return { source: '(?:.*/)?', end: secondStar + 1 };
    return { source: '.*', end: secondStar };
  }

  static _alternation(text, open) {
    const close = text.indexOf('}', open);
    if (close === -1) return { source: GlobPattern.escape('{'), end: open };
    const options = text.slice(open + 1, close).split(',').map((option) => GlobPattern.toSource(option));
    return { source: `(${options.join('|')})`, end: close };
  }
}

module.exports = GlobPattern;
