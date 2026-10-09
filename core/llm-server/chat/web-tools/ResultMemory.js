const EditDistance = require('./EditDistance');
const UrlIdentity = require('./UrlIdentity');

class ResultMemory {
  static NEAR_MATCH_POOL = 40;

  constructor() {
    this._latest = [];
    this._pool = [];
  }

  remember(rows) {
    const usable = (rows || []).filter((row) => row && typeof row.url === 'string' && row.url);
    if (!usable.length) return;
    this._latest = usable.map((row) => ({ title: row.title || '', url: row.url }));
    this._addToPool(this._latest);
  }

  byNumber(n) {
    return Number.isInteger(n) && n >= 1 && n <= this._latest.length ? this._latest[n - 1] : null;
  }

  count() {
    return this._latest.length;
  }

  nearest(url) {
    const target = UrlIdentity.key(url);
    if (!target) return null;
    return this._pool.reduce((best, row) => {
      const similarity = EditDistance.similarity(target, UrlIdentity.key(row.url));
      return !best || similarity > best.similarity ? { ...row, similarity } : best;
    }, null);
  }

  _addToPool(rows) {
    for (const row of rows) {
      if (!this._pool.some((known) => UrlIdentity.same(known.url, row.url))) this._pool.push(row);
    }
    const excess = this._pool.length - ResultMemory.NEAR_MATCH_POOL;
    if (excess > 0) this._pool.splice(0, excess);
  }
}

module.exports = ResultMemory;
