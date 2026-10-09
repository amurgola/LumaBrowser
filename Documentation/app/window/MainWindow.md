# MainWindow

`app/window/MainWindow.js`

Creates and manages the main window.

## Methods

- `new MainWindow(ctx, { windowServices, log? })`.
- `create()` (also `ctx.mainWindow`):
  1. a `BrowserWindow` from [MainWindowOptions](MainWindowOptions.md) with
     `<root>/preload.js`;
  2. [RendererRecovery](../../core/shell/RendererRecovery.md) (`ctx.rendererRecovery`):
     reloads `index.html`, skips everything while quitting, refreshes the tray
     on suspend and renew;
  3. OS shutdown marks the quit as system-driven (no dialog): `session-end` on
     Windows, `powerMonitor` `shutdown` (then `app.quit()`) elsewhere, hooked once;
  4. `loadFile('index.html')`; boot logs on `dom-ready` and `did-finish-load`;
     renderer console lines starting `[luma-boot` are forwarded to main's log;
  5. [WindowKeys](WindowKeys.md); the stale `openDevTools` setting is deleted;
  6. the [AppTray](AppTray.md) (`<root>/assets/tray-icon.png`, `ctx.tray`);
  7. on every `did-finish-load`: zoom 1.0, `settings-loaded` `{ webhookUrl }`,
     then [StartupTabs](StartupTabs.md)`.open()`;
  8. on `closed`: destroy every tab, forget the window, stop the gateway;
  9. `window:state` `{ maximized }` (maximized or full screen) on
     maximize/unmaximize/enter/leave full screen and each load;
  10. minimize hides to the tray;
  11. [WindowServices](../browser/WindowServices.md)`.wire(win)`.
- `show()` restores, renews a suspended renderer, shows and focuses; false
  without a window.
- `wasClosed()` true once a window was created and has since closed.
- `refreshTray()`.
