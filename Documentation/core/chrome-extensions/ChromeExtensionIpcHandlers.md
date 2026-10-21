# ChromeExtensionIpcHandlers

`core/chrome-extensions/ChromeExtensionIpcHandlers.js`

IPC controller for the Settings Chrome Extensions panel.

## Methods

- `new ChromeExtensionIpcHandlers(chromeExtensionService, { storeInstaller, pageWindows, openUrlInTab })`:
  the options default to a [ChromeStoreInstaller](store/ChromeStoreInstaller.md)
  and a [ChromeExtensionPageWindows](ChromeExtensionPageWindows.md) over the
  service; `openUrlInTab` is handed to the page windows.
- `register()` registers:
  - `core.chromeExtensions.list` -> raw array from `list()`; a throw rejects
    the invoke (the panel catches it to show "Failed to load extensions").
  - `core.chromeExtensions.pickFolder` -> raw `{ canceled: true }` or
    `{ canceled: false, path }` from a folder dialog
    ([PathPicker](../shared/ipc/PathPicker.md), focused-window fallback).
  - `core.chromeExtensions.installUnpacked(srcPath)` -> `{ success: true, extension }`
    or `{ success: false, error }`.
  - `core.chromeExtensions.remove(id)` and `core.chromeExtensions.toggle(id, enabled)`
    -> `{ success: <boolean the service returned> }`; a throw is `{ success: false, error }`.
  - `core.chromeExtensions.catalog` -> raw array: every
    [ChromeStoreCatalog](store/ChromeStoreCatalog.md) entry plus `storeUrl`,
    `installed`, `installedVersion`, `enabled`.
  - `core.chromeExtensions.installFromStore(idOrUrl)` -> `{ success: true, extension }`
    or `{ success: false, error }`; installs, or updates an installed copy.
  - `core.chromeExtensions.checkUpdate(id)` -> `{ success: true, update }`
    (`{ id, installedVersion, latestVersion, updateAvailable }`).
  - `core.chromeExtensions.openPage(id, kind)` -> `{ success: true, reused }`
    or `{ success: false, error }`.

## openPage anchor

`core.chromeExtensions.openPage(id, kind, at)` accepts an optional
`at = { x, y }` from the toolbar buttons; with the sender's BrowserWindow it
becomes the `anchor` passed to `ChromeExtensionPageWindows.open`. Anything
else (or no window) passes `null`, the ordinary window.

## Remove and disable close the extension's windows

`core.chromeExtensions.remove` and `core.chromeExtensions.toggle` (to
disabled) call `ChromeExtensionPageWindows.closeFor(id)` first, so a popup or
options window does not linger on a dead extension.
