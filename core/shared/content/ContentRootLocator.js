const NodeTextStats = require('./NodeTextStats');

class ContentRootLocator {
  static MIN_TEXT_SHARE = 0.2;

  static locate(document) {
    return new ContentRootLocator(document).execute();
  }

  constructor(document) {
    this._document = document;
    this._body = document.find('body') || document;
    this._stats = NodeTextStats.measure(this._body);
  }

  execute() {
    const candidates = [...this._mainRegions(), ...this._loneArticle()];
    return candidates.find((node) => this._isSubstantial(node)) || this._body;
  }

  _mainRegions() {
    return this._body.findAll((node) => node.name === 'main' || node.attribute('role') === 'main');
  }

  _loneArticle() {
    const articles = this._body.findAll((node) => node.name === 'article');
    return articles.length === 1 ? articles : [];
  }

  _isSubstantial(node) {
    const chars = this._stats.of(node).chars;
    return chars > 0 && chars >= this._stats.of(this._body).chars * ContentRootLocator.MIN_TEXT_SHARE;
  }
}

module.exports = ContentRootLocator;
