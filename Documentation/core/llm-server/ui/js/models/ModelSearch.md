# ModelSearch

`core/llm-server/ui/js/models/ModelSearch.js`

The "Search models" modal of the LLM Setup area: a two-pane Hugging Face GGUF (or, on a Mac, MLX) browser. Left: a search debounced 200 ms after the last keystroke, sortable by downloads, likes or recently updated (an empty query lists the most downloaded). Right: the picked repo's card, facts, quant picker with fit badges and one-click resumable download.

## Methods

- `new ModelSearch({ getApi?, isMac? })`. `getApi` returns llmDiagAPI (`searchModels`, `expandModelRepo`, `getModelReadme`, `downloadModel`, `cancelModelDownload`, `onModelEvent`, `openExternal`); default `window.llmDiagAPI`. `isMac` defaults to [HostPlatform](../wizard/HostPlatform.md)`.isMac()`.
- `open()` builds the overlay once, resets the controls and runs the empty search; Escape closes it.
- `close()` stops the debounce, unsubscribes model events, cancels a running download (bytes stay resumable) and hides the overlay.
- Stale responses are dropped by sequence numbers (a newer keystroke or repo click wins). README and Hugging Face links open through `openExternal`, http and https only.

## Collaborators

The Setup section (agent B1's `setup.js` port) owns the "Search models" launch button; it takes this instance (or its `open`) as an injected collaborator instead of reading `window.LumaModelSearch`.

## Globals

Reads `window.llmDiagAPI` (default), `navigator`. Adds a document keydown listener while open.

## Notes

Bug fixed: legacy added the Escape listener only when the overlay was first built and removed it on close, so Escape stopped working from the second open on. The listener is now added on every open (test "closes the modal on every open, not only the first").
