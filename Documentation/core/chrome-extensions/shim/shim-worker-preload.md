# shim-worker-preload.js

`core/chrome-extensions/shim/shim-worker-preload.js`

The preload [ShimBridge](../bridge/ShimBridge.md) registers per session with
`registerPreloadScript({ type: 'service-worker' })`. Electron runs it in every
service worker of the session, in its own realm
(`electron-preload-realm`) that has no `chrome` object, so it cannot define
APIs itself. It exposes one object to the worker's world with
`contextBridge.exposeInMainWorld('lumaShim', ...)`:

- `call(ns, op, args)`: `ipcRenderer.invoke('luma-shim:call', { ns, op, args })`.
- `onEvent(fn)`: `fn(message)` for every `luma-shim:event` from main
  (`{ ns, name, args }`); a throwing listener is logged and the rest still run.

[chrome-api-shim.js](chrome-api-shim.md), which loads in the worker's own
world, builds `chrome.webNavigation` and `chrome.contextMenus` on top of it.
Site service workers receive the same object and never touch it. Without the
`electron` module or `ipcRenderer` the script does nothing.
