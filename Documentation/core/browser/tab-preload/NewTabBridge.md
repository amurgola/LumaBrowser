# NewTabBridge

`core/browser/tab-preload/NewTabBridge.js`

Exposes `window.lumaNewTab` (`data()`, `search(query)`, `hide(url)`) through contextBridge, only when the page is
`luma://newtab`. Main also checks the sender (NewTabIpcHandlers). Installed by TabPreload; webview-preload passes
`contextBridge`.

## Methods

- `NewTabBridge.install(contextBridge, ipcRenderer, window)` -> whether it exposed the bridge.
