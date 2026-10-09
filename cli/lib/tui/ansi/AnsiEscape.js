class AnsiEscape {
  static ESC = '\x1b';

  static at(str, pos) {
    if (str.charCodeAt(pos) !== 0x1b) return null;
    const next = str[pos + 1];
    if (next === '[') return AnsiEscape._csi(str, pos);
    if (next === ']' || next === '_' || next === 'P') return AnsiEscape._stringSequence(str, pos);
    return { code: str.slice(pos, pos + 2), length: 2 };
  }

  static strip(str) {
    if (!str || str.indexOf(AnsiEscape.ESC) === -1) return str || '';
    let out = '';
    let i = 0;
    while (i < str.length) {
      const e = AnsiEscape.at(str, i);
      if (e) { i += e.length; continue; }
      out += str[i++];
    }
    return out;
  }

  static _csi(str, pos) {
    for (let i = pos + 2; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c >= 0x40 && c <= 0x7e) return { code: str.slice(pos, i + 1), length: i + 1 - pos };
    }
    return null;
  }

  static _stringSequence(str, pos) {
    for (let i = pos + 2; i < str.length; i++) {
      if (str[i] === '\x07') return { code: str.slice(pos, i + 1), length: i + 1 - pos };
      if (str[i] === AnsiEscape.ESC && str[i + 1] === '\\') return { code: str.slice(pos, i + 2), length: i + 2 - pos };
    }
    return null;
  }
}

module.exports = AnsiEscape;
