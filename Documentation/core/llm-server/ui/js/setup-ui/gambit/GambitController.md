# GambitController

`core/llm-server/ui/js/setup-ui/gambit/GambitController.js`

Runs the compatibility gambit for the default model and downloads its raw transcripts.

## Methods

- `currentPath()`, `blockHtml()`, `summaryHtml()`, `refresh()` (repaints only the block and handle), `bindEvents()`, `start(path)` (never while a fit test runs), `cancel()`, `downloadRaw(path)` (`gambit-<ranAt>.json`), `hydrate()`, `fileName(raw)`.

## Globals

Uses `window.URL.createObjectURL` and `window.Blob`.
