const ChatToolHandler = require('./ChatToolHandler');

class KnowledgeBaseHandler extends ChatToolHandler {
  static UNAVAILABLE = 'The knowledge base is not available on this build.';

  names() {
    return ['search_knowledge_base'];
  }

  async execute(_name, params, ctx) {
    const rag = ctx.deps.ragService;
    if (!rag) return { success: false, error: KnowledgeBaseHandler.UNAVAILABLE };
    const res = await rag.search(params && (params.query || params.q), { scope: ctx.kbScope });
    KnowledgeBaseHandler._emitCitations(res, ctx.hooks);
    return { success: true, found: res.found, message: res.message };
  }

  static _emitCitations(res, hooks) {
    if (!res.found || !res.sources || !res.sources.length || !hooks.onAgentEvent) return;
    try { hooks.onAgentEvent({ type: 'citations', payload: { sources: res.sources } }); } catch (_) {}
  }
}

module.exports = KnowledgeBaseHandler;
