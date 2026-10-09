# DocsRagBuilder

`tools/build/docs-rag/DocsRagBuilder.js`

`npm run build:docs-rag` (`scripts/build-docs-rag.js`): builds the
documentation knowledge base the app ships, so the chat can search the docs
offline. The output, `dist/docs-rag/docs-rag.db`, is a self-contained SQLite
file in the [RagSchema](../../../core/rag/RagSchema.md) layout (documents,
chunks, FTS5 index) under the scope `docs:lumabrowser`, plus the
[PrebuiltRagMeta](../../../core/rag/PrebuiltRagMeta.md) table. electron-builder
copies it to `resources/docs-rag/docs-rag.db` (`extraResources`, see
[Packaging](../Packaging.md)) and the app opens it through
[ReadOnlyRagStore](../../../core/rag/ReadOnlyRagStore.md).

The pages come from [DocsPageSet](DocsPageSet.md): exactly the pages the prod
mirror ships, scrubbed the same way. Each page is one document (`filename` is
its path inside `Documentation/`, e.g. `core/rag/RagStore.md`; `sha256` is the
scrubbed text) chunked by [TextChunker](../../../core/rag/TextChunker.md) at
its default budget (`ChunkBudget.BUDGET_TOKENS`, 384 tokens, stamped as
`chunkTokens`). Every chunk starts with the page path on its own line (then the
chunk's heading trail when it starts mid-section), so the
folder and file names are FTS tokens and a search for a class name lands on its
page; `charStart`/`charEnd` refer to the page text. Embeddings are not
computed (BM25 only, like the rest of the knowledge base until
[RagEmbedder](../../../core/rag/RagEmbedder.md) is wired).

The build writes `<out>.building` first, finishes it (FTS `optimize`, journal
mode `DELETE` so no `-wal`/`-shm` sidecars are needed and a read-only install
folder can open it, `VACUUM`) and then moves it over the previous file, so a
failed build never leaves a half-written index. The real docs (about 3,250
pages) build in a few seconds to roughly 8 MB.

## Methods

- `new DocsRagBuilder({ rootDir, outPath?, pageSet?, version?, log? })`:
  `outPath` defaults to `defaultOutPath(rootDir)`, `pageSet` to a
  `DocsPageSet` over `rootDir`, `version` to `package.json`'s.
- `run()` returns `{ outPath, documents, chunks, skipped, contentHash, bytes }`.
  `skipped` lists pages with no text and pages whose text duplicates an earlier
  page (the schema dedups per scope by hash). Throws when the page set is empty.
- `DocsRagBuilder.chunk(rel, text)` returns the path-prefixed chunks of one page.
- `DocsRagBuilder.contentHash(pages)`: sha256 over every page path and content
  hash, stamped into the metadata as `contentHash` so the app can tell a rebuilt
  index from a changed one.
- `DocsRagBuilder.defaultOutPath(rootDir)`: `<rootDir>/dist/docs-rag/docs-rag.db`.
- `DocsRagBuilder.SCOPE` (`docs:lumabrowser`), `DB_NAME`, `CHUNK_TOKENS`.

## Metadata written

`scope`, `contentHash`, `builtAt` (ISO), `appVersion`, `documents`, `chunks`,
`chunkTokens`.

## Why

The docs are excluded from `app.asar`, and better-sqlite3 cannot open a file
inside an archive anyway, so the index is a build artifact in `extraResources`
rather than something the app computes at first launch. Building from the prod
page set keeps the index honest: it never knows more than the mirrored docs.
