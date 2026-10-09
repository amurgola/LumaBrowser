const BoilerplatePruner = require('./BoilerplatePruner');
const ContentRootLocator = require('./ContentRootLocator');
const HtmlTokenizer = require('./HtmlTokenizer');
const HtmlTreeBuilder = require('./HtmlTreeBuilder');
const InvisibleContentPruner = require('./InvisibleContentPruner');
const MarkdownRenderer = require('./MarkdownRenderer');
const UrlResolver = require('./UrlResolver');

class HtmlToMarkdown {
  static convert(html, options = {}) {
    return new HtmlToMarkdown(html, options).execute();
  }

  constructor(html, { baseUrl = null } = {}) {
    this._html = String(html == null ? '' : html).replace(/\r\n?/g, '\n');
    this._baseUrl = baseUrl;
  }

  execute() {
    const document = HtmlTreeBuilder.build(HtmlTokenizer.tokenize(this._html));
    const urlResolver = this._urlResolverFor(document);
    new InvisibleContentPruner().prune(document);
    const content = ContentRootLocator.locate(document);
    BoilerplatePruner.prune(content);
    return new MarkdownRenderer({ urlResolver }).render(content);
  }

  _urlResolverFor(document) {
    const base = document.find('base');
    return UrlResolver.forDocument(this._baseUrl, base && base.attribute('href'));
  }
}

module.exports = HtmlToMarkdown;
