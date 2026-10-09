const CodeBlockRenderer = require('./CodeBlockRenderer');
const HtmlElementCatalog = require('./HtmlElementCatalog');
const ListBlockRenderer = require('./ListBlockRenderer');
const MarkdownWriter = require('./MarkdownWriter');
const QuoteBlockRenderer = require('./QuoteBlockRenderer');
const TableBlockRenderer = require('./TableBlockRenderer');
const UrlResolver = require('./UrlResolver');

class MarkdownRenderer {
  static EMPHASIS = { b: '**', strong: '**', em: '_', i: '_', del: '~~', s: '~~', strike: '~~' };
  static INLINE_CODE = new Set(['code', 'kbd', 'samp']);

  constructor({ urlResolver = new UrlResolver(null) } = {}) {
    this._urls = urlResolver;
    this._blockRenderers = [
      new CodeBlockRenderer(this), new ListBlockRenderer(this), new QuoteBlockRenderer(this), new TableBlockRenderer(this),
    ];
  }

  render(root) {
    return this.renderBlocks(root);
  }

  renderBlocks(node) {
    return this._renderWith(node, new MarkdownWriter());
  }

  renderInline(node) {
    return this._renderWith(node, new MarkdownWriter({ inline: true }));
  }

  renderChildren(node, writer) {
    for (const child of node.children) this._renderNode(child, writer);
  }

  _renderWith(node, writer) {
    this.renderChildren(node, writer);
    return writer.toString();
  }

  _renderNode(node, writer) {
    if (node.isText) return writer.text(node.text);
    const blockRenderer = this._blockRenderers.find((candidate) => candidate.matches(node));
    if (blockRenderer) return blockRenderer.render(node, writer);
    return this._renderElement(node, writer);
  }

  _renderElement(node, writer) {
    const level = HtmlElementCatalog.headingLevel(node.name);
    if (level) return this._renderHeading(node, level, writer);
    if (node.name === 'br') return writer.lineBreak();
    if (node.name === 'hr') return writer.block('---');
    if (node.name === 'a') return this._renderLink(node, writer);
    if (MarkdownRenderer.EMPHASIS[node.name]) return this._renderEmphasis(node, writer);
    if (MarkdownRenderer.INLINE_CODE.has(node.name)) return this._renderInlineCode(node, writer);
    return this._renderContainer(node, writer);
  }

  _renderContainer(node, writer) {
    const isBlock = HtmlElementCatalog.isBlock(node.name);
    if (isBlock) writer.blockBreak();
    this.renderChildren(node, writer);
    if (isBlock) writer.blockBreak();
  }

  _renderHeading(node, level, writer) {
    const text = this.renderInline(node).trim();
    if (!text) return;
    if (writer.inline) writer.text(` ${text} `);
    else writer.block(`${'#'.repeat(level)} ${text}`);
  }

  _renderLink(node, writer) {
    const url = this._urls.resolve(node.attribute('href'));
    MarkdownRenderer._writeAround(writer, this.renderInline(node), (text) => (
      url ? `[${text}](${MarkdownRenderer._markdownUrl(url)})` : text
    ));
  }

  _renderEmphasis(node, writer) {
    const marker = MarkdownRenderer.EMPHASIS[node.name];
    MarkdownRenderer._writeAround(writer, this.renderInline(node), (text) => `${marker}${text}${marker}`);
  }

  _renderInlineCode(node, writer) {
    MarkdownRenderer._writeAround(writer, node.plainText(), (code) => {
      const ticks = CodeBlockRenderer.fenceFor(code, 1);
      const pad = /^`|`$/.test(code) ? ' ' : '';
      return `${ticks}${pad}${code}${pad}${ticks}`;
    });
  }

  static _writeAround(writer, inner, format) {
    const core = inner.replace(/\s+/g, ' ').trim();
    if (!core) return writer.text(inner);
    const lead = /^\s/.test(inner) ? ' ' : '';
    const trail = /\s$/.test(inner) ? ' ' : '';
    return writer.text(`${lead}${format(core)}${trail}`);
  }

  static _markdownUrl(url) {
    return url.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
  }
}

module.exports = MarkdownRenderer;
