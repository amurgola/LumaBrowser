# WindowHandle

`extensions/selenium-driver/WindowHandle.js`

## Methods

- `WindowHandle.fromTabId(tabId)` -> `luma-tab-<id>`.
- `WindowHandle.toTabId(handle)` -> number, or the string after the prefix when not
  numeric, or null when not a handle.
