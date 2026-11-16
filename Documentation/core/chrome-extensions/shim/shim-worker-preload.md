# shim-worker-preload.js

`core/chrome-extensions/shim/shim-worker-preload.js`

The preload [ShimBridge](../bridge/ShimBridge.md) registers per session with
`registerPreloadScript({ type: 'service-worker' })`, and the `preload` of the
extension page windows
([ChromeExtensionPageWindows](../ChromeExtensionPageWindows.md)). Electron
runs it in every service worker of the session, in its own realm
(`electron-preload-realm`) that has no `chrome` object, so it cannot define
APIs itself; in a page window it runs in the isolated preload world. It
exposes one object to the extension's world with
`contextBridge.exposeInMainWorld('lumaShim', ...)`:

- `call(ns, op, args)`: `ipcRenderer.invoke('luma-shim:call', { ns, op, args })`.
- `onEvent(fn)`: `fn(message)` for every `luma-shim:event` from main
  (`{ ns, name, args }`); a throwing listener is logged and the rest still run.

[chrome-api-shim.js](chrome-api-shim.md), which loads in the extension's own
world, builds the bridged `chrome.*` members on top of it.
Site service workers receive the same object and never touch it. Without the
`electron` module or `ipcRenderer` the script does nothing.
