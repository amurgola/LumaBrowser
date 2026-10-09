const AgentKnowledgeBase = require('./AgentKnowledgeBase');

class AgentKnowledgeGrant {
  static SEARCH_TOOL = 'search_knowledge_base';

  static forTurn(agent, ragService) {
    const kbScope = AgentKnowledgeBase.scopeFor(agent.id);
    const allowedTools = Array.isArray(agent.tools) ? agent.tools.filter((t) => typeof t === 'string') : [];
    const persona = agent.systemPrompt || null;
    const docs = AgentKnowledgeGrant._documents(ragService, kbScope);
    if (!docs.length) return { kbScope, allowedTools, modeSystemPrompt: persona };
    if (!allowedTools.includes(AgentKnowledgeGrant.SEARCH_TOOL)) allowedTools.push(AgentKnowledgeGrant.SEARCH_TOOL);
    const note = AgentKnowledgeGrant._note(docs);
    return { kbScope, allowedTools, modeSystemPrompt: persona ? persona + '\n\n' + note : note };
  }

  static _documents(ragService, kbScope) {
    try {
      return ragService && ragService.count(kbScope) > 0 ? (ragService.documentsInScope(kbScope) || []) : [];
    } catch (_) {
      return [];
    }
  }

  static _note(docs) {
    const names = docs.map((d) => d.filename).filter(Boolean).join(', ');
    return 'You have a private knowledge base of reference documents: '
      + (names || `${docs.length} document(s)`) + '. '
      + 'Before answering anything these documents might cover, call search_knowledge_base '
      + 'with a focused query and ground your answer in the passages it returns. '
      + 'If they don\'t cover the question, say so rather than guessing.';
  }
}

module.exports = AgentKnowledgeGrant;
