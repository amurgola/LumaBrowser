const CoreRequire = require('../CoreRequire');
const GroundingCards = require('./GroundingCards');

class GroundingScope {
  constructor({ scope, dir, pack, rag = null, cards = null, Retriever = null } = {}) {
    this.scope = scope;
    this._dir = dir;
    this._pack = pack;
    this._rag = rag;
    this._cards = cards;
    this._Retriever = Retriever;
    this._synced = null;
  }

  rag() {
    const rag = this._rag || global.__lumaRagService;
    return rag && rag.store ? rag : null;
  }

  cards() {
    if (!this._cards) this._cards = GroundingCards.load(this._dir, this._pack);
    return this._cards;
  }

  card(id) {
    if (!this._byId) this._byId = new Map(this.cards().map((c) => [c.id, c]));
    return this._byId.get(id) || null;
  }

  sync() {
    if (!this.rag()) return Promise.resolve(null);
    if (!this._synced) this._synced = Promise.resolve().then(() => this._syncNow()).catch(() => { this._synced = null; return null; });
    return this._synced;
  }

  _syncNow() {
    const store = this.rag().store;
    const cards = this.cards();
    const wanted = new Set(cards.map((c) => c.sha256));
    let removed = 0;
    for (const doc of store.documentsInScope(this.scope)) {
      const row = store.db.prepare('SELECT sha256 FROM documents WHERE id = ?').get(doc.id);
      if (!row || !wanted.has(row.sha256)) { store.removeDocument(doc.id); removed += 1; }
    }
    let added = 0;
    for (const card of cards) {
      const { id, deduped } = store.addDocument({ scope: this.scope, filename: card.id, sha256: card.sha256, pages: 1 });
      if (deduped) continue;
      store.addChunks(id, this.scope, [{ page: 1, text: card.text, charStart: 0, charEnd: card.text.length }]);
      added += 1;
    }
    return { added, removed, total: cards.length };
  }

  async search(query, limit) {
    const Retriever = this._Retriever || CoreRequire.require('rag/KnowledgeRetriever');
    const passages = await Retriever.retrieve(this.rag().store, this.scope, query, limit);
    const out = [];
    passages.forEach((p, rank) => {
      const card = this.card(p.filename);
      if (card) out.push({ card, rank });
    });
    return out;
  }

  static hits(phrases, paddedLower, synthetic = [], weight = 1) {
    let hits = 0;
    for (const tag of phrases || []) {
      if (synthetic.includes(tag)) { hits += weight; continue; }
      const phrase = ' ' + tag.replace(/[^a-z0-9']+/g, ' ').trim() + ' ';
      if (phrase.trim() && paddedLower.includes(phrase)) hits += 1;
    }
    return hits;
  }

  static padded(text) {
    return ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9']+/g, ' ') + ' ';
  }
}

module.exports = GroundingScope;
