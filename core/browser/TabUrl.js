class TabUrl {
  static BLANK = 'about:blank';
  static PASS_THROUGH_PREFIXES = ['http://', 'https://', 'about:', 'file:'];
  static OTHER_SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d+([/?#]|$))/i;

  static normalize(url) {
    if (!url) return TabUrl.BLANK;
    if (TabUrl._hasScheme(url)) return url;
    return TabUrl._defaultProtocolFor(url) + url;
  }

  static isNavigable(url) {
    try {
      new URL(TabUrl.normalize(url));
      return true;
    } catch {
      return false;
    }
  }

  static isLoopbackOrPrivateHost(url) {
    const host = TabUrl._hostOf(url);
    return TabUrl._isLoopbackName(host)
      || TabUrl._isPrivateIpv4(host)
      || TabUrl._isSingleLabel(host);
  }

  static _hasScheme(url) {
    return TabUrl.PASS_THROUGH_PREFIXES.some((prefix) => url.startsWith(prefix))
      || TabUrl.OTHER_SCHEME.test(url);
  }

  static _defaultProtocolFor(url) {
    return TabUrl.isLoopbackOrPrivateHost(url) ? 'http://' : 'https://';
  }

  static _hostOf(url) {
    return String(url)
      .split(/[/?#]/)[0]
      .replace(/:\d+$/, '')
      .replace(/^\[|\]$/g, '')
      .toLowerCase();
  }

  static _isLoopbackName(host) {
    return host === 'localhost' || host.endsWith('.localhost') || host === '::1';
  }

  static _isPrivateIpv4(host) {
    return /^127\./.test(host)
      || /^10\./.test(host)
      || /^192\.168\./.test(host)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  }

  static _isSingleLabel(host) {
    return /^[a-z0-9-]+$/.test(host);
  }
}

module.exports = TabUrl;
