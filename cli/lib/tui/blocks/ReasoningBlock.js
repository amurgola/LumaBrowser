const Block = require('./Block');
const AnsiWrap = require('../ansi/AnsiWrap');

class ReasoningBlock extends Block {
  constructor({ shown }) {
    super();
    this.text = '';
    this.shown = !!shown;
    this.startedAt = Date.now();
    this.endedAt = 0;
  }

  get chars() { return this.text.length; }

  render(width, t) {
    if (!this.text) return [];
    if (!this.shown) return this._folded(t);
    const lines = AnsiWrap.wrap(t.italic(t.fg('muted', this.text.trim())), Math.max(8, width - Block.INDENT.length));
    return ['', ...lines.map((l) => Block.INDENT + l)];
  }

  _folded(t) {
    if (!this.done) return [];
    const secs = Math.max(0.1, ((this.endedAt || Date.now()) - this.startedAt) / 1000);
    return ['', `${Block.INDENT}${t.fg('muted', `${t.glyph.dot} thought for ${secs.toFixed(secs < 10 ? 1 : 0)}s`)}`];
  }
}

module.exports = ReasoningBlock;
