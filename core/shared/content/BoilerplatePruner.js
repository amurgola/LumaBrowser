const HtmlElementCatalog = require('./HtmlElementCatalog');
const NodeTextStats = require('./NodeTextStats');
const TreePruner = require('./TreePruner');

class BoilerplatePruner extends TreePruner {
  static CHROME_ROLES = new Set(['banner', 'complementary', 'contentinfo', 'menu', 'menubar', 'navigation', 'search']);

  static CHROME_TOKEN = /^(?:breadcrumbs?|cookie[-_]?(?:banner|bar|consent|notice)|consent[-_]?banner|newsletter[-_]?signup|share[-_]?(?:bar|buttons)|social[-_]?(?:links|share)|skip[-_]?(?:link|to[-_]?content)|sr[-_]only|visually[-_]hidden)$/;

  static DENSITY_CANDIDATES = new Set(['div', 'dl', 'header', 'menu', 'ol', 'section', 'table', 'ul']);

  static MAX_LINK_DENSITY = 0.6;
  static MIN_LINKS = 3;

  static prune(root) {
    return new BoilerplatePruner(root).prune(root);
  }

  constructor(root) {
    super();
    this._stats = NodeTextStats.measure(root);
    this._judgeDensity = this._stats.linkDensity(root) < BoilerplatePruner.MAX_LINK_DENSITY;
  }

  shouldDrop(node) {
    return HtmlElementCatalog.isChromeLandmark(node.name)
      || BoilerplatePruner._hasChromeRole(node)
      || BoilerplatePruner._hasChromeToken(node)
      || this._isLinkDense(node);
  }

  static _hasChromeRole(node) {
    return BoilerplatePruner.CHROME_ROLES.has(String(node.attribute('role') || '').toLowerCase());
  }

  static _hasChromeToken(node) {
    return node.identityTokens().some((token) => BoilerplatePruner.CHROME_TOKEN.test(token));
  }

  _isLinkDense(node) {
    if (!this._judgeDensity || !BoilerplatePruner.DENSITY_CANDIDATES.has(node.name)) return false;
    return this._stats.of(node).links >= BoilerplatePruner.MIN_LINKS
      && this._stats.linkDensity(node) >= BoilerplatePruner.MAX_LINK_DENSITY;
  }
}

module.exports = BoilerplatePruner;
