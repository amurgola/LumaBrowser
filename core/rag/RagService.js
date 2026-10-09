const path = require('path');
const KnowledgeLookup = require('./KnowledgeLookup');
const RagFileIngestor = require('./RagFileIngestor');
const RagStore = require('./RagStore');

class RagService {
  static DEFAULT_SCOPE = 'kb';

  static DEFAULT_K = 5;

  constructor({ dataDir, dbPath } = {}) {
    this._dbPath = dbPath || path.join(dataDir || '.', 'rag', 'rag.db');
    this._store = null;
  }

  get store() {
    if (!this._store) this._store = new RagStore({ dbPath: this._dbPath });
    return this._store;
  }

  async ingestFile(filePath, { scope = RagService.DEFAULT_SCOPE } = {}) {
    try {
      return await new RagFileIngestor(this.store).ingest(filePath, scope);
    } catch (err) {
      return { success: false, error: `Ingest failed: ${err.message}` };
    }
  }

  async search(query, { scope = RagService.DEFAULT_SCOPE, k = RagService.DEFAULT_K } = {}) {
    try {
      return await KnowledgeLookup.lookup(this.store, query, { scope, k });
    } catch (err) {
      return { found: false, rendered: '', sources: [], message: `Knowledge-base search failed: ${err.message}` };
    }
  }

  documentsInScope(scope = RagService.DEFAULT_SCOPE) {
    return this.store.documentsInScope(scope);
  }

  removeDocument(id) {
    return this.store.removeDocument(id);
  }

  count(scope = RagService.DEFAULT_SCOPE) {
    return this.store.count(scope);
  }

  close() {
    if (this._store) this._store.close();
  }
}

module.exports = RagService;
