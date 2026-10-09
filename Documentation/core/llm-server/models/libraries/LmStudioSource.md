# LmStudioSource

`core/llm-server/models/libraries/LmStudioSource.js`

LM Studio's model library. Extends [LibrarySource](LibrarySource.md).

## Members

- `id` `'lmstudio'`, `label` `'LM Studio'`.
- `roots()`: `<LMSTUDIO_HOME>/models` when set, else `~/.lmstudio/models` then
  `~/.cache/lm-studio/models` (newest layout first).
- `scan()` returns real `.gguf` files found up to `MAX_DEPTH` (4) levels deep by
  [GgufTreeWalker](GgufTreeWalker.md), named by their path relative to the root
  (`bartowski/Qwen3-8B-GGUF/Qwen3-8B-Q4_K_M.gguf`).

## Why

`publisher/repo/file` reads better than a bare file name in a picker. The two
default roots are the same library on different LM Studio versions, so only the
first with models is used.
