# KnowledgeBaseTransfer

`extensions/agent-manager/KnowledgeBaseTransfer.js`

Moves an agent's knowledge base in and out of an export bundle. The RAG store
keeps no uploaded files, so the chunks are the knowledge.

## Methods

- `new KnowledgeBaseTransfer(knowledge)` (an [AgentKnowledgeBase](AgentKnowledgeBase.md)).
- `export(agentId)` -> `RagStore.exportDocuments(scope)` with each chunk's
  embedding as base64 float32; `[]` without the service or store, or on failure.
- `import(agentId, documents)` -> `{ documents, chunks, skipped }` replayed into
  the agent's scope (`addDocument`, `addChunks`; embeddings via
  `EmbeddingVector.unpack`); documents without `sha256` or chunks, or deduped by
  `(scope, sha256)`, count as skipped. Null when the store is unavailable, so
  callers warn instead of silently dropping.
