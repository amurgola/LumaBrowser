# SetupJumpButton

`core/llm-server/ui/js/setup-ui/nav/SetupJumpButton.js`

The "Jump to a setting" ghost button at the end of the Setup title row (`#setupJumpBtn`). It teaches the search palette: a click opens it over this window through `llmDiagAPI.palette.toggle()` (`core.palette.toggle`, see [PaletteIpcHandlers](../../../../../palette/PaletteIpcHandlers.md)), and the Shift Shift keycaps show while the double-Shift shortcut is on (`palette.doubleShift()`). The button stays hidden when the preload has no palette API.

## Methods

- `new SetupJumpButton({ api, doc? })`; `start()` returns false when hidden.

## Globals

None.
