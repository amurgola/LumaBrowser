# RunZoom

`extensions/ai-chat/ui/lite-panel/RunZoom.js`

Zooms the active tab out to `RUN_FACTOR` (0.25) while a turn runs and back to
`RESET_FACTOR` (1.0) on the same tab when it ends.

## Methods

- `new RunZoom({ tabAPI, getActiveTabId })`.
- `set(running)`: no-op without `tabAPI.setZoom` or without an active tab;
  errors are swallowed.
