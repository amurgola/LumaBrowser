# TabStateChannel

`core/browser/tab-view/TabStateChannel.js`

The tab layer's line to the chrome renderers: each tab's events go to the window it is drawn in.

## Methods

- `new TabStateChannel(hosts, registry, faviconCache)` ([TabHosts](TabHosts.md)).
- `send(channel, payload, hostId = 0)`: that window's `webContents.send`, silently
  skipped when the window is gone or closing.
- `sendForTab(entry, channel, payload)`: to the window the tab is drawn in.
- `broadcast(entry)`: sends `tab:state` with the serialized tab to its window.
- `serialize(entry)`: `{ id, openerTabId, url, title, loading, silent, kind, pinned,
  keepAlive, hidden, canGoBack, canGoForward, zoomLevel, active, windowId, createdAt,
  lastNavigatedAt, lastActivatedAt, historyLength, favicon, index, errorPage }`. `favicon` is the
  [FaviconCache](../FaviconCache.md) data URL for the host when cached, else the
  icon URL the page reported. `index` is the position in the full strip order.
`active` is per window; `windowId` is the window the tab is drawn in.

This shape is what `createTab`, `getAllTabs`, `getPersistedTabs` and the
`tabCreated` event return.
