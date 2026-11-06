# Downloads

`ui/shell/downloads/Downloads.js`

Downloads: the toolbar button (appears with this session's first download; earlier sessions' `restored` records alone keep it hidden), progress ring, the popup list (earlier sessions included, so Ctrl+J shows them) and its Open / Folder / Cancel actions plus Clear (`{ action: 'clear' }`: drops finished rows and calls `tabAPI.clearDownloads`); finishes and failures are logged.

## Methods

- `install()`, `onEvent(p)`, `refreshButton()`, `toggleMenu()`, `showMenu()`, `handleAction(payload)`, `menuOpen`, `size`.
- `Downloads.supported()`.

## Globals

Reads `window.tabAPI` download methods, `window.chromeOverlayAPI`.
