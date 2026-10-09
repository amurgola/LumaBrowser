const AnsiEscape = require('./AnsiEscape');
const CellWidth = require('./CellWidth');

class LineFiller {
  constructor(width, state) {
    this.width = width;
    this.state = state;
    this.lines = [];
    this.cur = state.open();
    this.w = 0;
  }

  fill(tokens) {
    for (const tok of tokens) this._place(tok);
    this.lines.push(this.cur);
    return this.lines;
  }

  static breakLong(token, width, state) {
    const lines = [];
    let cur = state.open();
    let w = 0;
    let i = 0;
    while (i < token.length) {
      const e = AnsiEscape.at(token, i);
      if (e) { cur += e.code; state.process(e.code); i += e.length; continue; }
      const cp = token.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      i += ch.length;
      const cw = CellWidth.charWidth(cp);
      if (w + cw > width && w > 0) {
        lines.push(cur + state.close());
        cur = state.open();
        w = 0;
      }
      cur += ch;
      w += cw;
    }
    lines.push(cur);
    return lines;
  }

  _place(tok) {
    const tw = CellWidth.visible(tok);
    const isSpace = tok.trim() === '';
    if (tw > this.width && !isSpace) { this._placeLong(tok); return; }
    if (this.w + tw > this.width && this.w > 0) { this._breakBefore(tok, tw, isSpace); return; }
    this.cur += tok;
    this.w += tw;
    this.state.consume(tok);
  }

  _placeLong(tok) {
    if (this.w > 0) this._endRow();
    const broken = LineFiller.breakLong(tok, this.width, this.state);
    for (let i = 0; i < broken.length - 1; i++) this.lines.push(broken[i]);
    this.cur = broken[broken.length - 1];
    this.w = CellWidth.visible(this.cur);
  }

  _breakBefore(tok, tw, isSpace) {
    this._endRow();
    this.state.consume(tok);
    if (isSpace) {
      this.cur = this.state.open();
      this.w = 0;
    } else {
      this.cur = this.state.open() + tok;
      this.w = tw;
    }
  }

  _endRow() {
    this.lines.push(this.cur.replace(/ +$/, '') + this.state.close());
  }
}

module.exports = LineFiller;
