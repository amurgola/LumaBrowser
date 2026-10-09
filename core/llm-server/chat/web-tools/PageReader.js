const SafeFetch = require('../SafeFetch');
const BoilerplateTrimmer = require('./BoilerplateTrimmer');
const LookupReply = require('./LookupReply');
const PageClassifier = require('./PageClassifier');
const ResponseText = require('./ResponseText');

class PageReader {
  static HEADLESS_TIMEOUT_WITH_TAB_MS = 10000;
  static RAW_BYTE_LIMIT = 3 * 1024 * 1024;
  static MIN_RENDERED_CHARS = 120;

  static read(url, options) {
    return new PageReader(url, options).execute();
  }

  constructor(url, { timeoutMs, tabRender = null, fetcher = SafeFetch.fetch } = {}) {
    this._url = url;
    this._timeoutMs = timeoutMs;
    this._tabRender = typeof tabRender === 'function' ? tabRender : null;
    this._fetcher = fetcher;
  }

  async execute() {
    await this._fetchHeadless();
    const rendered = await this._renderInTab();
    if (rendered) return this._document(rendered, { url: this._url, viaBrowser: true });
    return this._headlessFailure()
      || this._document(this._headlessText, { url: this._res.finalUrl || this._url, status: this._res.status, rawCut: !!this._res.truncated });
  }

  async _fetchHeadless() {
    const timeoutMs = this._timeoutMs || (this._tabRender ? PageReader.HEADLESS_TIMEOUT_WITH_TAB_MS : undefined);
    this._res = await this._fetcher(this._url, { timeoutMs, maxBytes: PageReader.RAW_BYTE_LIMIT });
    this._httpOk = this._res.ok && this._res.status < 400;
    this._headlessText = this._httpOk ? ResponseText.toText(this._res) : '';
  }

  async _renderInTab() {
    this._triedTab = !!this._tabRender && (this._httpOk ? ResponseText.isHtml(this._res) : PageClassifier.tabMightSucceed(this._res));
    if (!this._triedTab) return null;
    const text = await Promise.resolve()
      .then(() => this._tabRender(this._url, { timeoutMs: this._timeoutMs }))
      .catch(() => null);
    if (!text || text.trim().length <= PageReader.MIN_RENDERED_CHARS || PageClassifier.isChallenge(text)) return null;
    return text;
  }

  _headlessFailure() {
    const res = this._res;
    if (!res.ok) return LookupReply.fail(`Could not reach ${this._url}: ${LookupReply.reasonOf(res.error)}.`, LookupReply.SEARCH_INSTEAD);
    if (res.status === 404 || res.status === 410) {
      return LookupReply.fail(`${this._url} does not exist (the server answered HTTP ${res.status}).`, LookupReply.SEARCH_INSTEAD);
    }
    if (res.status >= 400) return LookupReply.fail(`${this._url} was refused with HTTP ${res.status}${this._tabNote()}.`, LookupReply.OTHER_SOURCE);
    if (!this._headlessText) {
      return LookupReply.fail(`${this._url} loaded (HTTP ${res.status}) but held no readable text.`, 'Use a different source, or open it with the browser tools.');
    }
    if (PageClassifier.isChallenge(this._headlessText)) {
      return LookupReply.fail(`${this._url} served a bot check instead of its content${this._tabNote()}.`, LookupReply.OTHER_SOURCE);
    }
    return null;
  }

  _tabNote() {
    return this._triedTab ? ', and a browser tab was turned away too' : '';
  }

  _document(rawText, facts) {
    const { text, trimmedBlocks } = BoilerplateTrimmer.trim(rawText);
    return {
      success: true,
      document: { requestedUrl: this._url, viaBrowser: false, rawCut: false, ...facts, text, trimmedBlocks, fetchedAt: Date.now() },
    };
  }
}

module.exports = PageReader;
