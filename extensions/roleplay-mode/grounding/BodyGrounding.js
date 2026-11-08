const path = require('path');
const GroundingScope = require('./GroundingScope');
const BodySignals = require('./BodySignals');

class BodyGrounding {
  static SCOPE = 'roleplay:body';
  static PACK = 'body';
  static PACK_DIR = path.join(__dirname, 'packs', 'body');
  static PER_CHARACTER = 3;
  static CANDIDATES = 12;
  static SYNTHETIC_WEIGHT = 3;
  static SECONDARY_MIN_HITS = 2;
  static CACHE_MAX = 200;

  constructor({ rag = null, cards = null, Retriever = null } = {}) {
    this._scope = new GroundingScope({ scope: BodyGrounding.SCOPE, dir: BodyGrounding.PACK_DIR, pack: BodyGrounding.PACK, rag, cards, Retriever });
    this._cache = new Map();
  }

  static shared() {
    if (!BodyGrounding._shared) BodyGrounding._shared = new BodyGrounding();
    return BodyGrounding._shared;
  }

  static enabled(data) {
    return !(data && data.options && data.options.bodyGrounding === false);
  }

  rag() {
    return this._scope.rag();
  }

  cards() {
    return this._scope.cards();
  }

  sync() {
    return this._scope.sync().then((r) => { if (r && (r.added || r.removed)) this._cache.clear(); return r; });
  }

  async forCast(characters) {
    const out = {};
    try {
      if (!this.rag()) return out;
      await this.sync();
      for (const c of characters || []) {
        if (!c || !c.id) continue;
        const notes = await this.forCharacter(c);
        if (notes.length) out[c.id] = notes;
      }
    } catch (_) {}
    return out;
  }

  async forCharacter(c) {
    const text = BodyGrounding.describe(c);
    if (!text) return [];
    const synthetic = BodySignals.tags(text);
    const query = [text].concat(synthetic).join(' ');
    if (this._cache.has(query)) return this._cache.get(query);
    const ranked = await this._scope.search(query, BodyGrounding.CANDIDATES);
    const lower = GroundingScope.padded(text);
    const scored = [];
    for (const { card, rank } of ranked) {
      const hits = BodyGrounding.tagHits(card, lower, synthetic);
      if (hits > 0) scored.push({ card, hits, rank });
    }
    scored.sort((a, b) => (b.hits - a.hits) || (a.rank - b.rank));
    const groups = new Set();
    const seen = new Set();
    const notes = [];
    for (const s of scored) {
      if (seen.has(s.card.id) || (s.card.group && groups.has(s.card.group))) continue;
      if (notes.length && s.hits < BodyGrounding.SECONDARY_MIN_HITS) continue;
      seen.add(s.card.id);
      if (s.card.group) groups.add(s.card.group);
      notes.push({ id: s.card.id, title: s.card.title, body: s.card.body });
      if (notes.length >= BodyGrounding.PER_CHARACTER) break;
    }
    if (this._cache.size >= BodyGrounding.CACHE_MAX) this._cache.delete(this._cache.keys().next().value);
    this._cache.set(query, notes);
    return notes;
  }

  static tagHits(card, paddedLower, synthetic) {
    return GroundingScope.hits(card.tags, paddedLower, synthetic, BodyGrounding.SYNTHETIC_WEIGHT);
  }

  static describe(c) {
    const p = (c && c.profile) || {};
    return [c && c.description, c && c.appearance, p.summary, p.appearance]
      .map((x) => String(x || '').trim()).filter(Boolean).join('. ');
  }
}

module.exports = BodyGrounding;
