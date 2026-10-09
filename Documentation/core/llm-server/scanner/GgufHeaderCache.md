# GgufHeaderCache

`core/llm-server/scanner/GgufHeaderCache.js`

Memoises parsed GGUF headers by `path|size`, in memory and in a JSON file, so a
rescan or a warm boot resolves unchanged models with zero disk reads.

## Methods

- `new GgufHeaderCache({ parse, persistPath = () => '' })`; `parse(filePath)`
  resolves a [GgufParser](../GgufParser.md) result; `persistPath()` returns the
  file path or `''` (a throw counts as `''`). Resolved once, lazily.
- `get(filePath, sizeBytes)` resolves the cached result or parses, stamping
  `_v = SCHEMA_VERSION` on the result. The first call hydrates from the file.
- `flush()` writes the successful (`ok`) entries when anything new parsed; a
  write error is ignored and retried on the next dirty flush.
- `SCHEMA_VERSION` (8), `MAX_ENTRIES` (256, oldest evicted first).

## Why

The chat model picker reads every model's header on the first scan of each
boot; a large library made that a startup stall. Only successful parses persist
so a timeout or a momentarily locked file is retried next boot instead of frozen.
Entries of another schema are dropped on hydrate so a model re-parses once
after the parser gains fields (history in the source comment: v2 KV lengths
through v8 per-tensor byte layout).
