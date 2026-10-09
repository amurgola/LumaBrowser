# TabActions

`ui/shell/tabs/TabActions.js`

The shell's tab commands over `tabAPI`: open (start page by default, optional caret in the address bar), close (replacing the last tab with a fresh one), switch, navigate the active tab, zoom, sync zoom from main, reopen closed.

## Methods

- `create(url, options)`, `close(tabId)`, `switchTo(tabId)`, `navigate(url)`, `zoom(tabId, delta, reset)`, `syncZoom(tabId)`, `reopenClosed()`.
- `startPageUrl` (set by BrowserDataSettings).
- `TabActions.nextZoom(current, delta, reset)`.

## Globals

Reads `window.tabAPI`.
