# GgufVariantGrouper

`core/llm-server/models/GgufVariantGrouper.js`

Collapses a HuggingFace repo file tree into one downloadable variant per GGUF
quant.

## Methods

- `GgufVariantGrouper.group(entries)` takes HF tree rows `{ path, size, type }`
  and returns `[{ quant, file, path, approxBytes, sharded, partPaths }]`,
  ordered by ascending bit width, then quant name. `file` is the basename to
  save locally; `path` is the repo-relative path for the resolve URL.

## Behaviour

- Skips directories, non-GGUF files, names with no known quant, mmproj files
  (often named like a tiny `F16`), imatrix data, and detached MTP heads (which
  share the weights' quant token).
- Sharded quants merge into one variant: sizes summed, `sharded: true`, part 1
  becomes `file`/`path` because downloads start there.
- `partPaths` are sorted by shard index, because the downloader fetches parts
  in that order and reports "part i of n" from it, and the HF tree has no
  ordering guarantee.
- Quality-ascending order lets callers walk the list to pick the best that fits.
