# LibrarySource

`core/llm-server/models/libraries/LibrarySource.js`

Base class for one other tool's model library. Implementations:
[LmStudioSource](LmStudioSource.md), [HfCacheSource](HfCacheSource.md),
[OllamaSource](OllamaSource.md).

## Members

- `new Source(env)`; `env` is a process.env-like object.
- `get id()`, `get label()` (abstract): the `source` and `sourceLabel` stamped
  on each result.
- `roots()` (abstract): candidate library roots, most likely first.
- `scan()` walks `roots()`, skips any that is not a directory, and returns the
  results of the first root whose `_scanRoot(root)` found anything, each tagged
  `{ source, sourceLabel, ...hit }`. Returns `[]` when nothing is found.
- `_scanRoot(root)` (abstract, protected): returns `[{ name, file, path, bytes }]`.
- `LibrarySource.MIN_MODEL_BYTES` is 64 MB; smaller files are stubs or config
  leftovers, not weights.
- `LibrarySource.homeDir()` is `os.homedir()` or `null` when it throws.

## Why

An env override replaces the default location rather than being tried first.
That is what the tools themselves do (`HF_HOME` means "the cache is here", not
"also look here"); scanning the default anyway would offer models from a
library the user deliberately moved away from, and would make the scan
impossible to scope in a test. The first root with finds wins because the
alternative roots are the same library under different tool versions.
