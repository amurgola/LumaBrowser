# DesktopNotifier

`extensions/page-change-detector/DesktopNotifier.js`

Shows the desktop notification for a detected change.

## Methods

- `show(headline, detail)`: an Electron `Notification` titled `Page Monitors`
  with `body: headline`, `subtitle: detail`. Electron is required on use so
  tests can run without it.
