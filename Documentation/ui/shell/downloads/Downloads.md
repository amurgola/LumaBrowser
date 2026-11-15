# Downloads

`ui/shell/downloads/Downloads.js`

Downloads: the toolbar button (appears with this session's first download; earlier sessions' `restored` records alone keep it hidden), progress ring, the popup list (earlier sessions included, so Ctrl+J shows them) and its Open / Folder / Cancel actions plus Clear (`{ action: 'clear' }`: drops finished rows and calls `tabAPI.clearDownloads`); finishes and failures are logged.

A finish or failure is announced once, when its live event arrives through `onEvent`. The list `install()` reads from main at load (earlier sessions' downloads, and this session's after a chrome reload or in a new window) is only listed, never announced, so old downloads do not pop up as notifications at every start.

## Methods

- `install()`, `onEvent(p)`, `refreshButton()`, `toggleMenu()`, `showMenu()`, `handleAction(payload)`, `menuOpen`, `size`.
- `Downloads.supported()`.

## Globals

Reads `window.tabAPI` download methods, `window.chromeOverlayAPI`.
