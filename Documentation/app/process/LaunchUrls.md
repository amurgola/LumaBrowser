# LaunchUrls

`app/process/LaunchUrls.js`

Web links passed on the command line open as tabs:
`LumaBrowser.exe https://example.com` on a first launch, and the same when Luma
already runs (the second instance exits and Electron's `second-instance` event
hands its argv to the running one). Generic: any launcher, script or shortcut
can use it. It does not register Luma as the default browser or as a protocol
handler.

[ProcessSetup](ProcessSetup.md) builds it right after taking the
single-instance lock (`ctx.launchUrls`), queues the first launch's own
`ctx.argv`, and opens a second instance's argv in its `second-instance`
handler (after focusing the window). [MainWindow](../window/MainWindow.md)
calls `ready()` after [StartupTabs](../window/StartupTabs.md)`.open()` on the
window's first load, so command-line links open after (and on top of) the
startup tabs.

## API

- `LaunchUrls.fromArgv(argv) -> string[]`: the `http:` and `https:` arguments
  with a host, normalized (`new URL().href`), deduplicated, in order, at most
  `MAX_PER_LAUNCH` (10), each at most 8192 characters. Switches (`--dev`,
  Chromium's own), the executable, `.` and every other scheme are ignored.
- `new LaunchUrls({ getTabViewManager, log?, defer? })`: `defer` is a seam for
  `setImmediate`.
- `open(urls) -> number`: before `ready()` (or while there is no tab manager)
  the links are queued and 0 is returned; afterwards each opens with
  `tabViewManager.createTab(url, { kind: 'user' })` (which activates it) and
  the count opened is returned. A `createTab` that throws is logged and the
  rest still open.
- `ready()`: marks the window ready and opens the queue on the next tick
  (`defer`), after the startup tabs that `StartupTabs` scheduled the same way.
  Calling it again (a renderer reload) is harmless.
- `pending`: a copy of the queue.
