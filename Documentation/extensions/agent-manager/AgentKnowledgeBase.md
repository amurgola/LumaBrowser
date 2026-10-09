# AgentKnowledgeBase

`extensions/agent-manager/AgentKnowledgeBase.js`

Each agent's private knowledge base: scope `agent:<id>` in the app-wide
[RagService](../../core/rag/RagService.md) published on `global.__lumaRagService`.

## Methods

- `AgentKnowledgeBase.scopeFor(agentId)` -> `'agent:<id>'`.
- `new AgentKnowledgeBase({ getRagService })` (lazy global by default).
- `ragService()`, `requireRag()` (throws "The knowledge base service is not available on this build").
- `count(agentId)` (0) and `documents(agentId)` ([]) never throw.
- `ingest(agentId, paths)` -> `[{ path, ...ingestFile result }]`, one file after another.
- `removeDocument(agentId, docId)`: only a document in THIS agent's scope
  ("Document not found in this agent's knowledge base"); returns the remaining documents.
- `purge(agentId)` removes the whole scope, best effort; returns the count.
