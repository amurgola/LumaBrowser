class NodeTextStats {
  static EMPTY = Object.freeze({ chars: 0, linkChars: 0, links: 0 });

  static measure(root) {
    const stats = new NodeTextStats();
    stats._visit(root, false);
    return stats;
  }

  constructor() {
    this._byNode = new Map();
  }

  of(node) {
    return this._byNode.get(node) || NodeTextStats.EMPTY;
  }

  linkDensity(node) {
    const { chars, linkChars } = this.of(node);
    return chars ? linkChars / chars : 0;
  }

  _visit(node, insideLink) {
    if (node.isText) return NodeTextStats._textStats(node, insideLink);
    const isLink = node.name === 'a' && node.hasAttribute('href');
    const total = { chars: 0, linkChars: 0, links: isLink ? 1 : 0 };
    for (const child of node.children) NodeTextStats._add(total, this._visit(child, insideLink || isLink));
    this._byNode.set(node, total);
    return total;
  }

  static _textStats(node, insideLink) {
    const chars = node.text.replace(/\s+/g, ' ').trim().length;
    return { chars, linkChars: insideLink ? chars : 0, links: 0 };
  }

  static _add(total, part) {
    total.chars += part.chars;
    total.linkChars += part.linkChars;
    total.links += part.links;
  }
}

module.exports = NodeTextStats;
