# OverlayPreloadApi

`core/browser/overlay/OverlayPreloadApi.js` (entry: `core/browser/overlay/overlay-preload.js`)

The ChromeOverlay layers' `window.overlayAPI` (views are unsandboxed:
ChromeOverlay `sandbox: false`).

## Methods

- `expose(contextBridge, ipcRenderer)`, `build(ipcRenderer)`.

## Surface

`onContent(cb)` (`overlay:content`), `onSetActive(cb)` (`overlay:set-active`),
`measure(height)`, `sendAction(payload)`, `sendHover(payload)`, `dismiss()`
(`chrome-overlay:*` sends). The two subscriptions now return nothing (legacy
returned ipcRenderer.on's result, the ipcRenderer object, across the bridge).
`chrome-overlay:dismiss` has no main-side listener (as in legacy).
