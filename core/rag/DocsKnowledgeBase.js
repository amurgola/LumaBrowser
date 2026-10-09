const path = require('path');
const KnowledgeLookup = require('./KnowledgeLookup');
const ReadOnlyRagStore = require('./ReadOnlyRagStore');

class DocsKnowledgeBase {
  static NAME = 'LumaBrowser documentation';
  static DIR = 'docs-rag';
  static FILE = 'docs-rag.db';
  static DEFAULT_K = 5;

  static resolvePath({ isPackaged, resourcesPath, rootDir }) {
    if (isPackaged && resourcesPath) return path.join(resourcesPath, DocsKnowledgeBase.DIR, DocsKnowledgeBase.FILE);
    return path.join(rootDir || '.', 'dist', DocsKnowledgeBase.DIR, DocsKnowledgeBase.FILE);
  }

  constructor({ dbPath, store } = {}) {
    this._dbPath = dbPath || null;
    this._store = store || null;
    this._opened = !!store;
  }

  get store() {
    if (this._opened) return this._store;
    this._opened = true;
    try {
      this._store = ReadOnlyRagStore.openIfPresent(this._dbPath);
    } catch (_) {
      this._store = null;
    }
    return this._store;
  }

  available() {
    return !!this.store;
  }

  status() {
    const store = this.store;
    if (!store) return { available: false, name: DocsKnowledgeBase.NAME };
    const meta = store.meta();
    return {
      available: true,
      name: DocsKnowledgeBase.NAME,
      documents: Number(meta.documents) || store.count(),
      chunks: Number(meta.chunks) || 0,
      builtAt: meta.builtAt || null,
      appVersion: meta.appVersion || null,
      contentHash: meta.contentHash || null,
    };
  }

  async search(query, { k = DocsKnowledgeBase.DEFAULT_K } = {}) {
    const store = this.store;
    if (!store) return { found: false, rendered: '', sources: [], message: `${DocsKnowledgeBase.NAME} is not available on this build.` };
    try {
      return await KnowledgeLookup.lookup(store, query, { k });
    } catch (err) {
      return { found: false, rendered: '', sources: [], message: `Documentation search failed: ${err.message}` };
    }
  }

  close() {
    if (this._store) this._store.close();
    this._store = null;
    this._opened = false;
  }
}

module.exports = DocsKnowledgeBase;
