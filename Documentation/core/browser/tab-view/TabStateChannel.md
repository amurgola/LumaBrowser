# TabStateChannel

`core/browser/tab-view/TabStateChannel.js`

The tab layer's line to the chrome renderer.

## Methods

- `new TabStateChannel(mainWindow, registry, faviconCache)`.
- `send(channel, payload)`: `mainWindow.webContents.send`, silently skipped when the
  window is gone or closing.
- `broadcast(entry)`: sends `tab:state` with the serialized tab.
- `serialize(entry)`: `{ id, openerTabId, url, title, loading, silent, kind, pinned,
  keepAlive, hidden, canGoBack, canGoForward, zoomLevel, active, createdAt,
  lastNavigatedAt, lastActivatedAt, historyLength, favicon, index, errorPage }`. `favicon` is the
  [FaviconCache](../FaviconCache.md) data URL for the host when cached, else the
  icon URL the page reported. `index` is the position in the full strip order.

This shape is what `createTab`, `getAllTabs`, `getPersistedTabs` and the
`tabCreated` event return.
