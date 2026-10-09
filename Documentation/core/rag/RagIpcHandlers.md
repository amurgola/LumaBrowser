# RagIpcHandlers

`core/rag/RagIpcHandlers.js`

IPC controller for the knowledge base (RAG) management UI. The chat agent uses
RagService directly through agentDeps; these channels back the UI. Each handler
is wrapped by `IpcEnvelope.enveloped`, so a throw replies `{ success: false, error }`.

## Methods

- `new RagIpcHandlers(ragService, { getMainWindow? })`.
- `register()` registers (scope defaults to `kb`):
  - `core.rag.pickAndIngest` -> `RagDocumentImporter.pickAndIngest()`
  - `core.rag.ingest({ path | paths, scope })` -> `RagDocumentImporter.ingest`
  - `core.rag.list({ scope })` -> `{ documents: ragService.documentsInScope(scope) }`
  - `core.rag.remove({ id })` -> `ragService.removeDocument(id)`; `{ success: false, error: 'id is required.' }` without an id
  - `core.rag.count({ scope })` -> `{ count: ragService.count(scope) }`
  - `core.rag.search({ query, scope, k = 5 })` -> `{ success: true, ...ragService.search(query, { scope, k }) }` (debug / preview)
