# SitePermissionsPanel

`ui/shell/settings/security/SitePermissionsPanel.js`

Remembered per-origin answers (camera and microphone when either is set, pop-ups and notifications when set) with Clear and Clear all; re-read when the Security tab opens.

## Methods

- `install()`, `refresh()`.
- `answerLabel(v)`, `statesOf(row)`, `rowsHtml(rows)` (static); `KINDS` the kinds and labels shown.

## Globals

Reads `window.electronAPI.sitePermissions`.
