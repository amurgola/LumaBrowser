const LookupReply = require('./LookupReply');
const SearchEngine = require('./SearchEngine');
const UrlIdentity = require('./UrlIdentity');

class ResultList {
  static GUIDE = 'How to use these: they are previews from search pages and may come from old pages, so check '
    + 'dates against today before quoting a figure. Open a result in full by its number, e.g. {"url":"1"} (never '
    + 'retype the address); add "find":"<term>" to land on one fact, or "part":2 to keep reading a long page.';

  constructor(limit = SearchEngine.RESULT_LIMIT) {
    this._limit = limit;
    this._rows = [];
  }

  add(rows) {
    let added = 0;
    for (const row of rows || []) {
      if (this._rows.length >= this._limit) break;
      if (this._rows.some((known) => UrlIdentity.same(known.url, row.url))) continue;
      this._rows.push(row);
      added++;
    }
    return added;
  }

  size() {
    return this._rows.length;
  }

  rows() {
    return this._rows.slice();
  }

  reply(query) {
    const listing = this._rows.map((row, i) => `${i + 1}. ${row.title}\n   ${row.url}${row.snippet ? `\n   ${row.snippet}` : ''}`);
    const message = `Search results for "${query}" (searched ${LookupReply.today()}):\n\n${listing.join('\n\n')}\n\n${ResultList.GUIDE}`;
    return LookupReply.ok(message, { results: this.rows() });
  }
}

module.exports = ResultList;
