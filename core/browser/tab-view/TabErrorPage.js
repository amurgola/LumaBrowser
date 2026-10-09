const path = require('path');
const { pathToFileURL } = require('url');

class TabErrorPage {
  static URL = pathToFileURL(path.join(__dirname, 'error.html')).href;

  static isErrorPage(url) {
    return typeof url === 'string' && url.startsWith(TabErrorPage.URL);
  }

  static targetOf(errorUrl) {
    try {
      return new URL(errorUrl).searchParams.get('url') || null;
    } catch (_) {
      return null;
    }
  }

  static show(entry, { code, desc, url, gen }) {
    const wc = entry.webContents;
    if (!wc || wc.isDestroyed()) return;
    if (gen != null && entry._nav && gen < entry._nav.navGen) return;
    entry._errorPageFor = url || entry.url;
    wc.loadURL(TabErrorPage._urlFor(code, desc, url)).catch(() => {});
  }

  static _urlFor(code, desc, url) {
    const query = new URLSearchParams({ code: String(code || 0), desc: String(desc || ''), url: String(url || '') });
    return `${TabErrorPage.URL}?${query.toString()}`;
  }
}

module.exports = TabErrorPage;
