# ModelName

`core/llm-server/models/ModelName.js`

Stable keys and display names for local LLM files. The identifier (the file
stem) never changes; only what is shown to people does.

## Methods

- `ModelName.key(filePath)` is the file stem with only the final extension
  removed; both path separators work, and nullish input gives `''`.
- `ModelName.prettify(stem)` turns a stem into a label:
  `Qwen2.5-32B-Instruct-Q8_0` -> `Qwen 2.5 32B`, `gpt-oss-120b-MXFP4` ->
  `Gpt OSS 120B`, `google_gemma-4-31B-it` -> `Gemma 4 31B`. It drops an
  `Author_` prefix and a `-00001-of-00004` shard suffix, removes noise tokens and
  styles the rest with [ModelNameToken](ModelNameToken.md). A name that is only
  noise keeps everything but its quant and format.
- `ModelName.resolveDisplayName({ stem, overrides })` returns, in order: the
  user's non-blank override for `stem` (trimmed), the curated catalog label when
  the stem is `<fileBase>` or `<fileBase>-<QUANT>`, else `prettify(stem)`.

## Why

`key` is the key of the persisted display-name override map, so every reader
and writer must agree; it matches `path.basename(p, path.extname(p))`. Dropping
more than the last extension would collide `Q4_K_M` with `Q8_0` under one key.

The author-prefix rule also strips a leading `Q4_` from a stem that is nothing
but a quant (`Q4_K_M` -> `K_M`). That is legacy behaviour and kept; real stems
always carry a model name first.
