# PaletteIpcHandlers

`core/palette/PaletteIpcHandlers.js`

IPC controller for `core.palette.*`. Each channel answers only the sender it is
meant for; a refused call answers `{ success: false, error }`.

## Channels

| Channel | Who may call | Does |
|---|---|---|
| `core.palette.search` | a palette view | `{ success, query, groups }` |
| `core.palette.open` | a palette view | opens a row |
| `core.palette.close` | a palette view | hides the palette |
| `core.palette.dig` | a palette view | starts Dig deeper; events stream on `core.palette.digEvent` |
| `core.palette.digAbort` | a palette view | stops it |
| `core.palette.continueInChat` | a palette view | closes, then hands the query to the chat |
| `core.palette.toggle` | browser chrome or an internal tab | opens or closes the sender's window's palette (the LLM tab's "Jump to a setting" button uses it); never a website |
| `core.palette.getDoubleShift` | browser chrome or an internal tab | `{ success, enabled }` |
| `core.palette.setDoubleShift` | browser chrome | saves the switch |
| `core.palette.record` | browser chrome or an internal tab | remembers a place; never a website |

`core.palette.digEvent` (main to the palette page) carries
`{ type: 'context' | 'delta' | 'done' | 'error', ... }`.

## Methods

- `new PaletteIpcHandlers({ palette, getTabViewManager, ipc?, windowFor? })`
  (`ipc` and `windowFor` are test seams), `register()`. The chrome-only channels
  fail closed: before the tab manager exists they answer `{ success: false }`.
  `dig` passes the asking palette as the run's owner and `digAbort` stops only
  that palette's run.
