# ModelSearch

`core/llm-server/ui/js/models/ModelSearch.js`

The "Search models" modal of the LLM Setup area: a two-pane Hugging Face GGUF (or, on a Mac, MLX) browser. Left: a search debounced 200 ms after the last keystroke, ordered by trending (the default, what huggingface.co itself shows), downloads, likes or recently updated, with a "Fits this PC" toggle (on by default) that hides models whose Q4 quant would not fit the GPU or RAM. Rows show the repo's size, context, architecture and a fit dot ([ModelSearchRow](ModelSearchRow.md)); the status line counts what the filter hid. Right: the picked repo's card, facts, quant picker with fit badges and one-click resumable download.

## Methods

- `new ModelSearch({ getApi?, isMac? })`. `getApi` returns llmDiagAPI (`searchModels`, `expandModelRepo`, `getModelReadme`, `downloadModel`, `cancelModelDownload`, `onModelEvent`, `openExternal`); default `window.llmDiagAPI`. `isMac` defaults to [HostPlatform](../wizard/HostPlatform.md)`.isMac()`.
- `open()` builds the overlay once, resets the controls (trending, fit on, MLX off), forgets the repo loads of the last session and runs the empty search; Escape closes it.
- `close()` stops the debounce, unsubscribes model events, cancels a running download (bytes stay resumable) and hides the overlay.
- `searchModels` is called with `{ query, sort, limit: 30, mlx, fit }`; the answer's `hidden` counts feed the status line.
- Hovering a row starts its `expandModelRepo` and `getModelReadme` loads; the click that follows reuses the same promise, so a card the main process already remembers paints at once. A failed load is forgotten so the next click retries.
- Stale responses are dropped by sequence numbers (a newer keystroke or repo click wins). README and Hugging Face links open through `openExternal`, http and https only.

## Collaborators

The Setup section (agent B1's `setup.js` port) owns the "Search models" launch button; it takes this instance (or its `open`) as an injected collaborator instead of reading `window.LumaModelSearch`. The main-process side is [HfRepoBrowser](../../../ipc/HfRepoBrowser.md), which remembers searches, expansions, cards and the hardware budget for minutes.

## Globals

Reads `window.llmDiagAPI` (default), `navigator`. Adds a document keydown listener while open.

## Notes

Bug fixed: legacy added the Escape listener only when the overlay was first built and removed it on close, so Escape stopped working from the second open on. The listener is now added on every open (test "closes the modal on every open, not only the first").

Lag fixed (2026-11-04): every click on a result re-probed the hardware (seconds of nvidia-smi) before the quants could be badged; the budget is now served from the service's diagnostics snapshot and remembered by the browser, and the card is prefetched on hover.
