class SelectorQuerySanitizer {
  static URL_ATTRIBUTE_SELECTOR = /\[(href|src|action)="([^"]*)"\]/g;
  static KEPT_PARAM = /^(page|p|pg|offset|start)=/i;

  static sanitize(selector) {
    if (!selector || typeof selector !== 'string') return selector;
    return selector.replace(SelectorQuerySanitizer.URL_ATTRIBUTE_SELECTOR, SelectorQuerySanitizer._rewrite);
  }

  static _rewrite(match, attribute, value) {
    const queryStart = value.indexOf('?');
    if (queryStart === -1) return match;
    const pathPrefix = value.slice(0, queryStart + 1);
    const parts = [`[${attribute}^="${pathPrefix}"]`];
    for (const param of SelectorQuerySanitizer._keptParams(value.slice(queryStart + 1))) {
      parts.push(`[${attribute}*="${param}"]`);
    }
    return parts.join('');
  }

  static _keptParams(query) {
    return query.split('&').filter((param) => SelectorQuerySanitizer.KEPT_PARAM.test(param));
  }
}

module.exports = SelectorQuerySanitizer;
