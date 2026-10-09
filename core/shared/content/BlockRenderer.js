class BlockRenderer {
  constructor(renderer) {
    this.renderer = renderer;
  }

  get elementNames() {
    return [];
  }

  matches(node) {
    return this.elementNames.includes(node.name);
  }

  render(_node, _writer) {
    throw new Error(`${this.constructor.name} must implement render(node, writer)`);
  }
}

module.exports = BlockRenderer;
