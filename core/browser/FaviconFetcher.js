class FaviconFetcher {
  static DEFAULT_CONTENT_TYPE = 'image/x-icon';

  constructor({ fetchImpl = null, timeoutMs = 5000, maxBytes = 64 * 1024 } = {}) {
    this._fetch = fetchImpl;
    this._timeoutMs = timeoutMs;
    this._maxBytes = maxBytes;
  }

  async toDataUrl(src) {
    if (src.startsWith('data:')) return this._acceptDataUrl(src);
    const fetchFn = this._resolveFetch();
    if (typeof fetchFn !== 'function') return null;
    return this._download(fetchFn, src);
  }

  _acceptDataUrl(src) {
    return src.length <= this._maxBytes * 2 ? src : null;
  }

  _resolveFetch() {
    if (this._fetch) return this._fetch;
    try { return require('electron').net.fetch; } catch (_) { return null; }
  }

  async _download(fetchFn, src) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch (_) {} }, this._timeoutMs);
    try {
      const res = await fetchFn(src, ctrl ? { signal: ctrl.signal } : undefined);
      return await this._readImage(res);
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async _readImage(res) {
    if (!res || !res.ok) return null;
    const type = FaviconFetcher._contentType(res);
    if (!/^image\//i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > this._maxBytes) return null;
    return `data:${type.split(';')[0]};base64,${buf.toString('base64')}`;
  }

  static _contentType(res) {
    return (res.headers && res.headers.get && res.headers.get('content-type')) || FaviconFetcher.DEFAULT_CONTENT_TYPE;
  }
}

module.exports = FaviconFetcher;
