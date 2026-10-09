class UrlIdentity {
  static key(url) {
    return String(url || '')
      .trim()
      .replace(/#.*$/, '')
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }

  static same(a, b) {
    return UrlIdentity.key(a) === UrlIdentity.key(b);
  }
}

module.exports = UrlIdentity;
