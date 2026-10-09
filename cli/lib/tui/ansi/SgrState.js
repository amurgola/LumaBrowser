const AnsiEscape = require('./AnsiEscape');

const ESC = AnsiEscape.ESC;

class SgrState {
  static FLAG_ON = { 1: 'bold', 2: 'dim', 3: 'italic', 4: 'underline', 7: 'inverse', 9: 'strike' };
  static FLAG_OFF = { 22: ['bold', 'dim'], 23: ['italic'], 24: ['underline'], 27: ['inverse'], 29: ['strike'] };
  static OPEN_ORDER = [['bold', '1'], ['dim', '2'], ['italic', '3'], ['underline', '4'], ['inverse', '7'], ['strike', '9']];

  constructor() {
    this.reset();
  }

  reset() {
    this.bold = false; this.dim = false; this.italic = false; this.underline = false;
    this.inverse = false; this.strike = false; this.fg = null; this.bg = null; this.link = null;
  }

  process(code) {
    if (code.startsWith(`${ESC}]8;`)) { this._processLink(code); return; }
    const m = /^\x1b\[([\d;]*)m$/.exec(code);
    if (m) this._processSgr(m[1] === '' ? ['0'] : m[1].split(';'));
  }

  consume(text) {
    let i = 0;
    while (i < text.length) {
      const e = AnsiEscape.at(text, i);
      if (e) { this.process(e.code); i += e.length; continue; }
      i++;
    }
  }

  open() {
    const sgr = SgrState.OPEN_ORDER.filter(([flag]) => this[flag]).map(([, n]) => n);
    if (this.fg) sgr.push(this.fg);
    if (this.bg) sgr.push(this.bg);
    let s = sgr.length ? `${ESC}[${sgr.join(';')}m` : '';
    if (this.link) s += `${ESC}]8;;${this.link}${ESC}\\`;
    return s;
  }

  close() {
    const any = this.bold || this.dim || this.italic || this.underline || this.inverse || this.strike || this.fg || this.bg;
    let s = any ? `${ESC}[0m` : '';
    if (this.link) s += `${ESC}]8;;${ESC}\\`;
    return s;
  }

  isEmpty() {
    return !this.open();
  }

  _processLink(code) {
    const m = /^\x1b\]8;[^;]*;([^\x07\x1b]*)(?:\x07|\x1b\\)$/.exec(code);
    this.link = m && m[1] ? m[1] : null;
  }

  _processSgr(parts) {
    for (let i = 0; i < parts.length; i++) i += this._applyParam(parts, i);
  }

  _applyParam(parts, i) {
    const n = Number(parts[i]);
    if (n === 0) { const link = this.link; this.reset(); this.link = link; return 0; }
    if (SgrState.FLAG_ON[n]) { this[SgrState.FLAG_ON[n]] = true; return 0; }
    if (SgrState.FLAG_OFF[n]) { for (const flag of SgrState.FLAG_OFF[n]) this[flag] = false; return 0; }
    if (n === 39) { this.fg = null; return 0; }
    if (n === 49) { this.bg = null; return 0; }
    if (n === 38 || n === 48) return this._applyExtendedColor(parts, i, n === 38 ? 'fg' : 'bg');
    if ((n >= 30 && n <= 37) || (n >= 90 && n <= 97)) this.fg = String(n);
    else if ((n >= 40 && n <= 47) || (n >= 100 && n <= 107)) this.bg = String(n);
    return 0;
  }

  _applyExtendedColor(parts, i, slot) {
    let color = null;
    let used = 0;
    if (parts[i + 1] === '5' && parts[i + 2] !== undefined) { color = parts.slice(i, i + 3).join(';'); used = 2; }
    else if (parts[i + 1] === '2' && parts[i + 4] !== undefined) { color = parts.slice(i, i + 5).join(';'); used = 4; }
    this[slot] = color;
    return used;
  }
}

module.exports = SgrState;
