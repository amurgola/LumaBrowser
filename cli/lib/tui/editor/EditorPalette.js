class EditorPalette {
  static lookup(editor, prefix) {
    if (typeof editor.complete !== 'function') return [];
    const raw = editor.complete(prefix) || [];
    return raw.map(EditorPalette._entry).filter((it) => it.text);
  }

  static refresh(editor) {
    if (editor.completions && !editor.completions.live) return;
    const single = editor.cursor === editor.text.length && !editor.text.includes('\n');
    const items = single && editor.text.startsWith('/') ? EditorPalette.lookup(editor, editor.text) : [];
    if (!items.length) { editor.completions = null; return; }
    const idx = EditorPalette._highlight(items, editor.text, editor.completions);
    editor.completions = { items, idx, base: editor.text, rest: '', live: true };
  }

  static cycle(editor, dir, step = true) {
    if (editor.completions) EditorPalette._step(editor.completions, dir, step);
    else if (!EditorPalette._open(editor, dir)) return;
    const c = editor.completions;
    const chosen = c.items[c.idx].text;
    editor.text = chosen + c.rest;
    editor.cursor = chosen.length;
  }

  static accept(editor) {
    const c = editor.completions;
    editor.completions = null;
    if (!c) return { consumed: true, submit: editor.text };
    const chosen = c.live ? c.items[c.idx] : c.items.find((it) => it.text === editor.text.trim()) || null;
    if (chosen && chosen.arg) { editor.setText(`${chosen.text} `); return { consumed: true, changed: true }; }
    if (c.live && chosen) editor.setText(chosen.text);
    return { consumed: true, submit: editor.text };
  }

  static _open(editor, dir) {
    const items = EditorPalette.lookup(editor, editor.text.slice(0, editor.cursor));
    if (!items.length) return false;
    editor.completions = {
      items,
      idx: dir > 0 ? 0 : items.length - 1,
      base: editor.text.slice(0, editor.cursor),
      rest: editor.text.slice(editor.cursor),
      live: false,
    };
    return true;
  }

  static _step(c, dir, step) {
    const n = c.items.length;
    if (!c.live || step) c.idx = (c.idx + dir + n) % n;
    c.live = false;
  }

  static _highlight(items, text, prev) {
    const exact = items.findIndex((it) => it.text === text);
    if (exact >= 0) return exact;
    const cur = prev && prev.items[prev.idx] ? prev.items[prev.idx].text : null;
    return Math.max(0, cur ? items.findIndex((it) => it.text === cur) : 0);
  }

  static _entry(it) {
    if (typeof it === 'string') return { text: it, help: '', arg: false };
    return { text: String((it && it.text) || ''), help: (it && it.help) || '', arg: !!(it && it.arg) };
  }
}

module.exports = EditorPalette;
