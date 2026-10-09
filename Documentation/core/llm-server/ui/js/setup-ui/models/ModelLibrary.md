# ModelLibrary

`core/llm-server/ui/js/setup-ui/models/ModelLibrary.js`

The last models-directory scan, plus the model choices a selected runtime can load.

## Methods

- `scan`, `count()`, `choices()` (no mmproj-only or MTP-only folders), `find(path)`; `ModelLibrary.forRuntime(models, runtimeId, runtimes)`: `{ models, locked, bound }` (a format-bound runtime sees only its format and locks a lone match; claimed formats never show under other runtimes).

## Globals

None.
