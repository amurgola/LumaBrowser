# SettingsFeedback

`ui/shell/settings/SettingsFeedback.js`

Saved/Failed ticks beside autosaving controls (placed right after the row label, which may sit directly in the `.gs-row` or inside its `.gs-row-text` column) with a row error line, and the modal toast.

The toast is the shared `.luma-toast` pinned to the top of the Settings pane (design system, [Notices](../../DesignSystem.md#notices)): the message, at most one action and a close icon, with no status dot. A failure is tinted, announced as `role="alert"` and stays until dismissed or until Settings closes; a success leaves after 3.5 s (8 s when it carries an action). While the Settings modal is closed the message goes to the notification log instead, with its action.

## Methods

- `markSaved(control, ok, errorMessage)`, `hideToast()`.
- `toast(message, kind, opts)`: `kind` is `ok` or `bad` (the log's `error` reads as `bad`). `opts`: `{ sticky?, action?: { label, run() } }`; `sticky` keeps a success until dismissed, and the action hides the toast when used. Build an action that goes to a setting with [SettingJump](SettingJump.md).
- `SettingsFeedback.flashBadge(badge, ok)`, `SettingsFeedback.isBad(kind)`, `SettingsFeedback.ttl(bad, hasAction, sticky)` (ms, 0 for no timer).

## Globals

None (published as `window.gsMarkSaved` / `settingsToast`).
