# LocalPrefs

`core/network-sharing/webapp/public/js/shim/LocalPrefs.js`

Per-device chat preferences in localStorage: `luma.web.sidebar` (`'1'` collapsed)
and `luma.web.model`.

## Methods

- `new LocalPrefs(storage)`.
- `getSidebarCollapsed()`: a bare boolean (the desktop contract; legacy returned
  `{ success, collapsed }`, see [LlmApiShim](LlmApiShim.md)).
- `setSidebarCollapsed(collapsed)`, `setLastModelRef(ref)`: `{ success: true }`.
