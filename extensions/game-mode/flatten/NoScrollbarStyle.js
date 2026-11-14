class NoScrollbarStyle {
  static MARKER = 'data-luma-no-scrollbars';

  static TAG = `<style ${NoScrollbarStyle.MARKER}>html, body { overflow: hidden; }</style>`;

  static apply(html) {
    const page = String(html);
    if (page.includes(NoScrollbarStyle.MARKER)) return page;
    const headEnd = page.search(/<\/head\s*>/i);
    if (headEnd !== -1) return NoScrollbarStyle._insertAt(page, headEnd);
    const bodyStart = page.search(/<body[\s>]/i);
    if (bodyStart !== -1) return NoScrollbarStyle._insertAt(page, bodyStart);
    const doctype = page.match(/^\s*<!doctype[^>]*>/i);
    return NoScrollbarStyle._insertAt(page, doctype ? doctype[0].length : 0);
  }

  static _insertAt(page, index) {
    return page.slice(0, index) + NoScrollbarStyle.TAG + page.slice(index);
  }
}

module.exports = NoScrollbarStyle;
