# ChromeTab

`core/chrome-extensions/bridge/ChromeTab.js`

Builds the `chrome.tabs.Tab` object the shim hands to an extension for a
webContents.

## Methods

- `ChromeTab.fromWebContents(webContents, facts)`: `id` is the webContents id
  (what Electron's own `chrome.tabs` uses, so `chrome.tabs.sendMessage(tab.id)`
  reaches the right page). `facts` is what only the tab manager knows:
  `{ active, index, windowId, pinned, incognito }` (an inactive first tab of
  window 0 when left out); `highlighted` and `selected` follow `active`.
  `url`, `title`, `status` (`loading` or `complete`), `audible` and
  `mutedInfo` are read from the webContents, with safe fallbacks when any
  getter throws. [ChromeTabs](ChromeTabs.md) supplies the facts.
- `ChromeTab.withoutPrivateFields(tab)`: a copy without `url` and `title`
  (`PRIVATE_FIELDS`), for an extension that may not read the page.
