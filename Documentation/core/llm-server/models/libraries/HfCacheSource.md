# HfCacheSource

`core/llm-server/models/libraries/HfCacheSource.js`

The Hugging Face hub cache. Extends [LibrarySource](LibrarySource.md).

## Members

- `id` `'huggingface'`, `label` `'Hugging Face cache'`.
- `roots()`: `HF_HUB_CACHE` when set, else `<HF_HOME>/hub`, else
  `~/.cache/huggingface/hub`, the same precedence huggingface_hub uses.
- `scan()` reads `models--<owner>--<repo>/snapshots/<rev>/*.gguf` (up to
  `SNAPSHOT_MAX_DEPTH` 2 below `snapshots`) and names each
  `<owner>/<repo>/<file>`. `datasets--` and other cache directories are ignored.
