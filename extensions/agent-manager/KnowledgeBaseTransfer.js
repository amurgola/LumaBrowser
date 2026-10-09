const AgentKnowledgeBase = require('./AgentKnowledgeBase');
const EmbeddingVector = require('../../core/rag/EmbeddingVector');

class KnowledgeBaseTransfer {
  constructor(knowledge) {
    this._knowledge = knowledge;
  }

  export(agentId) {
    const store = this._store('exportDocuments');
    if (!store) return [];
    try {
      return store.exportDocuments(AgentKnowledgeBase.scopeFor(agentId)).map((d) => KnowledgeBaseTransfer._exportDocument(d));
    } catch (_) {
      return [];
    }
  }

  import(agentId, documents) {
    const store = this._store('addDocument');
    if (!store) return null;
    const scope = AgentKnowledgeBase.scopeFor(agentId);
    const out = { documents: 0, chunks: 0, skipped: 0 };
    for (const doc of (Array.isArray(documents) ? documents : [])) KnowledgeBaseTransfer._importDocument(store, scope, doc, out);
    return out;
  }

  _store(method) {
    const rag = this._knowledge.ragService();
    return rag && rag.store && typeof rag.store[method] === 'function' ? rag.store : null;
  }

  static _exportDocument(d) {
    return {
      ...d,
      chunks: d.chunks.map((c) => ({ ...c, embedding: c.embedding ? Buffer.from(c.embedding).toString('base64') : null })),
    };
  }

  static _importDocument(store, scope, doc, out) {
    if (!doc || !doc.sha256 || !Array.isArray(doc.chunks)) {
      out.skipped++;
      return;
    }
    const { id, deduped } = store.addDocument({
      scope, filename: doc.filename || null, sha256: String(doc.sha256), pages: doc.pages || 0, created: doc.created || null,
    });
    if (deduped) {
      out.skipped++;
      return;
    }
    out.chunks += store.addChunks(id, scope, KnowledgeBaseTransfer._chunks(doc.chunks));
    out.documents++;
  }

  static _chunks(chunks) {
    return chunks
      .filter((c) => c && typeof c.text === 'string' && c.text)
      .map((c) => ({
        page: c.page || 1,
        text: c.text,
        charStart: c.charStart ?? null,
        charEnd: c.charEnd ?? null,
        embedding: c.embedding ? EmbeddingVector.unpack(Buffer.from(c.embedding, 'base64')) : null,
      }));
  }
}

module.exports = KnowledgeBaseTransfer;
