const Block = require('./Block');
const MarkdownRenderer = require('../markdown/MarkdownRenderer');

class AssistantBlock extends Block {
  constructor() {
    super();
    this.text = '';
  }

  render(width, t) {
    if (!this.text.trim()) return [];
    const lines = MarkdownRenderer.render(this.text, Math.max(8, width - Block.INDENT.length), t);
    return ['', ...lines.map((l) => (l ? Block.INDENT + l : ''))];
  }
}

module.exports = AssistantBlock;
