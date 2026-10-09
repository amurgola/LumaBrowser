const Block = require('./Block');
const AnsiWrap = require('../ansi/AnsiWrap');

class NoteBlock extends Block {
  constructor(text, level = 'muted') {
    super();
    this.text = String(text || '');
    this.level = level;
    this.done = true;
  }

  render(width, t) {
    const color = this.level === 'warn' ? 'warn' : this.level === 'bad' ? 'bad' : 'muted';
    const lines = AnsiWrap.wrap(t.fg(color, `${t.glyph.dot} ${this.text}`), Math.max(8, width - Block.INDENT.length));
    return lines.map((l) => Block.INDENT + l);
  }
}

module.exports = NoteBlock;
