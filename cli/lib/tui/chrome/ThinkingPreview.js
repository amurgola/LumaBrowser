const AnsiWrap = require('../ansi/AnsiWrap');
const CellWidth = require('../ansi/CellWidth');

class ThinkingPreview {
  static LABEL = ' thinking ';

  static render({ text, rows = 3, hint = '' }, width, t) {
    const box = ThinkingPreview._box(t);
    const inner = Math.max(8, width - 4);
    const out = [ThinkingPreview._top(box, width, t)];
    for (const l of ThinkingPreview._lastLines(text, rows, inner, t)) {
      out.push(`${box.V} ${l}${' '.repeat(Math.max(0, inner - CellWidth.visible(l)))} ${box.V}`);
    }
    out.push(ThinkingPreview._bottom(box, width, hint, t));
    return out;
  }

  static _box(t) {
    const ascii = t.ascii;
    return {
      H: ascii ? '-' : '─',
      V: t.fg('border', ascii ? '|' : '│'),
      TL: ascii ? '+' : '╭',
      TR: ascii ? '+' : '╮',
      BL: ascii ? '+' : '╰',
      BR: ascii ? '+' : '╯',
    };
  }

  static _top(box, width, t) {
    const label = ThinkingPreview.LABEL;
    return t.fg('border', `${box.TL}${box.H}`) + t.fg('muted', label)
      + t.fg('border', `${box.H.repeat(Math.max(0, width - 3 - CellWidth.visible(label)))}${box.TR}`);
  }

  static _bottom(box, width, hint, t) {
    const tail = hint ? ` ${hint} ` : '';
    return t.fg('border', `${box.BL}${box.H.repeat(Math.max(0, width - 3 - CellWidth.visible(tail)))}`)
      + (tail ? t.fg('muted', tail) : '') + t.fg('border', `${box.H}${box.BR}`);
  }

  static _lastLines(text, rows, inner, t) {
    const wrapped = AnsiWrap.wrap(t.italic(t.fg('muted', String(text || '').trim())), inner);
    const shown = wrapped.slice(-rows);
    while (shown.length < rows) shown.unshift('');
    return shown;
  }
}

module.exports = ThinkingPreview;
