class OutlineNode {
  static INDENT = '  ';

  constructor({ label, path, depth, text, detail = '' }) {
    this.label = label;
    this.path = path;
    this.depth = depth;
    this.text = text;
    this.detail = detail;
    this.children = [];
    this.unlisted = 0;
  }

  get childTotal() {
    return this.children.length + this.unlisted;
  }

  line(withDetail = false) {
    return OutlineNode._indent(this.depth) + this.label + this.text + (withDetail ? this.detail : '');
  }

  moreLine(hidden) {
    return `${OutlineNode._indent(this.depth + 1)}(+${hidden} more under ${this.path})`;
  }

  static _indent(depth) {
    return OutlineNode.INDENT.repeat(depth);
  }
}

module.exports = OutlineNode;
