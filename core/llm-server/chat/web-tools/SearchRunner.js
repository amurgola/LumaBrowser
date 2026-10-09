const HtmlToMarkdown = require('../../../shared/content/HtmlToMarkdown');
const SafeFetch = require('../SafeFetch');
const BingEngine = require('./BingEngine');
const DuckDuckGoEngine = require('./DuckDuckGoEngine');
const LookupReply = require('./LookupReply');
const PageClassifier = require('./PageClassifier');
const ReadBudget = require('./ReadBudget');
const ResultList = require('./ResultList');
const TextPager = require('./TextPager');

class SearchRunner {
  static ENOUGH_RESULTS = 3;
  static ENGINE_PAGE_BYTES = 1024 * 1024;
  static MIN_RENDERED_CHARS = 200;

  static FAILURE_NEXT_STEP = 'Search by hand instead: navigate the browser to "https://duckduckgo.com/?q=<your+query>", '
    + 'then observe_page and get_source to read the results. A known address can still be read with "url".';

  static run(query, options) {
    return new SearchRunner(query, options).execute();
  }

  constructor(query, { timeoutMs, tabRender = null, fetcher = SafeFetch.fetch, partChars = ReadBudget.partChars() } = {}) {
    this._query = query;
    this._timeoutMs = timeoutMs;
    this._tabRender = typeof tabRender === 'function' ? tabRender : null;
    this._fetcher = fetcher;
    this._partChars = partChars;
    this._list = new ResultList();
    this._answeredEngines = new Set();
    this._sawNothingFound = false;
    this._renderedPage = '';
  }

  async execute() {
    for (const source of this._sources()) {
      if (this._list.size() >= SearchRunner.ENOUGH_RESULTS) break;
      if (this._answeredEngines.has(source.engine)) continue;
      await this._collect(source);
    }
    if (this._list.size()) return this._list.reply(this._query);
    if (this._sawNothingFound) return this._nothingFound();
    if (this._renderedPage) return this._renderedReply();
    return LookupReply.fail(
      `No search engine answered for "${this._query}": they are unreachable or blocking automated searches right now `
        + '(a tool fault, not an empty result).',
      SearchRunner.FAILURE_NEXT_STEP,
    );
  }

  _sources() {
    return [
      ...(this._tabRender ? [{ engine: DuckDuckGoEngine, load: () => this._loadInTab() }] : []),
      { engine: DuckDuckGoEngine, load: () => this._loadHeadless(DuckDuckGoEngine) },
      { engine: BingEngine, load: () => this._loadHeadless(BingEngine) },
    ];
  }

  async _collect({ engine, load }) {
    const html = await Promise.resolve().then(load).catch(() => null);
    if (!html || PageClassifier.isChallenge(html)) return;
    const rows = engine.parse(html);
    if (rows.length) {
      this._list.add(rows);
      this._answeredEngines.add(engine);
    } else {
      this._noteEmptyPage(html);
    }
  }

  _loadInTab() {
    return this._tabRender(DuckDuckGoEngine.searchUrl(this._query), { html: true, needle: DuckDuckGoEngine.TAB_NEEDLE, timeoutMs: this._timeoutMs });
  }

  async _loadHeadless(engine) {
    const res = await this._fetcher(engine.searchUrl(this._query), { timeoutMs: this._timeoutMs, maxBytes: SearchRunner.ENGINE_PAGE_BYTES });
    return res.ok && res.status < 400 ? res.body : null;
  }

  _noteEmptyPage(html) {
    if (PageClassifier.isNothingFound(html)) {
      this._sawNothingFound = true;
      return;
    }
    const markdown = HtmlToMarkdown.convert(html).trim();
    if (!this._renderedPage && markdown.length > SearchRunner.MIN_RENDERED_CHARS) this._renderedPage = markdown;
  }

  _nothingFound() {
    return LookupReply.ok(
      `The web search for "${this._query}" (searched ${LookupReply.today()}) found nothing: no indexed page matches this `
        + 'wording. That is a real answer, not a tool fault: an exact name or phrase that finds nothing probably does '
        + 'not exist as written. Say so, or try a broader or differently spelled query; repeating this one will not help.',
      { results: [] },
    );
  }

  _renderedReply() {
    const firstPart = new TextPager(this._renderedPage, this._partChars).part(1).text;
    return LookupReply.ok(
      `The results page for "${this._query}" could not be split into numbered results, so here it is as text `
        + `(searched ${LookupReply.today()}):\n\n${firstPart}\n\nOpen a page from it by its full address with {"url":"https://..."}.`,
    );
  }
}

module.exports = SearchRunner;
