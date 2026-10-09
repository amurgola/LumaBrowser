const Block = require('./Block');
const AnsiFit = require('../ansi/AnsiFit');
const AnsiWrap = require('../ansi/AnsiWrap');
const CellWidth = require('../ansi/CellWidth');

class HeaderBlock extends Block {
  constructor({ title, sub, hint }) {
    super();
    Object.assign(this, { title, sub, hint });
    this.done = true;
  }

  render(width) {
    const out = [AnsiFit.truncate(this.title, width)];
    for (const sub of [].concat(this.sub || [])) {
      if (CellWidth.visible(sub)) out.push(...HeaderBlock._indented(sub, width));
    }
    if (this.hint) out.push(...HeaderBlock._indented(this.hint, width));
    return out;
  }

  static _indented(text, width) {
    return AnsiWrap.wrap(text, Math.max(8, width - 2)).map((l) => `  ${l}`);
  }
}

module.exports = HeaderBlock;
