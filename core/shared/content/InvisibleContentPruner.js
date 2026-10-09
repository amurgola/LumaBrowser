const HtmlElementCatalog = require('./HtmlElementCatalog');
const TreePruner = require('./TreePruner');

class InvisibleContentPruner extends TreePruner {
  static HIDDEN_STYLE = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\b/i;

  shouldDrop(node) {
    return HtmlElementCatalog.isNonContent(node.name) || InvisibleContentPruner._isHidden(node);
  }

  static _isHidden(node) {
    return node.hasAttribute('hidden')
      || node.attribute('aria-hidden') === 'true'
      || InvisibleContentPruner.HIDDEN_STYLE.test(node.attribute('style') || '');
  }
}

module.exports = InvisibleContentPruner;
