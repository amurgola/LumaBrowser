# TabViewFactory

`core/browser/tab-view/TabViewFactory.js`

Builds a tab's native view, parks it in its window, moves it between windows, and attaches its per-tab services.

## Methods

- `new TabViewFactory({ hosts, preloadPath, adblockerService, chromeExtensionService, networkInterceptor })`.
- `createView({ partition, preloadPath, silent, keepAlive })`: a WebContentsView in
  `session.fromPartition(partition)` with the [ChromeIdentity](../ChromeIdentity.md)
  user agent and Accept-Language, context isolation, no node integration, the
  given preload (else the default), an opaque white background and 20 max listeners.
  `backgroundThrottling` is off for silent and keep-alive tabs. `sandbox` is
  `!preloadPath`: a web tab (default preload) runs in Chromium's sandbox; a tab
  given a preload of its own (the app's internal pages) stays unsandboxed.
- `attach(entry)`: adds the view to the tab's window hidden at 0x0 bounds, with crash-trace
  marks `tab:create` and `tab:attached`.
- `reparent(entry, toHostId)`: hides the view, removes it from its window and parks it
  in another (crash-trace mark `tab:reparent`). The page, history and session are untouched.
- `detach(entry)`: removes the view from its window; nothing to do once that window is gone.
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

Web tabs are sandboxed because a sandboxed renderer starts faster and can take
the warm spare renderer ([ProcessSetup](../../../app/process/ProcessSetup.md)
enables `SpareRendererForSitePerProcess`). The default preload is then the
self-contained bundle [PreloadBundle](../tab-preload/PreloadBundle.md) writes,
since a sandboxed preload can require nothing but `electron`. Internal pages'
own preloads require local modules, which only an unsandboxed renderer allows.
Measured on a local page: a new tab finished loading in 63 ms unsandboxed,
37 ms sandboxed, 12 ms sandboxed with the spare renderer.

## extensionsSettling

`extensionsSettling(entry)` returns `chromeExtensionService.loadsInFlight` for
the tab's session (a promise), or `null` when there is no service or nothing
is loading. Call it after `attachServices`, which starts the loads.
