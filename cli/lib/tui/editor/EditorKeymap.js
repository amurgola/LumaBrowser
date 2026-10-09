class EditorKeymap {
  static CHANGED = { consumed: true, changed: true };
  static IGNORED = { consumed: false };

  static handle(e, k) {
    switch (k.name) {
      case 'paste': e.insert(k.ch); return EditorKeymap._changed();
      case 'char': return EditorKeymap._char(e, k);
      case 'enter': return EditorKeymap._enter(e, k);
      case 'tab': return EditorKeymap._tab(e, k);
      case 'backspace': return EditorKeymap._backspace(e, k);
      case 'delete':
        if (e.cursor < e.text.length) e.deleteRange(e.cursor, e.cursor + 1);
        return EditorKeymap._changed();
      case 'left':
        e.cursor = k.ctrl || k.alt ? e.wordLeft() : Math.max(0, e.cursor - 1);
        return EditorKeymap._changed();
      case 'right': return EditorKeymap._right(e, k);
      case 'up': return EditorKeymap._vertical(e, -1);
      case 'down': return EditorKeymap._vertical(e, 1);
      case 'home': e.cursor = e.lineStart(e.cursor); return EditorKeymap._changed();
      case 'end': e.cursor = e.lineEnd(e.cursor); return EditorKeymap._changed();
      case 'ctrl': return EditorKeymap._ctrl(e, k);
      case 'escape':
        if (!e.completions) return EditorKeymap._ignored();
        e.completions = null;
        return EditorKeymap._changed();
      default: return EditorKeymap._ignored();
    }
  }

  static _changed() { return { ...EditorKeymap.CHANGED }; }

  static _ignored() { return { ...EditorKeymap.IGNORED }; }

  static _char(e, k) {
    if (k.alt && (k.ch === 'b' || k.ch === 'f')) { e.cursor = k.ch === 'b' ? e.wordLeft() : e.wordRight(); return EditorKeymap._changed(); }
    if (k.alt && k.ch === 'd') { e.deleteRange(e.cursor, e.wordRight()); return EditorKeymap._changed(); }
    if (k.alt) return EditorKeymap._ignored();
    e.insert(k.ch);
    return EditorKeymap._changed();
  }

  static _enter(e, k) {
    if (k.alt || k.shift || k.ctrl) { e.insert('\n'); return EditorKeymap._changed(); }
    if (e.completions) return e.acceptCompletion();
    return { consumed: true, submit: e.text };
  }

  static _tab(e, k) {
    if (!e.text && e.suggestion && !k.shift) { e.setText(e.suggestion); return EditorKeymap._changed(); }
    e.cycleCompletion(k.shift ? -1 : 1, false);
    return EditorKeymap._changed();
  }

  static _backspace(e, k) {
    if (k.alt || k.ctrl) { e.deleteRange(e.wordLeft(), e.cursor); return EditorKeymap._changed(); }
    if (e.cursor > 0) {
      const lowSurrogate = e.text.charCodeAt(e.cursor - 1) >= 0xdc00 && e.text.charCodeAt(e.cursor - 1) <= 0xdfff;
      e.deleteRange(e.cursor - (lowSurrogate ? 2 : 1), e.cursor);
    }
    return EditorKeymap._changed();
  }

  static _right(e, k) {
    if (!e.text && e.suggestion) { e.setText(e.suggestion); return EditorKeymap._changed(); }
    e.cursor = k.ctrl || k.alt ? e.wordRight() : Math.min(e.text.length, e.cursor + 1);
    return EditorKeymap._changed();
  }

  static _vertical(e, dir) {
    if (e.completions) { e.cycleCompletion(dir); return EditorKeymap._changed(); }
    if (e.moveVertical(dir)) return EditorKeymap._changed();
    return { consumed: e.historyMove(dir), changed: true, nav: true };
  }

  static _ctrl(e, k) {
    switch (k.ch) {
      case 'a': e.cursor = e.lineStart(e.cursor); break;
      case 'e': e.cursor = e.lineEnd(e.cursor); break;
      case 'b': e.cursor = Math.max(0, e.cursor - 1); break;
      case 'f': e.cursor = Math.min(e.text.length, e.cursor + 1); break;
      case 'u': e.deleteRange(e.lineStart(e.cursor), e.cursor); break;
      case 'k': e.deleteRange(e.cursor, e.lineEnd(e.cursor)); break;
      case 'w': e.deleteRange(e.wordLeft(), e.cursor); break;
      case 'j': e.insert('\n'); break;
      case 'p': return e.handleKey({ name: 'up', ch: '', ctrl: false, alt: false, shift: false });
      case 'n': return e.handleKey({ name: 'down', ch: '', ctrl: false, alt: false, shift: false });
      default: return EditorKeymap._ignored();
    }
    return EditorKeymap._changed();
  }
}

module.exports = EditorKeymap;
