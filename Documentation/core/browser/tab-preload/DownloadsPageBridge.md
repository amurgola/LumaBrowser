# DownloadsPageBridge

`core/browser/tab-preload/DownloadsPageBridge.js`

Exposes `window.lumaDownloads` through contextBridge, only when the page is `luma://downloads`. Installed by
TabPreload, so the downloads tab runs in Chromium's sandbox with the same preload as every tab. Main also checks the
sender ([DownloadsIpcHandlers](../downloads/DownloadsIpcHandlers.md)).

`list()`, `open(id)`, `show(id)`, `copyLink(id)`, `cancel(id)`, `remove(id)`, `clear()`, `onEvent(listener)` (the
listener gets `{ type: 'download', download }` or `{ type: 'changed' }`).

## Methods

- `DownloadsPageBridge.install(contextBridge, ipcRenderer, window)` -> whether it exposed the bridge.
