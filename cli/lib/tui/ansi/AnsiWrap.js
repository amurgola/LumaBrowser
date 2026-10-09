const AnsiEscape = require('./AnsiEscape');
const CellWidth = require('./CellWidth');
const SgrState = require('./SgrState');
const LineFiller = require('./LineFiller');

class AnsiWrap {
  static wrap(text, width) {
    const w = width < 1 ? 1 : width;
    const state = new SgrState();
    const out = [];
    for (const line of String(text == null ? '' : text).split(/\r\n|\r|\n/)) {
      for (const l of AnsiWrap._wrapLine(line, w, state)) out.push(l);
    }
    return out.length ? out : [''];
  }

  static _wrapLine(line, width, state) {
    if (CellWidth.visible(line) <= width) {
      const out = state.open() + line;
      state.consume(line);
      return [out];
    }
    return new LineFiller(width, state).fill(AnsiWrap._tokenize(line));
  }

  static _tokenize(text) {
    const tokens = [];
    let cur = '';
    let kind = null;
    let pendingEsc = '';
    let i = 0;
    const flush = () => { if (cur) { tokens.push(cur); cur = ''; kind = null; } };
    while (i < text.length) {
      const e = AnsiEscape.at(text, i);
      if (e) { pendingEsc += e.code; i += e.length; continue; }
      const cp = text.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      i += ch.length;
      const k = ch === ' ' ? 'space' : 'word';
      if (cur && kind !== k) flush();
      if (pendingEsc) { cur += pendingEsc; pendingEsc = ''; }
      kind = k;
      cur += ch;
      if (k === 'word' && CellWidth.isWide(cp)) flush();
    }
    if (pendingEsc) {
      if (cur) cur += pendingEsc;
      else if (tokens.length) tokens[tokens.length - 1] += pendingEsc;
      else cur = pendingEsc;
    }
    flush();
    return tokens;
  }
}

module.exports = AnsiWrap;
