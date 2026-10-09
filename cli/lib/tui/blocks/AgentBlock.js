const Block = require('./Block');
const AnsiFit = require('../ansi/AnsiFit');
const ToolGrammar = require('../ToolGrammar');

class AgentBlock extends Block {
  constructor({ name }) {
    super();
    this.name = name || 'agent';
    this.chars = 0;
    this.tools = 0;
    this.error = null;
    this.startedAt = Date.now();
  }

  render(width, t, { spinner = '' } = {}) {
    const g = t.glyph;
    const bits = this._bits();
    const title = t.fg(this.done ? 'dim' : 'text', `${g.agent} Agent ${this.name}`);
    const tail = bits.length ? ` ${t.fg('muted', `${g.dot} ${bits.join(` ${g.dot} `)}`)}` : '';
    return [AnsiFit.truncate(`${Block.INDENT}${this._glyph(t, spinner)} ${title}${tail}`, width)];
  }

  _glyph(t, spinner) {
    const g = t.glyph;
    if (!this.done) return t.fg('accent', spinner || g.agent);
    return this.error ? t.fg('bad', g.fail) : t.fg('good', g.ok);
  }

  _bits() {
    const bits = [];
    if (this.tools) bits.push(`${this.tools} tool${this.tools === 1 ? '' : 's'}`);
    if (this.chars) bits.push(`${this.chars} chars`);
    if (this.done) bits.push(`${((Date.now() - this.startedAt) / 1000).toFixed(1)}s`);
    if (this.error) bits.push(ToolGrammar.short(this.error, 80));
    return bits;
  }
}

module.exports = AgentBlock;
