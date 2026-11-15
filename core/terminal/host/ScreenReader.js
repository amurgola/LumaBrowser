class ScreenReader {
  static OMITTED = (chars) => `\n[... ${chars} characters omitted ...]\n`;
  static HEAD_SHARE = 0.25;

  constructor(term) {
    this._term = term;
  }

  mark() {
    return this._term.registerMarker(0);
  }

  cursor() {
    const buffer = this._term.buffer.active;
    return { x: buffer.cursorX, y: buffer.cursorY };
  }

  screen() {
    const buffer = this._term.buffer.active;
    return this._text(buffer.baseY, buffer.baseY + this._term.rows);
  }

  tail(lines) {
    const all = ScreenReader._withoutBlankEnd(this._lines(0, this._term.buffer.active.length));
    return ScreenReader._join(all.slice(-Math.max(1, lines)));
  }

  from(mark) {
    const start = mark && mark.line >= 0 ? mark.line : 0;
    return this._text(start, this._term.buffer.active.length);
  }

  static clip(text, maxChars) {
    const value = String(text || '');
    if (!(maxChars > 0) || value.length <= maxChars) return value;
    const head = Math.floor(maxChars * ScreenReader.HEAD_SHARE);
    const tail = maxChars - head;
    return value.slice(0, head) + ScreenReader.OMITTED(value.length - maxChars) + value.slice(value.length - tail);
  }

  _text(start, end) {
    return ScreenReader._join(this._lines(start, end));
  }

  _lines(start, end) {
    const buffer = this._term.buffer.active;
    const lines = [];
    for (let row = Math.max(0, start); row < end; row++) {
      const line = buffer.getLine(row);
      if (!line) continue;
      const text = line.translateToString(true);
      if (line.isWrapped && lines.length) lines[lines.length - 1] += text;
      else lines.push(text);
    }
    return lines;
  }

  static _join(lines) {
    return ScreenReader._withoutBlankEnd(lines.map((line) => line.replace(/\s+$/, ''))).join('\n');
  }

  static _withoutBlankEnd(lines) {
    const kept = lines.slice();
    while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
    return kept;
  }
}

module.exports = ScreenReader;
