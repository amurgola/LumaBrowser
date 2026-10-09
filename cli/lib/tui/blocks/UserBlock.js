const Block = require('./Block');
const AnsiWrap = require('../ansi/AnsiWrap');

class UserBlock extends Block {
  constructor(text) {
    super();
    this.text = String(text || '');
    this.done = true;
  }

  render(width, t) {
    const bar = t.fg('accent', t.glyph.bar);
    const body = AnsiWrap.wrap(t.fg('text', this.text), Math.max(4, width - 2));
    return ['', ...body.map((l) => `${bar} ${l}`)];
  }
}

module.exports = UserBlock;
