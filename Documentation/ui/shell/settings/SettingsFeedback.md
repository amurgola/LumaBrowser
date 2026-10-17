# SettingsFeedback

`ui/shell/settings/SettingsFeedback.js`

Saved/Failed ticks beside autosaving controls (placed right after the row label, which may sit directly in the `.gs-row` or inside its `.gs-row-text` column) with a row error line, and the modal toast (falls back to the notification log when Settings is not on screen).

## Methods

- `markSaved(control, ok, errorMessage)`, `toast(message, kind, opts)`, `hideToast()`.
- `SettingsFeedback.flashBadge(badge, ok)`.

## Globals

None (published as `window.gsMarkSaved` / `settingsToast`).
