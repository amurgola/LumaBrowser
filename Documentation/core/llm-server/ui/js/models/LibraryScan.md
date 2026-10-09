# LibraryScan

`core/llm-server/ui/js/models/LibraryScan.js`

"Scan other tools' libraries" under a model list: runs the existing-library scan (LM Studio, Ollama, the Hugging Face cache; ComfyUI and friends for images), offers to link each found model into the models folder (never a copy), and asks Setup to refresh.

## Methods

- `LibraryScan.mount(mountEl, opts?)` inserts the action right after `mountEl` (appended inside it when it has no parent) and returns its root. Idempotent per element. `opts`: `api` (llmDiagAPI-shaped `scanExistingLibraries(args?)`, `importExistingModel(payload)`; defaults to `window.llmDiagAPI`, read at click time), `onRefresh` (default: dispatch `luma-models-changed` on window), `text` (`{ note, empty, more }` overrides), `importArgs(model)` (default `{ sourcePath: path, fileName: file }`), `pickDir()` (adds "Choose a folder", which rescans `{ roots: [dir] }`).
- Results list up to 50 models (via [ExistingLibraryView](../setup/ExistingLibraryView.md)), mark adopted ones done, offer "Import all" when more than one is importable, and show files that cannot be linked alone. One successful import, or an Import all with any success, refreshes once.

## Globals

Reads `window.llmDiagAPI` when no `api` is given; dispatches `luma-models-changed` on window.
