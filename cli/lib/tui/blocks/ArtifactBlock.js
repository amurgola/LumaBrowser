const Block = require('./Block');
const AnsiFit = require('../ansi/AnsiFit');

class ArtifactBlock extends Block {
  constructor({ title, type }) {
    super();
    this.title = title || 'artifact';
    this.type = type || '';
    this.done = true;
  }

  render(width, t) {
    const type = this.type ? ` ${t.fg('muted', `(${this.type})`)}` : '';
    return [AnsiFit.truncate(`${Block.INDENT}${t.fg('accent', t.glyph.artifact)} ${t.fg('dim', this.title)}${type}`, width)];
  }
}

module.exports = ArtifactBlock;
