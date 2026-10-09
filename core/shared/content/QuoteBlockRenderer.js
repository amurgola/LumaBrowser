const BlockRenderer = require('./BlockRenderer');

class QuoteBlockRenderer extends BlockRenderer {
  get elementNames() {
    return ['blockquote'];
  }

  render(node, writer) {
    const content = this.renderer.renderBlocks(node);
    if (!content) return;
    writer.block(content.split('\n').map((line) => (line ? `> ${line}` : '>')).join('\n'));
  }
}

module.exports = QuoteBlockRenderer;
