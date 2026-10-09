class HtmlElementCatalog {
  static VOID = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  static RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp']);

  static METADATA = new Set(['base', 'head', 'link', 'meta', 'noscript', 'script', 'style', 'template', 'title']);

  static EMBEDDED = new Set(['audio', 'canvas', 'embed', 'iframe', 'map', 'math', 'object', 'picture', 'svg', 'video']);

  static CONTROLS = new Set(['button', 'datalist', 'input', 'optgroup', 'option', 'select', 'textarea']);

  static CHROME_LANDMARKS = new Set(['aside', 'footer', 'nav']);

  static BLOCKS = new Set([
    'address', 'article', 'body', 'caption', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
    'figure', 'form', 'header', 'hgroup', 'html', 'legend', 'li', 'main', 'p', 'search', 'section', 'summary',
    'td', 'th', 'tr',
  ]);

  static HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

  static isVoid(name) {
    return HtmlElementCatalog.VOID.has(name);
  }

  static isRawText(name) {
    return HtmlElementCatalog.RAW_TEXT.has(name);
  }

  static isNonContent(name) {
    return HtmlElementCatalog.METADATA.has(name)
      || HtmlElementCatalog.EMBEDDED.has(name)
      || HtmlElementCatalog.CONTROLS.has(name);
  }

  static isChromeLandmark(name) {
    return HtmlElementCatalog.CHROME_LANDMARKS.has(name);
  }

  static isBlock(name) {
    return HtmlElementCatalog.BLOCKS.has(name) || HtmlElementCatalog.HEADINGS.has(name);
  }

  static headingLevel(name) {
    return HtmlElementCatalog.HEADINGS.has(name) ? Number(name[1]) : 0;
  }
}

module.exports = HtmlElementCatalog;
