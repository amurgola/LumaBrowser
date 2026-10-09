# ImageSetupPanel

`core/llm-server/ui/js/image-setup/ImageSetupPanel.js`

The Image section of the LLM tab's Setup view (cards `cardImageDefaults`, `cardImageRuntimes`, `cardImageModels`). It owns the [store](ImageSetupStore.md), wires the image server's runtime, model and server events once, and paints the [Defaults](ImageDefaultsCard.md), [Runtimes](ImageRuntimesCard.md) and [Models](ImageModelsCard.md) cards. Opened lazily the first time the Image nav entry is shown, then refreshed on every later open.

## Methods

- `new ImageSetupPanel({ getApi?, modelList? })`: `getApi` returns llmDiagAPI (the panel uses `.image` and the root's `getDiagnostics` for usable VRAM); default `window.llmDiagAPI`. `modelList` defaults to [ModelList](../models/ModelList.md) (tests pass a stub).
- `open()`: without `llmDiagAPI.image.getEnabled` every card says "Image server is not available in this build."; the first call wires events and the page-head `#reloadBtn` (a forced runtime rescan); every call runs `refreshAll()`.
- `refreshAll()`, `refreshRuntimes(opts)` (load, paint, then the fire-and-forget update check), `refreshModels()`, `refreshServer()`, `refreshModelsAndDefaults()`, and the load-only `reload('enabled' | 'defaults' | 'server' | 'catalog' | 'vram')`.
- Shared parts for the cards: `store`, `defaultsCard`, `runtimesCard`, `modelsCard`, `actions` ([ImageModelActions](ImageModelActions.md)), `importModal`, `loraModal`, `api()`, `hasApi()`.

## Collaborators

The Setup view switcher (agent B1's `setup.js` port) calls `open()` when the Image view is shown; legacy reached it through `window.__lumaImageSetupOpen`. Expand and collapse of `.runtime-row` is that surface's delegated `.runtime-head` click listener; this panel only renders rows with `collapsed`. The page entry must call `FoldMemory.install(document)` (remembered folds) as the shared library documents.

## Globals

Reads `window.llmDiagAPI` (default), `window.localStorage` (first-run catalogue fold), `window.CSS.escape`. Writes none (legacy wrote `window.__lumaImageSetupOpen`).
