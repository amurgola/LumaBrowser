const CellWidth = require('../ansi/CellWidth');
const AnsiFit = require('../ansi/AnsiFit');
const PlainWrap = require('./PlainWrap');

class EditorView {
  static PALETTE_ROWS = 12;

  static render(editor, width) {
    const view = EditorView._frame(editor, width);
    const lines = [view.top];
    let cursor = { row: 1, col: 2 + view.headW };
    if (!editor.text) {
      lines.push(EditorView._emptyRow(editor, view));
    } else {
      cursor = EditorView._textRows(editor, view, lines) || cursor;
      EditorView._paletteRows(editor, view, lines);
    }
    lines.push(view.bottom);
    return { lines, cursor };
  }

  static _frame(editor, width) {
    const t = editor.theme;
    const border = editor.busy ? 'border' : 'accent';
    const ascii = t.ascii;
    const H = ascii ? '-' : '─';
    const V = t.fg(border, ascii ? '|' : '│');
    const inner = Math.max(8, width - 4);
    const headW = CellWidth.visible(t.glyph.prompt) + 1;
    const label = editor.label ? ` ${editor.label} ` : '';
    const top = t.fg(border, `${ascii ? '+' : '╭'}${H}`) + (label ? t.fg(editor.busy ? 'muted' : 'accent', label) : '')
      + t.fg(border, `${H.repeat(Math.max(0, width - 3 - CellWidth.visible(label)))}${ascii ? '+' : '╮'}`);
    const bottom = t.fg(border, `${ascii ? '+' : '╰'}${H.repeat(Math.max(0, width - 2))}${ascii ? '+' : '╯'}`);
    return {
      t, V, inner, headW, top, bottom,
      textW: Math.max(6, inner - headW),
      prompt: t.fg(editor.busy ? 'muted' : 'accent', t.glyph.prompt),
    };
  }

  static _row(view, body, extraRight = '') {
    const pad = Math.max(0, view.inner - CellWidth.visible(body) - CellWidth.visible(extraRight));
    return `${view.V} ${body}${' '.repeat(pad)}${extraRight} ${view.V}`;
  }

  static _emptyRow(editor, view) {
    const t = view.t;
    if (!editor.suggestion) return EditorView._row(view, `${view.prompt} ${t.fg('muted', PlainWrap.truncate(editor.placeholder, view.textW))}`);
    const hint = t.fg('muted', 'tab to use');
    const room = Math.max(4, view.textW - CellWidth.visible(hint) - 2);
    return EditorView._row(view, `${view.prompt} ${t.fg('dim', AnsiFit.truncate(editor.suggestion, room))}`, hint);
  }

  static _textRows(editor, view, lines) {
    const t = view.t;
    const indent = ' '.repeat(CellWidth.visible(t.glyph.prompt));
    let cursor = null;
    let offset = 0;
    for (const line of editor.text.split('\n')) {
      const rows = PlainWrap.wrap(line, view.textW);
      rows.forEach((r, ri) => {
        const first = lines.length === 1;
        lines.push(EditorView._row(view, `${first ? view.prompt : indent} ${t.fg('text', r.text)}`));
        if (EditorView._cursorOnRow(editor.cursor, offset + r.start, r.text.length, ri === rows.length - 1)) {
          cursor = { row: lines.length - 1, col: 2 + view.headW + CellWidth.visible(line.slice(r.start, editor.cursor - offset)) };
        }
      });
      offset += line.length + 1;
    }
    return cursor;
  }

  static _cursorOnRow(cursor, start, length, isLastRowOfLine) {
    const end = start + length;
    return cursor >= start && (cursor < end || (isLastRowOfLine && cursor === end));
  }

  static _paletteRows(editor, view, lines) {
    const c = editor.completions;
    if (!c || !c.items.length) return;
    const t = view.t;
    const shown = c.items.slice(0, EditorView.PALETTE_ROWS);
    const w = Math.max(...shown.map((it) => CellWidth.visible(it.text)));
    const mark = t.ascii ? '>' : '›';
    shown.forEach((it, i) => {
      const on = i === c.idx;
      const name = on ? t.fg('accent', it.text) : t.fg('text', it.text);
      const gap = ' '.repeat(Math.max(0, w - CellWidth.visible(it.text)));
      const help = it.help ? `  ${t.fg('muted', it.help)}` : '';
      lines.push(EditorView._row(view, AnsiFit.truncate(`${' '.repeat(view.headW)}${on ? t.fg('accent', mark) : ' '} ${name}${gap}${help}`, view.inner)));
    });
    const more = c.items.length - EditorView.PALETTE_ROWS;
    if (more > 0) lines.push(EditorView._row(view, t.fg('muted', `${' '.repeat(view.headW)}  +${more} more`)));
  }
}

module.exports = EditorView;
