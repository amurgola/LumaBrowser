class ChromeWebStoreClient {
  static UPDATE_URL = 'https://clients2.google.com/service/update2/crx';
  static DETAIL_URL = 'https://chromewebstore.google.com/detail';
  static ID_PATTERN = /^[a-p]{32}$/;
  static ID_IN_TEXT = /(?:^|[^a-p])([a-p]{32})(?![a-p])/g;
  static FALLBACK_CHROME_VERSION = '130.0.0.0';
  static TIMEOUT_MS = 60000;
  static MAX_CRX_BYTES = 64 * 1024 * 1024;

  constructor({ fetchImpl = null, chromeVersion = null, timeoutMs = ChromeWebStoreClient.TIMEOUT_MS } = {}) {
    this._fetch = fetchImpl;
    this._chromeVersion = chromeVersion || process.versions.chrome || ChromeWebStoreClient.FALLBACK_CHROME_VERSION;
    this._timeoutMs = timeoutMs;
  }

  static resolveId(input) {
    const text = String(input || '').trim().toLowerCase();
    if (ChromeWebStoreClient.ID_PATTERN.test(text)) return text;
    const matches = [...text.matchAll(ChromeWebStoreClient.ID_IN_TEXT)];
    return matches.length ? matches[matches.length - 1][1] : null;
  }

  static detailUrl(id) {
    return `${ChromeWebStoreClient.DETAIL_URL}/${id}`;
  }

  downloadUrl(id) {
    return this._updateUrl(`id=${id}&uc`, { response: 'redirect', acceptformat: 'crx2,crx3' });
  }

  updateCheckUrl(id, currentVersion = '0.0.0.0') {
    return this._updateUrl(`id=${id}&v=${currentVersion}&uc`, { response: 'updatecheck', acceptformat: 'crx2,crx3' });
  }

  async downloadCrx(id) {
    const res = await this._get(this.downloadUrl(id));
    if (res.status === 204 || res.status === 404) throw new Error(`The Chrome Web Store does not serve extension ${id}`);
    if (!res.ok) throw new Error(`Chrome Web Store download failed (HTTP ${res.status})`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length) throw new Error(`The Chrome Web Store returned an empty package for ${id}`);
    if (bytes.length > ChromeWebStoreClient.MAX_CRX_BYTES) throw new Error('Extension package is too large');
    return bytes;
  }

  async latestVersion(id) {
    const res = await this._get(this.updateCheckUrl(id));
    if (!res.ok) throw new Error(`Chrome Web Store update check failed (HTTP ${res.status})`);
    return ChromeWebStoreClient.parseUpdateCheck(await res.text());
  }

  static parseUpdateCheck(xml) {
    const tag = /<updatecheck\b([^>]*)>/i.exec(String(xml || ''));
    if (!tag) return null;
    const attr = (name) => {
      const m = new RegExp(`\\b${name}="([^"]*)"`, 'i').exec(tag[1]);
      return m ? m[1] : null;
    };
    return attr('status') === 'ok' ? attr('version') : null;
  }

  _updateUrl(x, params) {
    const query = new URLSearchParams({ ...params, prodversion: this._chromeVersion, x });
    return `${ChromeWebStoreClient.UPDATE_URL}?${query.toString()}`;
  }

  async _get(url) {
    const fetchFn = this._resolveFetch();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this._timeoutMs);
    try {
      return await fetchFn(url, { redirect: 'follow', signal: ctrl.signal });
    } catch (err) {
      if (ctrl.signal.aborted) throw new Error('Chrome Web Store request timed out');
      throw new Error(`Could not reach the Chrome Web Store: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  _resolveFetch() {
    if (this._fetch) return this._fetch;
    try {
      const { net } = require('electron');
      if (net && typeof net.fetch === 'function') return net.fetch.bind(net);
    } catch (_) {}
    return fetch;
  }
}

module.exports = ChromeWebStoreClient;
