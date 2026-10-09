const HtmlElementCatalog = require('./HtmlElementCatalog');
const HtmlNode = require('./HtmlNode');

class HtmlTreeBuilder {
  static PARAGRAPH_ENDERS = [
    'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figure', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul',
  ];

  static MAX_DEPTH = 400;

  static IMPLIED_ENDS = HtmlTreeBuilder._impliedEnds();

  static build(tokens) {
    return new HtmlTreeBuilder().execute(tokens);
  }

  constructor() {
    this._root = HtmlNode.element('#document');
    this._open = [this._root];
  }

  execute(tokens) {
    for (const token of tokens) this._consume(token);
    return this._root;
  }

  _consume(token) {
    if (token.type === 'text') this._current().append(HtmlNode.text(token.text));
    else if (token.type === 'open') this._openElement(token);
    else this._closeElement(token.name);
  }

  _current() {
    return this._open[this._open.length - 1];
  }

  _openElement(token) {
    this._closeImplied(token.name);
    const node = this._current().append(HtmlNode.element(token.name, token.attributes));
    if (this._canContain(token)) this._open.push(node);
  }

  _canContain(token) {
    return !token.selfClosing && !HtmlElementCatalog.isVoid(token.name) && this._open.length < HtmlTreeBuilder.MAX_DEPTH;
  }

  _closeImplied(name) {
    const rule = HtmlTreeBuilder.IMPLIED_ENDS.get(name);
    if (!rule) return;
    const depth = this._nearestOpen((openName) => rule.closes.has(openName), (openName) => rule.within.has(openName));
    if (depth > 0) this._popTo(depth);
  }

  _closeElement(name) {
    const depth = this._nearestOpen((openName) => openName === name, () => false);
    if (depth > 0) this._popTo(depth);
  }

  _nearestOpen(wanted, barrier) {
    for (let depth = this._open.length - 1; depth > 0; depth--) {
      const openName = this._open[depth].name;
      if (wanted(openName)) return depth;
      if (barrier(openName)) return -1;
    }
    return -1;
  }

  _popTo(depth) {
    this._open.length = depth;
  }

  static _impliedEnds() {
    const rules = new Map();
    const add = (names, closes, within) => {
      for (const name of names) rules.set(name, { closes: new Set(closes), within: new Set(within) });
    };
    add(HtmlTreeBuilder.PARAGRAPH_ENDERS, ['p'], ['blockquote', 'button', 'li', 'td', 'th']);
    add(['li'], ['li'], ['menu', 'ol', 'ul']);
    add(['dd', 'dt'], ['dd', 'dt'], ['dl']);
    add(['tr'], ['tr'], ['table', 'tbody', 'tfoot', 'thead']);
    add(['td', 'th'], ['td', 'th'], ['table', 'tr']);
    add(['tbody', 'tfoot', 'thead'], ['tbody', 'tfoot', 'thead'], ['table']);
    add(['option'], ['option'], ['datalist', 'select']);
    return rules;
  }
}

module.exports = HtmlTreeBuilder;
