const CellWidth = require('./ansi/CellWidth');
const AnsiFit = require('./ansi/AnsiFit');

class Screen {
  static SYNC_START = '\x1b[?2026h';
  static SYNC_END = '\x1b[?2026l';
  static HIDE_CURSOR = '\x1b[?25l';
  static SHOW_CURSOR = '\x1b[?25h';

  constructor(term) {
    this.term = term;
    this.prevLive = [];
    this.cursorRow = 0;
    this.cursorShown = false;
    this.lastWidth = 0;
    this.needsFullRedraw = false;
    this.paints = 0;
  }

  get width() { return Math.max(20, (this.term.columns() || 80) - 1); }

  get height() { return Math.max(4, this.term.rows() || 24); }

  invalidate() {
    this.needsFullRedraw = true;
  }

  paint({ commit = [], live = [], cursor = null }) {
    this.paints += 1;
    let out = Screen.SYNC_START + Screen.HIDE_CURSOR;
    out += this._resetIfWidthChanged();
    out += this._moveToLiveTop();
    const prev = commit.length ? [] : this.prevLive;
    out += Screen._commitLines(commit);
    const diff = Screen._diffRows(prev, live);
    out += diff.out;
    const park = Screen._park(live, cursor, diff.row);
    out += park.out + Screen.SYNC_END;
    this._finishFrame(out, live, park);
  }

  repaintAll({ transcript = [], live = [], cursor = null }) {
    this.needsFullRedraw = false;
    this.lastWidth = this.width;
    let out = `${Screen.SYNC_START}${Screen.HIDE_CURSOR}\x1b[2J\x1b[3J\x1b[H`;
    for (const line of transcript) out += Screen._committedLine(line);
    for (let i = 0; i < live.length; i++) out += `${i > 0 ? '\r\n' : ''}${Screen.emitLine(live[i])}\x1b[0m`;
    const last = Math.max(0, live.length - 1);
    const target = Screen._cursorTarget(live, cursor);
    if (target.row < last) out += `\x1b[${last - target.row}A`;
    out += `\x1b[${target.col + 1}G`;
    if (target.show) out += Screen.SHOW_CURSOR;
    out += Screen.SYNC_END;
    this._finishFrame(out, live, target);
    this.paints += 1;
  }

  finish() {
    const down = Math.max(0, this.prevLive.length - 1 - this.cursorRow);
    let out = '';
    if (down > 0) out += `\x1b[${down}B`;
    out += `\r\n${Screen.SHOW_CURSOR}`;
    this.term.write(out);
    this.prevLive = [];
    this.cursorRow = 0;
  }

  clearLive() {
    let out = '';
    if (this.cursorRow > 0) out += `\x1b[${this.cursorRow}A`;
    out += '\r\x1b[J';
    this.term.write(out);
    this.prevLive = [];
    this.cursorRow = 0;
  }

  static emitLine(line) {
    return AnsiFit.seal(CellWidth.expandTabs(line));
  }

  _resetIfWidthChanged() {
    const width = this.width;
    const widthChanged = this.lastWidth !== 0 && this.lastWidth !== width;
    this.lastWidth = width;
    if (!widthChanged && !this.needsFullRedraw) return '';
    this.needsFullRedraw = false;
    this.prevLive = [];
    this.cursorRow = 0;
    return '\x1b[2J\x1b[H';
  }

  _moveToLiveTop() {
    return `${this.cursorRow > 0 ? `\x1b[${this.cursorRow}A` : ''}\r`;
  }

  _finishFrame(out, live, target) {
    this.term.write(out);
    this.prevLive = live.slice();
    this.cursorRow = target.row;
    this.cursorShown = target.show;
  }

  static _commitLines(lines) {
    if (!lines.length) return '';
    let out = '\x1b[J';
    for (const line of lines) out += Screen._committedLine(line);
    return out;
  }

  static _committedLine(line) {
    return `${Screen.emitLine(line)}\x1b[0m\r\n`;
  }

  static _diffRows(prev, live) {
    const first = Screen._firstDifference(prev, live);
    if (first === -1) return { out: '', row: 0 };
    let out = first > 0 ? `\x1b[${first}B` : '';
    let row = first;
    for (let i = first; i < live.length; i++) {
      if (i > first) { out += '\r\n'; row = i; }
      out += `\r\x1b[2K${Screen.emitLine(live[i])}\x1b[0m`;
    }
    const extra = prev.length - live.length;
    if (extra > 0) {
      for (let i = 0; i < extra; i++) out += '\r\n\x1b[2K';
      out += live.length === 0 ? `\x1b[${extra - 1}A` : `\x1b[${extra}A`;
      row = live.length === 0 ? 0 : live.length - 1;
    }
    return { out, row };
  }

  static _firstDifference(prev, live) {
    const max = Math.max(prev.length, live.length);
    for (let i = 0; i < max; i++) if (prev[i] !== live[i]) return i;
    return -1;
  }

  static _park(live, cursor, row) {
    const target = Screen._cursorTarget(live, cursor);
    let out = '';
    if (target.row > row) out += `\x1b[${target.row - row}B`;
    else if (target.row < row) out += `\x1b[${row - target.row}A`;
    out += `\x1b[${target.col + 1}G`;
    if (target.show) out += Screen.SHOW_CURSOR;
    return { ...target, out };
  }

  static _cursorTarget(live, cursor) {
    const last = Math.max(0, live.length - 1);
    if (!cursor || !live.length) return { row: last, col: 0, show: false };
    return { row: Math.max(0, Math.min(cursor.row, last)), col: Math.max(0, cursor.col), show: true };
  }
}

module.exports = Screen;
