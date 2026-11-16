# Downloads

`ui/shell/downloads/Downloads.js`

Downloads in the chrome: the toolbar button (appears with this session's first download; earlier sessions' `restored` records alone keep it hidden), progress ring, the popup list and its Open / Folder / Cancel actions plus Clear (`{ action: 'clear' }`: drops finished rows and calls `tabAPI.clearDownloads`); finishes and failures are logged.

The whole list lives on the downloads page (`luma://downloads`, [downloads](../../downloads/downloads.md)). `openPage()` asks main for that tab (`tabAPI.openDownloadsPage`); the gear menu's Downloads, Ctrl+J and the popup's last row (`{ action: 'all' }`) call it. The popup itself is only reachable from the toolbar button, so it always has a button to open under: before the page existed, the gear menu opened the popup even while the button was hidden, and it landed in the window's top left corner.

When entries leave the list in main (`tabAPI.onDownloadsChanged`: one removed on the downloads page, the finished ones cleared anywhere), the list is read again, the button is refreshed and an open popup is redrawn or, with nothing left, closed.

A finish or failure is announced once, when its live event arrives through `onEvent`. The list `install()` reads from main at load (earlier sessions' downloads, and this session's after a chrome reload or in a new window) is only listed, never announced, so old downloads do not pop up as notifications at every start.

## Methods

- `install()`, `onEvent(p)`, `openPage()`, `refreshButton()`, `toggleMenu()`, `showMenu()`, `handleAction(payload)`, `menuOpen`, `size`.
- `Downloads.supported()`.

## Globals

Reads `window.tabAPI` download methods, `window.chromeOverlayAPI`.
