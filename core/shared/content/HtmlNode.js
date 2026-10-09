class HtmlNode {
  static TEXT = '#text';

  static element(name, attributes = {}) {
    return new HtmlNode({ name, attributes });
  }

  static text(value) {
    return new HtmlNode({ name: HtmlNode.TEXT, text: value });
  }

  constructor({ name, attributes = {}, text = '' }) {
    this.name = name;
    this.attributes = attributes;
    this.text = text;
    this.children = [];
    this.parent = null;
  }

  get isText() {
    return this.name === HtmlNode.TEXT;
  }

  append(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }

  attribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  hasAttribute(name) {
    return this.attribute(name) !== null;
  }

  identityTokens() {
    return `${this.attribute('class') || ''} ${this.attribute('id') || ''}`.toLowerCase().split(/\s+/).filter(Boolean);
  }

  elementChildren() {
    return this.children.filter((child) => !child.isText);
  }

  * descendants() {
    yield this;
    for (const child of this.children) yield* child.descendants();
  }

  find(name) {
    for (const node of this.descendants()) if (node.name === name) return node;
    return null;
  }

  findAll(predicate) {
    return [...this.descendants()].filter(predicate);
  }

  plainText() {
    if (this.isText) return this.text;
    if (this.name === 'br') return '\n';
    return this.children.map((child) => child.plainText()).join('');
  }
}

module.exports = HtmlNode;
