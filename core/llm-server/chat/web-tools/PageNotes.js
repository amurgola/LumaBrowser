const UrlIdentity = require('./UrlIdentity');

class PageNotes {
  static redirect(document) {
    if (!document.url || UrlIdentity.same(document.url, document.requestedUrl)) return '';
    return `(Redirected: ${document.requestedUrl} led to ${document.url}. If that is not the page you wanted, the `
      + 'original address probably does not exist; search for it rather than trying another path.)';
  }

  static rawCut(document) {
    return document.rawCut ? '(The page was larger than the download limit, so its end is missing.)' : '';
  }

  static thin() {
    return '(Warning: little readable prose here, mostly navigation or boilerplate, so the main content probably did '
      + 'not load. Reading this URL again will return the same. Use a different source, or open the page with the '
      + 'browser tools and read it with get_source.)';
  }

  static collect(document, { thin }) {
    return [PageNotes.redirect(document), PageNotes.rawCut(document), thin ? PageNotes.thin() : '']
      .filter(Boolean)
      .join('\n\n');
  }
}

module.exports = PageNotes;
