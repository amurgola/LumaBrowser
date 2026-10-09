const LookupReply = require('./web-tools/LookupReply');
const LookupRequest = require('./web-tools/LookupRequest');
const PageReader = require('./web-tools/PageReader');
const PageReport = require('./web-tools/PageReport');
const ReadBudget = require('./web-tools/ReadBudget');
const SearchRunner = require('./web-tools/SearchRunner');
const UrlIdentity = require('./web-tools/UrlIdentity');
const WebSession = require('./web-tools/WebSession');

class WebLookup {
  static NEAR_MATCH_SIMILARITY = 0.8;

  static run(options) {
    return new WebLookup(options).execute();
  }

  constructor({ params, tabRender = null, ctxPerSlot, session, fetcher } = {}) {
    this._params = params;
    this._tabRender = tabRender;
    this._session = session || new WebSession();
    this._partChars = ReadBudget.partChars(ctxPerSlot);
    this._fetcher = fetcher;
  }

  async execute() {
    const request = LookupRequest.parse(this._params);
    if (request.problem) return LookupReply.fail(request.problem);
    this._request = request;
    return request.kind === 'search' ? this._search() : this._read();
  }

  async _search() {
    try {
      const reply = await SearchRunner.run(this._request.query, { ...this._transport(), partChars: this._partChars });
      if (reply.success && reply.results && reply.results.length) this._session.results.remember(reply.results);
      return reply;
    } catch (err) {
      return LookupReply.fail(`The web search broke unexpectedly (${LookupReply.reasonOf(err.message)}).`, 'Retry once with a simpler query.');
    }
  }

  async _read() {
    const target = this._target();
    if (target.problem) return LookupReply.fail(target.problem);
    try {
      const got = await this._documentFor(target.url);
      if (got.success) return this._report(got, { handle: target.handle });
      const healed = target.byNumber ? null : await this._nearMatch(target.url);
      return healed || got;
    } catch (err) {
      return LookupReply.fail(`Reading ${target.url} broke unexpectedly (${LookupReply.reasonOf(err.message)}).`, 'Retry once, or use a different source.');
    }
  }

  _target() {
    const { url, resultNumber } = this._request;
    if (resultNumber == null) return { url, handle: url, byNumber: false };
    const row = this._session.results.byNumber(resultNumber);
    if (row) return { url: row.url, handle: String(resultNumber), byNumber: true };
    const count = this._session.results.count();
    return {
      problem: count
        ? `There is no result ${resultNumber}: the latest search listed ${count}. Pick 1-${count}, or run a new query.`
        : 'There are no search results to pick from yet: run web_search with a "query" first, then open a result by its number.',
    };
  }

  async _documentFor(url) {
    const cached = this._session.pages.get(url);
    if (cached) return { success: true, document: cached, fromCache: true };
    const got = await PageReader.read(url, this._transport());
    if (got.success) this._session.pages.put(got.document);
    return got;
  }

  async _nearMatch(url) {
    const near = this._session.results.nearest(url);
    if (!near || near.similarity < WebLookup.NEAR_MATCH_SIMILARITY || UrlIdentity.same(near.url, url)) return null;
    const retry = await this._documentFor(near.url);
    if (!retry.success) return null;
    return this._report(retry, {
      handle: near.url,
      preface: `(The address you typed failed, but it nearly matches search result "${near.title}", so ${near.url} was `
        + 'read instead. Open results by number, like {"url":"2"}, rather than retyping them.)',
    });
  }

  _report(got, { handle, preface }) {
    const { find, part } = this._request;
    return PageReport.render(got.document, { find, part, partChars: this._partChars, handle, preface, fromCache: !!got.fromCache });
  }

  _transport() {
    return { timeoutMs: this._request.timeoutMs, tabRender: this._tabRender, ...(this._fetcher ? { fetcher: this._fetcher } : null) };
  }
}

module.exports = WebLookup;
