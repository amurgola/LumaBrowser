const PageClassifier = require('../web-tools/PageClassifier');
const ResponseText = require('../web-tools/ResponseText');

class LivePageFetch {
  static HEADLESS_TIMEOUT_MS = 12000;
  static MIN_FETCH_BYTES = 512 * 1024;
  static MAX_FETCH_BYTES = 4 * 1024 * 1024;
  static BYTES_PER_CHAR = 8;

  constructor({ fetcher, tabFetch = null }) {
    this._fetch = fetcher;
    this._tabFetch = tabFetch;
  }

  async execute(request) {
    this._request = request;
    await this._fetchHeadless();
    const rendered = await this._tryBrowserTab();
    if (rendered) return this._finish(rendered, { viaBrowser: true });
    return this._fromHeadless();
  }

  async _fetchHeadless() {
    const { url, maxChars, timeoutMs } = this._request;
    const maxBytes = Math.min(Math.max(LivePageFetch.MIN_FETCH_BYTES, maxChars * LivePageFetch.BYTES_PER_CHAR), LivePageFetch.MAX_FETCH_BYTES);
    this._res = await this._fetch(url, { timeoutMs: timeoutMs || LivePageFetch.HEADLESS_TIMEOUT_MS, maxBytes });
    this._httpOk = this._res.ok && this._res.status < 400;
    this._blocked = this._httpOk && PageClassifier.isChallenge(this._res.body);
  }

  _wantsBrowserTab() {
    if (!this._tabFetch) return false;
    if (this._httpOk) return ResponseText.isHtml(this._res) || this._blocked;
    return PageClassifier.tabMightSucceed(this._res);
  }

  async _tryBrowserTab() {
    if (!this._wantsBrowserTab()) return null;
    const { url, mode, timeoutMs } = this._request;
    let got = null;
    try {
      got = await this._tabFetch(url, { mode: mode === 'html' ? 'full' : mode, timeoutMs });
    } catch (_) {
      got = null;
    }
    return got && got.trim().length > 0 && !PageClassifier.isChallenge(got) ? got : null;
  }

  _fromHeadless() {
    const res = this._res;
    if (!res.ok) return { success: false, error: res.error || 'fetch failed' };
    if (res.status >= 400) return { success: false, error: `HTTP ${res.status}`, status: res.status };
    if (this._blocked) {
      return { success: false, error: 'The site answered with a bot-check/challenge page instead of content.' };
    }
    const content = this._request.mode === 'html' ? res.body : ResponseText.toText(res);
    return this._finish(content, { status: res.status });
  }

  _finish(text, extra) {
    const full = String(text || '');
    const { url, maxChars } = this._request;
    const truncated = full.length > maxChars;
    return {
      success: true,
      url,
      content: truncated ? full.slice(0, maxChars) : full,
      truncated,
      totalChars: full.length,
      ...extra,
    };
  }
}

module.exports = LivePageFetch;
