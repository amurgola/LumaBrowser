# AppTray

`app/window/AppTray.js`

The system tray icon and menu.

## Methods

- `new AppTray({ Tray, Menu, nativeImage, iconPath, isSuspended, onShow, onQuit })`.
- `create()` builds the tray from the icon, sets the menu, and wires click and
  double-click to `onShow`; returns the Electron tray.
- `refresh()` rebuilds tooltip and menu; false before `create()` or after the
  tray is destroyed.
- `AppTray.template(suspended, onShow, onQuit)`: while suspended,
  `Window unavailable. Open to retry` and a separator first; then
  `Show LumaBrowser`, a separator, `Quit`. Tooltip `LumaBrowser`, or
  `LumaBrowser: window unavailable. Open to retry.` while suspended.
