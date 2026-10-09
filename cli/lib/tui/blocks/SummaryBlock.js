const Block = require('./Block');
const AnsiFit = require('../ansi/AnsiFit');
const ToolGrammar = require('../ToolGrammar');

class SummaryBlock extends Block {
  constructor({ aborted, iterations, tokens, secs, tps }) {
    super();
    Object.assign(this, { aborted, iterations, tokens, secs, tps });
    this.done = true;
  }

  render(width, t) {
    const g = t.glyph;
    const line = `${Block.INDENT}${t.fg(this.aborted ? 'muted' : 'accent', g.done)} ${t.fg('muted', this._bits().join(` ${g.dot} `))}`;
    return ['', AnsiFit.truncate(line, width)];
  }

  _bits() {
    const bits = [this.aborted ? 'stopped' : 'done'];
    if (this.iterations) bits.push(`${this.iterations} step${this.iterations === 1 ? '' : 's'}`);
    if (this.tokens) bits.push(`${ToolGrammar.fmtTokens(this.tokens)} tokens`);
    if (this.tps) bits.push(`${this.tps.toFixed(0)} tok/s`);
    if (this.secs != null) bits.push(`${this.secs.toFixed(1)}s`);
    return bits;
  }
}

module.exports = SummaryBlock;
