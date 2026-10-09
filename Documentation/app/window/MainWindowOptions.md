# MainWindowOptions

`app/window/MainWindowOptions.js`

The main BrowserWindow options.

## Methods

- `MainWindowOptions.build({ platform, startHidden, iconPath, preloadPath })`:
  1400 x 900, `show: !startHidden`, `autoHideMenuBar`, background `#0b1220`,
  and web preferences `{ nodeIntegration: false, contextIsolation: true, preload, zoomFactor: 1.0 }`
  on every platform, plus `titleBar(platform)`.
- `MainWindowOptions.titleBar(platform)`: macOS `hiddenInset` with traffic
  lights at (12, 14); Linux frameless, `hidden`, transparent (`#00000000`) and
  no overlay (Electron painted a second set of buttons with one, and the
  rounded corners come from CSS); Windows frameless with a `titleBarOverlay`
  (`#0b1220`, symbols `#8a95ad`, 40 px).
