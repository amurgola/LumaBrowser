# GgufHeaderCache

`core/llm-server/scanner/GgufHeaderCache.js`

Memoises parsed GGUF headers by `path|size|modifiedAt`, in memory and in a JSON
file, so a rescan or a warm boot resolves unchanged models with zero disk reads.

## Methods

- `new GgufHeaderCache({ parse, persistPath = () => '' })`; `parse(filePath)`
  resolves a [GgufParser](../GgufParser.md) result; `persistPath()` returns the
  file path or `''` (a throw counts as `''`). Resolved once, lazily.
- `get(filePath, sizeBytes, modifiedAt)` resolves the cached result or parses,
  stamping `_v = SCHEMA_VERSION` on the result. The first call hydrates from the
  file. `modifiedAt` (the walker's ISO string, or any stable stamp) is optional.
- `GgufHeaderCache.keyOf(filePath, sizeBytes, modifiedAt)` is
  `path|size|modifiedAt`, or `path|size` when no stamp was given.
- `flush()` writes the successful (`ok`) entries when anything new parsed; a
  write error is ignored and retried on the next dirty flush.
- `SCHEMA_VERSION` (10), `MAX_ENTRIES` (256, oldest evicted first).

## Why

The chat model picker reads every model's header on the first scan of each
boot; a large library made that a startup stall. Only successful parses persist
so a timeout or a momentarily locked file is retried next boot instead of frozen.
Entries of another schema are dropped on hydrate so a model re-parses once
after the parser gains fields (history in the source comment: v2 KV lengths
through v8 per-tensor byte layout, v9 header role, parameter count, chat template (v10 re-derives the role so image and video GGUFs cached as `main` become `diffusion`), chat
template and dominant tensor type). The modification time joined the key with
v9: a file rewritten in place to the same byte size (a re-quantised upload, a
restored download) used to keep serving the old header.
