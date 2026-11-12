const CatalogUrlCollector = require('./CatalogUrlCollector');
const UrlHeadProbe = require('./UrlHeadProbe');

class CatalogUrlVerifier {
  static CONCURRENCY = 4;
  static GIB = 1024 ** 3;

  constructor({ rows = null, probe = (url) => UrlHeadProbe.head(url), log = console.log, error = console.error,
    concurrency = CatalogUrlVerifier.CONCURRENCY } = {}) {
    this._rows = rows;
    this._probe = probe;
    this._log = log;
    this._error = error;
    this._concurrency = concurrency;
  }

  async execute(args = []) {
    const rows = this._rows || CatalogUrlCollector.collect();
    if (args.includes('--list')) return this._list(rows);
    this._log(`Checking ${rows.length} catalog URLs…\n`);
    const failures = await this._checkAll(rows);
    this._log(failures ? `\n${failures} of ${rows.length} URLs failed.` : `\nAll ${rows.length} URLs resolve.`);
    return failures ? 1 : 0;
  }

  _list(rows) {
    for (const row of rows) this._log(`  [${row.catalog}] ${row.model} · ${row.file}  ${row.url}`);
    this._log(`\n${rows.length} catalog URLs.`);
    return 0;
  }

  async _checkAll(rows) {
    const queue = rows.slice();
    let failures = 0;
    const worker = async () => {
      while (queue.length) {
        if (!(await this._checkOne(queue.shift()))) failures += 1;
      }
    };
    await Promise.all(Array.from({ length: this._concurrency }, worker));
    return failures;
  }

  async _checkOne(row) {
    const r = await this._probe(row.url);
    if (r.ok) {
      const size = r.length ? (Number(r.length) / CatalogUrlVerifier.GIB).toFixed(2) + ' GB' : '?';
      this._log(`  OK   [${row.catalog}] ${row.model} · ${row.file} (${size})`);
      return true;
    }
    this._error(`  FAIL [${row.catalog}] ${row.model} · ${row.file} → ${r.status || r.error}`);
    this._error(`       ${row.url}`);
    return false;
  }
}

module.exports = CatalogUrlVerifier;
