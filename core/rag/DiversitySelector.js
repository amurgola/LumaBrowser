const PassageSimilarity = require('./PassageSimilarity');

class DiversitySelector {
  static RELEVANCE_BALANCE = 0.7;

  static select(candidates, limit) {
    return new DiversitySelector(candidates, limit).execute();
  }

  constructor(candidates, limit) {
    this._remaining = [...(candidates || [])];
    this._limit = Math.max(0, limit || 0);
    this._documentCap = Math.max(1, Math.ceil(this._limit / 2));
    this._picked = [];
    this._perDocument = new Map();
  }

  execute() {
    while (this._picked.length < this._limit && this._remaining.length) this._pick(this._nextBest());
    return this._picked;
  }

  _nextBest() {
    const open = this._remaining.filter((candidate) => this._countFor(candidate.docId) < this._documentCap);
    return this._highestMarginal(open.length ? open : this._remaining);
  }

  _highestMarginal(pool) {
    let best = pool[0];
    let bestValue = -Infinity;
    for (const candidate of pool) {
      const value = this._marginalValue(candidate);
      if (value > bestValue) [best, bestValue] = [candidate, value];
    }
    return best;
  }

  _marginalValue(candidate) {
    const balance = DiversitySelector.RELEVANCE_BALANCE;
    return balance * candidate.relevance - (1 - balance) * this._redundancy(candidate);
  }

  _redundancy(candidate) {
    return this._picked.reduce((worst, picked) => Math.max(worst, PassageSimilarity.between(candidate, picked)), 0);
  }

  _pick(candidate) {
    this._picked.push(candidate);
    this._remaining.splice(this._remaining.indexOf(candidate), 1);
    this._perDocument.set(candidate.docId, this._countFor(candidate.docId) + 1);
  }

  _countFor(docId) {
    return this._perDocument.get(docId) || 0;
  }
}

module.exports = DiversitySelector;
