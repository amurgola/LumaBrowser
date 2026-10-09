class AgentKnowledgeBase {
  static SCOPE_PREFIX = 'agent:';

  static scopeFor(agentId) {
    return AgentKnowledgeBase.SCOPE_PREFIX + agentId;
  }

  constructor({ getRagService = () => global.__lumaRagService || null } = {}) {
    this._getRagService = getRagService;
  }

  ragService() {
    return this._getRagService();
  }

  requireRag() {
    const rag = this.ragService();
    if (!rag) throw new Error('The knowledge base service is not available on this build');
    return rag;
  }

  count(agentId) {
    const rag = this.ragService();
    try { return rag ? rag.count(AgentKnowledgeBase.scopeFor(agentId)) : 0; } catch (_) { return 0; }
  }

  documents(agentId) {
    const rag = this.ragService();
    try { return rag ? rag.documentsInScope(AgentKnowledgeBase.scopeFor(agentId)) : []; } catch (_) { return []; }
  }

  async ingest(agentId, paths) {
    const rag = this.requireRag();
    const results = [];
    for (const filePath of paths) {
      results.push({ path: filePath, ...(await rag.ingestFile(filePath, { scope: AgentKnowledgeBase.scopeFor(agentId) })) });
    }
    return results;
  }

  removeDocument(agentId, docId) {
    const rag = this.requireRag();
    const doc = this.documents(agentId).find((d) => d.id === Number(docId));
    if (!doc) throw new Error("Document not found in this agent's knowledge base");
    rag.removeDocument(doc.id);
    return this.documents(agentId);
  }

  purge(agentId) {
    const rag = this.ragService();
    if (!rag) return 0;
    let removed = 0;
    try {
      for (const d of rag.documentsInScope(AgentKnowledgeBase.scopeFor(agentId))) {
        rag.removeDocument(d.id);
        removed++;
      }
    } catch (_) {}
    return removed;
  }
}

module.exports = AgentKnowledgeBase;
