const Block = require('./Block');
const AnsiWrap = require('../ansi/AnsiWrap');

class ErrorBlock extends Block {
  constructor(message) {
    super();
    this.message = String(message || 'unknown error');
    this.done = true;
  }

  render(width, t) {
    const bar = t.fg('bad', t.glyph.bar);
    const body = AnsiWrap.wrap(t.fg('bad', this.message), Math.max(4, width - 2));
    return ['', ...body.map((l) => `${bar} ${l}`)];
  }
}

module.exports = ErrorBlock;
