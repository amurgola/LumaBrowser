# SitePermissionsPanel

`ui/shell/settings/security/SitePermissionsPanel.js`

Remembered per-origin answers (camera and microphone when either is set; pop-ups, notifications and "Local AI model", the web Prompt API's `localModel` kind, when set) with Clear and Clear all; re-read when Settings opens and when the Privacy & permissions tab is clicked.

## Methods

- `install()`, `refresh()`.
- `answerLabel(v)`, `statesOf(row)`, `rowsHtml(rows)` (static); `KINDS` the kinds and labels shown.

## Globals

Reads `window.electronAPI.sitePermissions`.
