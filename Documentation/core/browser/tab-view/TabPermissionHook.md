# TabPermissionHook

`core/browser/tab-view/TabPermissionHook.js`

Puts a tab's session under the deny-by-default permission policy.

## Methods

- `TabPermissionHook.install(entry)`: with an installed
  [PermissionManager](../PermissionManager.md) (`PermissionManager.current()`),
  `attachSession(entry.webContents.session)` (idempotent per session, shared or
  private). Without one (unit tests, early boot), a fallback handler grants only
  `notifications` and logs each decision.
