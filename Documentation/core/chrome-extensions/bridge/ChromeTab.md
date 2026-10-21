# ChromeTab

`core/chrome-extensions/bridge/ChromeTab.js`

Builds the `chrome.tabs.Tab` object the shim hands to an extension for a
webContents.

## Methods

- `ChromeTab.fromWebContents(webContents, entry, order)`: `id` is the
  webContents id (what Electron's own `chrome.tabs` uses, so
  `chrome.tabs.sendMessage(tab.id)` reaches the right page), `index` is the
  entry's position in `order`, `active`/`highlighted`/`selected` follow the
  entry, `url`, `title`, `status` (`loading` or `complete`), `audible` and
  `mutedInfo` are read from the webContents, with safe fallbacks when any
  getter throws. `windowId` is always 0.
