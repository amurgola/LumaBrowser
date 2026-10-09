# EmbeddingVector

`core/rag/EmbeddingVector.js`

Embedding vector maths and BLOB storage.

## Methods

- `EmbeddingVector.cosine(a, b)` cosine similarity; 0 for missing, different-length
  or zero vectors, so a bad vector simply ranks last.
- `EmbeddingVector.pack(vector)` a float32 `Buffer` for a SQLite BLOB, or null for a non-array.
- `EmbeddingVector.unpack(buffer)` back to `number[]` (float32 precision), or null
  for an empty buffer. Trailing bytes that do not make a whole float are ignored.
