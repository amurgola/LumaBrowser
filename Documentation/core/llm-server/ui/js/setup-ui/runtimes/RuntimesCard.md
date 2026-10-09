# RuntimesCard

`core/llm-server/ui/js/setup-ui/runtimes/RuntimesCard.js`

The LLM Setup "Runtimes" card: installed runtimes as the working set, everything still installable in a collapsed Catalogue with the provenance note, and update badges filled in after the rows paint.

## Methods

- `render()`: fetches `getRuntimesView()`, paints, re-renders the models card (its badges depend on install status), then checks upstream without blocking.
- `renderView(view)`, `refreshUpdates()`; statics `pillText(view)`, `bodyHtml(view)` (the Catalogue fold opens by default only when nothing is installed), `sourceCallout(view)`.

## Globals

Reads `document` by id; `FoldMemory` reads `localStorage`.
