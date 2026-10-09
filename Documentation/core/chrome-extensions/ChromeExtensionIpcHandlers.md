# ChromeExtensionIpcHandlers

`core/chrome-extensions/ChromeExtensionIpcHandlers.js`

IPC controller for the Settings extensions panel (`core/shell/UISlotManager`).

## Methods

- `new ChromeExtensionIpcHandlers(chromeExtensionService)`.
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
