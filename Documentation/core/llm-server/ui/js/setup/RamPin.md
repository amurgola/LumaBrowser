# RamPin

`core/llm-server/ui/js/setup/RamPin.js`

Turns on RAM pinning for the chat and image servers after a singularity setup.

## Methods

- `RamPin.enable(llm, image)` resolves `{ ok: false, skipped: 'unsupported' }`
  when `llm.getRamPinStatus()` reports `supported: false` (macOS), else calls
  `setDefaults({ pinModelRam: true })` on both and resolves `{ ok }` (`false` if
  either toggle threw). A failing status probe does not block. Never throws.

## Globals

None.
