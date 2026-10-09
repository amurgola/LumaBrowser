# SitePermissionsPanel

`ui/shell/settings/security/SitePermissionsPanel.js`

Remembered camera / microphone answers per origin with Clear and Clear all; re-read when the Security tab opens.

## Methods

- `install()`, `refresh()`.
- `answerLabel(v)`, `rowsHtml(rows)` (static).

## Globals

Reads `window.electronAPI.sitePermissions`.
