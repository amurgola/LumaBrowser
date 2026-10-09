const HtmlToMarkdown = require('../../shared/content/HtmlToMarkdown');
const PageSourceScripts = require('./PageSourceScripts');

class PageSource {
  static async read(page, options = {}) {
    const extractionType = options.type || PageSourceScripts.DEFAULT_TYPE;
    const raw = await page.run(PageSourceScripts.forType(extractionType));
    return { success: true, source: PageSource._finish(extractionType, raw, page), extractionType };
  }

  static _finish(extractionType, source, page) {
    if (extractionType === 'markdown' && typeof source === 'string') {
      return HtmlToMarkdown.convert(source, { baseUrl: page.url() });
    }
    return source;
  }
}

module.exports = PageSource;
