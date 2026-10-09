# RagService

`core/rag/RagService.js`

The app-wide knowledge base (RAG) service. Owns one lazily opened
[RagStore](RagStore.md) and exposes ingest, search and document management to
the chat agent, [RagIpcHandlers](RagIpcHandlers.md) and extensions.

## Methods

- `new RagService({ dataDir?, dbPath? })`: the store lives at
  `<dataDir>/rag/rag.db` (`dataDir` defaults to `.`) unless `dbPath` is given
  (`':memory:'` works). Nothing is opened yet.
- `store` (getter) opens the store on first use and keeps it. Extensions read it
  directly (agent-manager's knowledge-base export and import).
- `ingestFile(filePath, { scope = 'kb' })` resolves
  `{ success, documentId?, chunks?, deduped?, error? }` through
  [RagFileIngestor](RagFileIngestor.md). A store that cannot open is
  `Ingest failed: <message>`.
- `search(query, { scope = 'kb', k = 5 })` resolves
  [KnowledgeLookup](KnowledgeLookup.md)`.lookup` output
  `{ found, rendered, sources, message }`; any failure is
  `{ found: false, rendered: '', sources: [], message: 'Knowledge-base search failed: <message>' }`.
- `documentsInScope(scope = 'kb')`, `removeDocument(id)`, `count(scope = 'kb')`
  pass through to the store.
- `close()` closes the store if it was opened.
- `RagService.DEFAULT_SCOPE` (`'kb'`), `RagService.DEFAULT_K` (5).

## Why

Opening lazily means boot never blocks on SQLite. Retrieval is lexical first
(BM25); dense retrieval switches on by itself once an embedder is registered
with [RagEmbedder](RagEmbedder.md), with no caller change. Scopes keep the
global knowledge base apart from per-agent ones (`agent:<id>`) and extension
scopes.
