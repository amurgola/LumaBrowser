class Block {
  static INDENT = '  ';

  constructor() {
    this.done = false;
    this.frozen = 0;
  }

  render(width, theme, opts) {
    throw new Error(`${this.constructor.name} must implement render()`);
  }
}

module.exports = Block;
