# RagStore

`core/rag/RagStore.js`

Repository for the knowledge base SQLite database (schema in
[RagSchema](RagSchema.md)). Plain SQL only.

## Methods

- `new RagStore({ dbPath, db, readOnly = false })`: uses an injected
  better-sqlite3 handle, or opens `dbPath` through
  [SqliteOpener](../database/SqliteOpener.md) with `mkdir: true` (`':memory:'`
  works). Throws `RagStore needs a dbPath or an injected db.` with neither.
  Sets WAL and ensures the schema. With `readOnly` the file is opened as it is
  (SqliteOpener's `readOnly`, so it must exist) and neither happens; that is
  how [ReadOnlyRagStore](ReadOnlyRagStore.md) opens a prebuilt index. The
  handle is public as `db`.
- `getDocumentByHash(scope, sha256)` returns the document row or `null`.
- `addDocument({ scope = 'kb', filename, sha256, pages = 0, created })` returns
  `{ id, deduped }`; the same `sha256` in the same scope returns the existing
  id with `deduped: true`. `created` defaults to now.
- `addChunks(docId, scope, chunks)` inserts `[{ page, text, charStart, charEnd, embedding? }]`
  in one transaction and returns the count. Missing page is 1, missing offsets
  are null, `embedding` (number[]) is stored with `EmbeddingVector.pack`.
- `findKeywordPassages(scope, query, limit = LEXICAL_ROW_LIMIT)` returns
  `[{ id, docId, page, text, filename, rank }]` by BM25, best first. `query` is
  free text compiled by [LexicalMatchExpression](LexicalMatchExpression.md);
  `[]` when it has no searchable words. `LEXICAL_ROW_LIMIT` (40) only applies
  to callers that pass no limit (tests, extensions):
  [KnowledgeRetriever](KnowledgeRetriever.md) always passes its own pool size,
  and 40 matches its pool for the default five results.
- `getChunks(ids)` returns `[{ id, docId, page, text, charStart, charEnd, filename }]`,
  order not guaranteed.
- `denseCandidates(scope)` returns `[{ id, embedding: number[] }]` for chunks with an embedding.
- `exportDocuments(scope = 'kb')` returns `[{ filename, sha256, pages, created, chunks: [{ page, text, charStart, charEnd, embedding }] }]`
  (oldest first; raw embedding BLOBs). Replayable through `addDocument` + `addChunks`.
- `documentsInScope(scope = 'kb')` returns `[{ id, filename, pages, created, chunks }]`, newest first.
- `removeDocument(id)` deletes the document and its chunks; returns `{ success: true }`.
- `count(scope = 'kb')` counts documents.
- `close()` closes the handle; never throws.
- `RagStore.DEFAULT_SCOPE` (`'kb'`).

## Why

Content-hash dedup per scope makes re-ingesting the same file a no-op. WAL is
set again in the constructor because an injected handle may not have come
through SqliteOpener. The busy timeout is SqliteOpener's 5000 ms, which
better-sqlite3 also defaults to, so legacy behaviour is unchanged.
