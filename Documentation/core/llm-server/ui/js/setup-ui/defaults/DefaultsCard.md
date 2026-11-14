# DefaultsCard

`core/llm-server/ui/js/setup-ui/defaults/DefaultsCard.js`

The LLM Setup "Defaults" card: the runtime, model and launch settings Start uses, which also gate the Chat surface. Every control saves on change; a save that stopped the running model says so.

## Methods

- `render()`: defaults, the cached scan (fetched only when missing) and [DefaultsPrefs](DefaultsPrefs.md), then `renderView`.
- `renderView(defaults)`: sets `ctx.lastDefaults` first (the gambit block reads it), paints the pill and body, wires the controls and hints, refreshes fit blocks and the installed handle. A format-bound runtime with one model pins it once (`setDefaults({ modelPath })`) and locks the picker.
- `onChange()`: `setDefaults(DefaultsForm.read(doc))`, re-render, save note. Auto-unload, unload on VRAM pressure, GPU headroom (`setGpuHeadroom(GiB x 2^30)`) and tool approval save on their own and never restart the server.
- `showSaveNote(serverStopped)`: a stopped notice (`.defaults-save-note.stopped`) is prepended to the body and stays until the next render; a plain "Saved." (`.defaults-saved`) goes in the card head just before `#defaultsPill`, survives a re-render, and is removed after `SAVE_NOTE_MS` (4 s). Either replaces the other (one `#defaultsSaveNote`).
- The view's `openvino` is `{ options: DefaultsOptions.openvinoDeviceOptions(hostCaps.intelNpuNames()) }` only when the default runtime is OpenVINO, else null; `defaultOpenVinoDevice` is one of `SHARED_CONTROLS`.
- Fields `rows` ([DefaultsRows](DefaultsRows.md)), `prefs`.

## Globals

Reads `document` by id.

## Changes (2026-11-09, helper model)

The helper block's three controls are shared controls; the view carries `helperAvailable` (`api.getHelperModelStatus` exists) and `helperModelOptions` (the library's models with the helper's file selected); a [HelperModelHint](HelperModelHint.md) refreshes with the others.

## Changes (2026-11-14, save note out of the layout)

The plain "Saved." used to be prepended to the body like the stopped notice, so every change of a default pushed the controls down about 48 px for 4 s and back (ISSUES.md 7). It now sits in the card head beside the status pill (`.card-head > .defaults-saved` in `core/llm-server/ui/css/setup.css`: `margin-left: auto`, `--text-sm`, `--text-secondary`) and takes no layout from the body. The stopped notice stays in the body: it persists and needs the room.

## Saving only what changed, and following outside changes (2026-11-14)

The card used to send every control on each save (`DefaultsForm.read`), and nothing told it when a default changed elsewhere. So a card drawn with model A, after the chat's model picker made model B the default, wrote A back the next time any unrelated control was changed, and because the model is a launch setting that save also stopped the running server. Two things now prevent it:

- `onChange()` saves `DefaultsForm.changes(renderedForm, read(doc))`: only the fields that differ from what the controls held when the card was last drawn (`_renderedForm`, taken at the end of `_wire()`). A change event with nothing changed saves nothing.
- `_followOutsideChanges()` (run once from the constructor) listens on `api.onServerEvent` for `{ type: 'defaults-changed', payload: { defaults } }` ([LlmServerBroadcast](../../../../ipc/LlmServerBroadcast.md)) and calls `renderView(defaults)`. The echo of the card's own save equals `lastDefaults` and is skipped, so its save note is not redrawn away; an event that arrives before the first render is ignored.
