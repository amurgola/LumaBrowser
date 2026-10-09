class LookupTools {
  static NAMES = new Set(['web_search', 'search_knowledge_base']);

  static isLookup(name) {
    return LookupTools.NAMES.has(name);
  }

  static isPageRead(name, params) {
    return name === 'web_search' && LookupTools._text(params, 'url') !== '';
  }

  static queryOf(name, params) {
    if (!LookupTools.isLookup(name) || LookupTools.isPageRead(name, params)) return null;
    return LookupTools._text(params, 'query');
  }

  static _text(params, key) {
    const value = params && typeof params === 'object' ? params[key] : null;
    return typeof value === 'string' ? value.trim() : '';
  }
}

module.exports = LookupTools;
