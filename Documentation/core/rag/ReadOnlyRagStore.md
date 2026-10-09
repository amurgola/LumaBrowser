# ReadOnlyRagStore

`core/rag/ReadOnlyRagStore.js`

A [RagStore](RagStore.md) over a prebuilt, read-only knowledge base: the
database a build step produced ([DocsRagBuilder](../../tools/build/docs-rag/DocsRagBuilder.md),
shipped as `resources/docs-rag/docs-rag.db`). The file is opened with
`readOnly` through [SqliteOpener](../database/SqliteOpener.md): no WAL switch,
no schema run, nothing written, so it works from an install folder the app
cannot write to. The read queries are RagStore's; the write methods throw.

Its scope comes from the [PrebuiltRagMeta](PrebuiltRagMeta.md) table, and
[KnowledgeLookup](KnowledgeLookup.md) reads `store.scope`, so a search
over the docs needs no scope argument.

## Methods

- `new ReadOnlyRagStore({ dbPath, db? })`: `dbPath` must exist (a missing file
  throws rather than creating an empty database); a file that is not a database
  throws too, with the handle closed first. `db` is an injectable read-only
  handle.
- `ReadOnlyRagStore.openIfPresent(dbPath)` returns `null` when there is no file
  at `dbPath` (the index was not built), otherwise an open store.
- `scope`: the scope the index was built for (`meta.scope`), `'kb'` for a
  database without metadata.
- `meta()`: a copy of the prebuilt metadata (`scope`, `contentHash`, `builtAt`,
  `appVersion`, `documents`, `chunks`, `chunkTokens`; string values), `{}` if none.
- `count(scope = this.scope)`, `documentsInScope(scope = this.scope)`.
- `findKeywordPassages`, `getChunks`, `denseCandidates`, `exportDocuments`, `close`:
  inherited.
- `addDocument`, `addChunks`, `removeDocument` throw
  `ReadOnlyRagStore.<method>: this knowledge base is read-only.`

## Why

The user's own `rag.db` and a shipped index must never mix: a prebuilt file is
replaced wholesale by the next app version, and dedup by hash would otherwise
let user documents collide with doc pages. Keeping it a separate read-only
handle also means a corrupt or missing index can only disable the docs search,
never the user's knowledge base.
