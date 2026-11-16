const HtmlToMarkdown = require('../../shared/content/HtmlToMarkdown');
const PageSourceScripts = require('./PageSourceScripts');

class PageSource {
  static async read(page, options = {}) {
    const extractionType = options.type || PageSourceScripts.DEFAULT_TYPE;
    const selector = options.selector || null;
    const scope = selector ? await PageSource._scope(page, extractionType, selector) : null;
    if (scope && scope.error) return { success: false, error: scope.error };
    const raw = await page.run(PageSourceScripts.forType(extractionType, selector));
    const reply = { success: true, source: PageSource._finish(extractionType, raw, page), extractionType };
    return scope ? { ...reply, selector, matched: scope.count } : reply;
  }

  static async _scope(page, extractionType, selector) {
    if (!PageSourceScripts.canScope(extractionType)) return { error: `selector is not supported for type "${extractionType}"` };
    const found = await page.run(PageSourceScripts.matchCount(selector));
    if (!found || found.error) return { error: `Invalid selector "${selector}": ${(found && found.error) || 'the page did not answer'}` };
    if (!found.count) return { error: `No elements found for selector "${selector}"` };
    return { count: found.count };
  }

  static _finish(extractionType, source, page) {
    if (extractionType === 'markdown' && typeof source === 'string') {
      return HtmlToMarkdown.convert(source, { baseUrl: page.url() });
    }
    return source;
  }
}

module.exports = PageSource;
