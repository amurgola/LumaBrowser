# LumaBridge

`core/llm-server/ui/js/live/LumaBridge.js`

Builds the `luma` page-API object a live module receives.

## Methods

- `LumaBridge.create(transport)` returns `null` when `transport` has no
  `fetchPage` (surfaces without a bridge: the remote PWA, `/share`), else a
  plain object of closures (module code may destructure it):
  - `fetchPage(url, { mode, timeoutMs, maxChars }?)` resolves the page content as
    a string (`mode`: `'markdown' | 'text' | 'html'`); throws the host error
    (or "fetchPage failed") on `{ success: false }`.
  - `openTab(url)` resolves `true`; throws "openTab is not available in this
    view" when the transport has none, else the host error or "openTab failed".
  - `ext(extensionId)` -> `{ extensionId, call(method, ...args), onEvent(cb) }`
    onto an extension's published Dashboard API: `call` resolves the result or
    throws the host error ("extension call failed" without one); `onEvent`
    subscribes through `transport.onExtEvent(extensionId, cb)` and returns the
    detach (a no-op without a transport subscription or callback). `ext()`
    itself throws "luma.ext is not available in this view" when the transport
    has no `extCall` (the pop-out page).

`transport` is the preload's `liveApi` surface (`fetchPage(req)`,
`openTab(req)`, `extCall(req)`, `onExtEvent(extensionId, cb)`, the calls
resolving `{ success, ... }`). The pop-out page has an HTTP shim
with the same module-facing contract (LiveModuleDocument).

## Globals

None.
