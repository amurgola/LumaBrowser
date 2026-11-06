# TabPreload

`core/browser/tab-preload/TabPreload.js`

Installs the tab preload: injects the main-world script at document start and starts the notification forwarder and the password manager's [LoginFormWatcher](LoginFormWatcher.md) and [AddressFormWatcher](AddressFormWatcher.md). CommonJS.

## Methods

- `new TabPreload({ ipcRenderer, webFrame }, window, { chrome, passkey }).install()`:
  `webFrame.executeJavaScript(MainWorldScript.build(...))` (a rejection is
  logged as `webview-preload: main-world injection failed:`), then
  `NotificationForwarder.listen()` `LoginFormWatcher.install()` and `AddressFormWatcher.install()`.
- `TabPreload.optionalSource(load)`: `load().SOURCE`, or `''` when the module
  cannot load (the identity shims are best-effort).
