# Downloads

`ui/shell/downloads/Downloads.js`

Session downloads: the toolbar button (appears with the first download, progress ring), the popup list and its Open / Folder / Cancel actions; finishes and failures are logged.

## Methods

- `install()`, `onEvent(p)`, `refreshButton()`, `toggleMenu()`, `showMenu()`, `handleAction(payload)`, `menuOpen`, `size`.
- `Downloads.supported()`.

## Globals

Reads `window.tabAPI` download methods, `window.chromeOverlayAPI`.
