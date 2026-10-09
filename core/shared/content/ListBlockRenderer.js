const BlockRenderer = require('./BlockRenderer');

class ListBlockRenderer extends BlockRenderer {
  static BULLET = '- ';

  get elementNames() {
    return ['menu', 'ol', 'ul'];
  }

  render(node, writer) {
    const items = this._itemContents(node);
    if (!items.length) return;
    const start = ListBlockRenderer._startNumber(node);
    const ordered = node.name === 'ol';
    writer.block(items.map((content, index) => ListBlockRenderer._formatItem(
      content, ordered ? `${start + index}. ` : ListBlockRenderer.BULLET,
    )).join('\n'));
  }

  _itemContents(list) {
    return list.children
      .map((child) => (child.isText ? child.text.trim() : this.renderer.renderBlocks(child)))
      .filter(Boolean);
  }

  static _startNumber(list) {
    const start = parseInt(list.attribute('start'), 10);
    return Number.isFinite(start) ? start : 1;
  }

  static _formatItem(content, marker) {
    const indent = ' '.repeat(marker.length);
    const lines = ListBlockRenderer._tighten(content).split('\n');
    return lines.map((line, index) => {
      if (index === 0) return marker + line;
      return line ? indent + line : '';
    }).join('\n');
  }

  static _tighten(content) {
    return content.includes('```') ? content : content.replace(/\n{2,}/g, '\n');
  }
}

module.exports = ListBlockRenderer;
