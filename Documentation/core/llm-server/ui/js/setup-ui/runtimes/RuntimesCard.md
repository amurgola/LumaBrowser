# RuntimesCard

`core/llm-server/ui/js/setup-ui/runtimes/RuntimesCard.js`

The LLM Setup "Frameworks" card (`#cardRuntimes`, `#runtimesPill`, `#runtimesBody`; the ids are kept from when it was "Inference runtimes"): a default framework per shared model format, one frame per installed framework (its active build, its options, its builds), the Catalogue of frameworks still to install, and update badges filled in after the rows paint. It also keeps the [FrameworkStore](../frameworks/FrameworkStore.md) and the system status line current. The markup is [FrameworksCardHtml](../frameworks/FrameworksCardHtml.md); the card's controls are [FrameworkControls](../frameworks/FrameworkControls.md).

## Methods

- `render()`: fetches `getRuntimesView()`, then the frameworks view (`ctx.frameworks.load`) and the RAM pin status (`ctx.prefs.loadRamPin`, the RAM pin row needs it before the Chat defaults card loads the other prefs), paints, re-renders the models card (its badges depend on install status), then checks upstream without blocking.
- `renderView(view)`: pill ("2 of 5 installed"), body, update badges already known, the Builds fold lines, the live hints (RAM pin, peer GPUs; only present in the frame serving the default model), the status line. Remembers the runtimes view and the frameworks view it painted.
- `repaint()`: redraws from the last runtimes view.
- `refreshFrameworks()`: re-reads the frameworks view and repaints when it differs from the one last painted, which also catches a view another card stored (the Models card's pin save); resolves whether it did. Called by [DefaultsCard](../defaults/DefaultsCard.md) on `defaults-changed` and after a model pick, and by [LibraryRefresher](../LibraryRefresher.md).
- `afterFrameworkSave(saved, serverStopped, selection)`: repaint; on success redraw the Chat defaults card from `lastDefaults` (its "Runs on" line), the model rows when a build or format choice changed what serves them, and show the [SaveNote](../defaults/SaveNote.md) (`#runtimesSaveNote`).
- `refreshUpdates()`: `checkRuntimeUpdates()` into the RuntimeStatusStore, the row badges, the Builds fold lines ("2 of 9 installed, update available") and the status line.
- `publishStatus()`: [SystemStatus](../system/SystemStatus.md)`.runtimes(store, servingId, missingFramework)`: the build serving the default model (`frameworks.current().runtimeId`, else the recorded `lastDefaults.runtimeId` when no view is loaded) is named and only its update asks for attention; a default model whose framework is not installed names that framework. Also called by the Chat defaults card.

## Globals

Reads `document` by id; `FoldMemory` reads `localStorage`.

## Changes (2026-11-22, Frameworks card)

The card was a flat list of installed runtimes plus a catalogue, and a global Runtime picker on the Chat defaults card chose which one ran every model. Now the model decides the framework, so the card groups the rows by `row.framework` and takes builds, active build, formats and options from the frameworks view. `bodyHtml`, `pillText` and `sourceCallout` moved to FrameworksCardHtml.
