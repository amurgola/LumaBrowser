# DefaultsCard

`core/llm-server/ui/js/setup-ui/defaults/DefaultsCard.js`

The LLM Setup "Chat defaults" card: the default model, its context length and the settings that belong to the app as a whole, which also gate the Chat surface. What runs the model follows from the model; the per-framework options are on the Frameworks card ([RuntimesCard](../runtimes/RuntimesCard.md)). Every control saves on change; a save that stopped the running model says so.

## Methods

- `render()`: defaults, the cached scan (fetched only when missing) and [DefaultsPrefs](DefaultsPrefs.md) (`ctx.prefs`), then `renderView`.
- `renderView(defaults)`: sets `ctx.lastDefaults` first (the cards repainted next read it), paints the pill and body, wires the controls and hints, refreshes fit blocks, the installed handle and the status line.
- The view: the Model select lists every loadable model (`ctx.library.choices()`, any format, optgroups by family); [DefaultModelServing](DefaultModelServing.md) gives the line under it ("Runs on llama.cpp (LumaByte)", or which framework is missing) and the runtime that serves the model. Ready means a default model is set and something installed serves it. The pill reads "Ready", "Framework not installed" (the line says which) or "Set defaults to enable chat"; with no model the body says "Chat needs a default model. Pick one above.".
- `SHARED_CONTROLS`: model, context, thinking, tool router, router RAM pin and the helper model's three controls. The framework options (KV precision, concurrent predictions, tensor split, MoE GPU cache, context retention, peer GPUs, RAM pin, OpenVINO device) and the runtime are no longer read or sent from this card ([DefaultsForm](DefaultsForm.md)).
- `onChange()`: `setDefaults(changes)`; when the model changed, `RuntimesCard.refreshFrameworks()` first, so the line is drawn for the new model; then re-render and the save note. Auto-unload, the low-VRAM warning, unload on VRAM pressure, GPU headroom and tool approval save on their own and never restart the server.
- `showSaveNote(serverStopped)`: [SaveNote](SaveNote.md) with `#defaultsSaveNote` beside `#defaultsPill`.
- Fields `rows` (`ctx.rows`, [DefaultsRows](DefaultsRows.md), shared with the Frameworks card so open help survives either card's re-render), `prefs` (`ctx.prefs`).

## Globals

Reads `document` by id.

## Changes (2026-11-09, helper model)

The helper block's three controls are shared controls; the view carries `helperAvailable` (`api.getHelperModelStatus` exists) and `helperModelOptions` (the library's models with the helper's file selected); a [HelperModelHint](HelperModelHint.md) refreshes with the others.

## Changes (2026-11-14, save note out of the layout)

The plain "Saved." used to be prepended to the body like the stopped notice, so every change of a default pushed the controls down about 48 px for 4 s and back (ISSUES.md 7). It now sits in the card head beside the status pill and takes no layout from the body. The stopped notice stays in the body: it persists and needs the room.

## Saving only what changed, and following outside changes (2026-11-14)

- `onChange()` saves `DefaultsForm.changes(renderedForm, read(doc))`: only the fields that differ from what the controls held when the card was last drawn. A change event with nothing changed saves nothing.
- `_followOutsideChanges()` listens on `api.onServerEvent` for `defaults-changed` ([LlmServerBroadcast](../../../../ipc/LlmServerBroadcast.md)). Since 2026-11-22 it first calls `RuntimesCard.refreshFrameworks()` (a new default model may run on another framework); it redraws when the defaults differ from `lastDefaults` or the frameworks view changed. An event before the first render is ignored.

## Changes (2026-11-22, no Runtime picker)

Removed: the Runtime select, the OpenVINO device row, the model list scoped to the selected runtime, and the auto-pin and locked picker of a format-bound runtime (`ModelLibrary.forRuntime` is no longer called here). The RAM pin and peer GPU hints moved with their options to the Frameworks card.
