# DefaultsCard

`core/llm-server/ui/js/setup-ui/defaults/DefaultsCard.js`

The LLM Setup "Defaults" card: the runtime, model and launch settings Start uses, which also gate the Chat surface. Every control saves on change; a save that stopped the running model says so.

## Methods

- `render()`: defaults, the cached scan (fetched only when missing) and [DefaultsPrefs](DefaultsPrefs.md), then `renderView`.
- `renderView(defaults)`: sets `ctx.lastDefaults` first (the gambit block reads it), paints the pill and body, wires the controls and hints, refreshes fit blocks and the installed handle. A format-bound runtime with one model pins it once (`setDefaults({ modelPath })`) and locks the picker.
- `onChange()`: `setDefaults(DefaultsForm.read(doc))`, re-render, save note. Auto-unload, unload on VRAM pressure and tool approval save on their own and never restart the server.
- `showSaveNote(serverStopped)`: a stopped notice stays until the next render; "Saved." fades after 4 s.
- Fields `rows` ([DefaultsRows](DefaultsRows.md)), `prefs`.

## Globals

Reads `document` by id.
