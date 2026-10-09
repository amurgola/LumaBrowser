# RagEmbedder

`core/rag/RagEmbedder.js`

The process-wide seam where a dense embedder plugs into RAG. RAG ships
lexical-only retrieval (BM25 via SQLite FTS5); dense retrieval needs an
embedding model the build does not have yet. Until one is registered, `embed`
returns null and the hybrid path degrades to lexical-only (RRF fuses whatever
is available), so callers never change.

## Methods

- `RagEmbedder.set(fn)` registers `fn(texts: string[]) => Promise<number[][]>`;
  anything that is not a function clears it.
- `RagEmbedder.isConfigured()` whether dense embeddings are available this run.
- `RagEmbedder.embed(texts)` the vectors, or null when there is no embedder, the
  input is empty or not an array, the call throws, or the reply's length does not
  match the input. A failed embed never breaks ingest or search.

## Future dense path

Documented, not wired: launch an embedding-capable llama-server with
`--embeddings` and POST `{ input: texts }` to `/v1/embeddings` (llama-server's OpenAI-compatible
embeddings endpoint), then register it with `set`.
