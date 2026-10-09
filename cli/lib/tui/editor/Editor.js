const EditorKeymap = require('./EditorKeymap');
const EditorPalette = require('./EditorPalette');
const EditorView = require('./EditorView');

class Editor {
  static WORD = /[\p{L}\p{N}_]/u;

  constructor({ theme, placeholder = '', complete = null, maxHistory = 200 } = {}) {
    this.theme = theme;
    this.placeholder = placeholder;
    this.complete = complete;
    this.text = '';
    this.cursor = 0;
    this.history = [];
    this.historyIdx = -1;
    this.draft = '';
    this.maxHistory = maxHistory;
    this.label = '';
    this.busy = false;
    this.suggestion = '';
    this.completions = null;
  }

  setText(t, cursorAtEnd = true) {
    this.text = String(t || '');
    this.cursor = cursorAtEnd ? this.text.length : Math.min(this.cursor, this.text.length);
    this.completions = null;
  }

  clear() {
    this.setText('');
    this.historyIdx = -1;
    this.draft = '';
  }

  setSuggestion(t) {
    this.suggestion = String(t || '').trim();
  }

  pushHistory(t) {
    if (!t || !t.trim()) return;
    if (this.history[this.history.length - 1] !== t) this.history.push(t);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIdx = -1;
    this.draft = '';
  }

  handleKey(k) {
    const r = EditorKeymap.handle(this, k);
    if (r.changed && r.submit === undefined && !r.nav) this.refreshPalette();
    return r;
  }

  refreshPalette() {
    EditorPalette.refresh(this);
  }

  cycleCompletion(dir, step = true) {
    EditorPalette.cycle(this, dir, step);
  }

  acceptCompletion() {
    return EditorPalette.accept(this);
  }

  render(width) {
    return EditorView.render(this, width);
  }

  lineStart(pos) {
    const i = this.text.lastIndexOf('\n', pos - 1);
    return i === -1 ? 0 : i + 1;
  }

  lineEnd(pos) {
    const i = this.text.indexOf('\n', pos);
    return i === -1 ? this.text.length : i;
  }

  insert(s) {
    this.text = this.text.slice(0, this.cursor) + s + this.text.slice(this.cursor);
    this.cursor += s.length;
    this.completions = null;
  }

  deleteRange(a, b) {
    if (a >= b) return;
    this.text = this.text.slice(0, a) + this.text.slice(b);
    this.cursor = a;
    this.completions = null;
  }

  wordLeft() {
    let i = this.cursor;
    while (i > 0 && !Editor.WORD.test(this.text[i - 1])) i--;
    while (i > 0 && Editor.WORD.test(this.text[i - 1])) i--;
    return i;
  }

  wordRight() {
    let i = this.cursor;
    while (i < this.text.length && !Editor.WORD.test(this.text[i])) i++;
    while (i < this.text.length && Editor.WORD.test(this.text[i])) i++;
    return i;
  }

  moveVertical(dir) {
    const col = this.cursor - this.lineStart(this.cursor);
    if (dir < 0) {
      const ls = this.lineStart(this.cursor);
      if (ls === 0) return false;
      this.cursor = Math.min(this.lineStart(ls - 1) + col, ls - 1);
      return true;
    }
    const le = this.lineEnd(this.cursor);
    if (le === this.text.length) return false;
    this.cursor = Math.min(le + 1 + col, this.lineEnd(le + 1));
    return true;
  }

  historyMove(dir) {
    if (!this.history.length) return false;
    if (this.historyIdx === -1) {
      if (dir > 0) return false;
      this.draft = this.text;
      this.historyIdx = this.history.length - 1;
    } else {
      const next = this.historyIdx + dir;
      if (next < 0) return true;
      if (next >= this.history.length) { this.historyIdx = -1; this.setText(this.draft); return true; }
      this.historyIdx = next;
    }
    this.setText(this.history[this.historyIdx]);
    return true;
  }
}

module.exports = Editor;
