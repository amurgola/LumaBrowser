# SettingJump

`ui/shell/settings/SettingJump.js`

The action a toast, notice or log entry carries to take the user to one setting. It calls the search palette's reveal (`core.palette.reveal`, see [PaletteIpcHandlers](../../../core/palette/PaletteIpcHandlers.md)), so the page opens, whatever folds the row away unfolds and the row is highlighted, in the Settings modal or the LLM tab alike. A message names the place by its catalog id instead of describing the way there in words (design system, [Notices](../../DesignSystem.md#notices)).

## Methods

- `SettingJump.action(settingId, label?)` returns `{ label, run() }` for [SettingsFeedback](SettingsFeedback.md)`.toast` options, [Notice](../../../core/llm-server/ui/js/notice/Notice.md) or a notification-log entry. `settingId` is an id from the catalogs in `core/palette/catalog`; the label defaults to "Show setting".
- `SettingJump.reveal(settingId)` resolves main's `{ success, error? }`, or null when there is no bridge or the call fails.

Used by [IdeInstallerList](general/IdeInstallerList.md): a failed install offers "Show IDEs" (or editors, or mods), which reveals `general.<fold>.list`.

## Globals

Reads `window.ipcBridge.invoke`.
