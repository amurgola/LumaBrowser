# TabViewFactory

`core/browser/tab-view/TabViewFactory.js`

Builds a tab's native view and attaches it and its per-tab services.

## Methods

- `new TabViewFactory({ mainWindow, preloadPath, adblockerService, chromeExtensionService, networkInterceptor })`.
- `createView({ partition, preloadPath, silent, keepAlive })`: a WebContentsView in
  `session.fromPartition(partition)` with the [ChromeIdentity](../ChromeIdentity.md)
  user agent and Accept-Language, context isolation, no node integration, the
  given preload (else the default), an opaque white background and 20 max listeners.
  `backgroundThrottling` is off for silent and keep-alive tabs.
- `attach(entry)`: adds the view to the window hidden at 0x0 bounds, with crash-trace
  marks `tab:create` and `tab:attached`.
- `attachServices(entry)`: adblocker on the session, Chrome extensions for the
  webContents, and the NetworkInterceptor with the tab id (skipped for automation tabs).
- `TabViewFactory.applyIdentity(entry)`: [IdentityOverride](../identity/IdentityOverride.md)
  `.apply`, with child auto-attach off for automation tabs. Must run before the first load.

## Why

Silent tabs render hidden and keep-alive tabs live hidden; Chromium would clamp
their timers to about 1 Hz and pause rAF, so JS-heavy pages would load slowly or
never and pushes would stall. The opaque background stops Windows DWM from
compositing every frame against the window, which made the whole window flash
in time with video-heavy pages. The adblocker and extensions also hook new
sessions, but persist:* partitions can be recycled, so both calls are repeated
here as an idempotent safety net.
