# RagFileIngestor

`core/rag/RagFileIngestor.js`

Ingests one file into a knowledge base scope of a [RagStore](RagStore.md).

## Methods

- `new RagFileIngestor(store)`.
- `ingest(filePath, scope)` resolves `{ success, documentId?, chunks?, deduped?, error? }`
  and never rejects:
  1. Missing path or file: `File not found: <path>`. Unsupported extension:
     `Unsupported file type. Supported: .md, .markdown, ...` (from
     [DocumentParser](DocumentParser.md)`.supportedExtensions()`).
  2. The file's SHA-256 already stored in this scope:
     `{ success: true, documentId, chunks: 0, deduped: true }`.
  3. `DocumentParser.parse`; no pages: `No extractable text in that file.`
  4. [TextChunker](TextChunker.md)`.chunkDocument`; no chunks: `File parsed but produced no chunks.`
  5. When [RagEmbedder](RagEmbedder.md) is configured, each chunk gets its vector
     (a null reply leaves them lexical-only).
  6. `addDocument({ scope, filename: basename, sha256, pages })` and `addChunks`:
     `{ success: true, documentId, chunks: <count>, deduped: false }`.
  Any thrown error becomes `Ingest failed: <message>`.

## Why

Content-hash dedup makes re-ingesting the same file a no-op, which lets
extensions seed their scopes on every activation. The hash is per scope, so the
same file can live in the global and an agent's knowledge base.
