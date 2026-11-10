# SettingsJumpButton

`ui/shell/settings/SettingsJumpButton.js`

The "Jump to a setting" button at the top of the Settings sidebar (`#settingsJumpBtn`): opens the search palette, so any setting is one search away instead of a hunt through the tabs. It shows the Shift Shift keycaps while that shortcut is on: the hint is read when Settings opens and follows the "Search with Shift Shift" switch (`#gsPaletteShift`) live. The button stays hidden when there is no palette to open. It is the Settings twin of the LLM tab's [SetupJumpButton](../../../core/llm-server/ui/js/setup-ui/nav/SetupJumpButton.md), installed by [ShellPalette](../palette/ShellPalette.md).

## Methods

- `new SettingsJumpButton({ openPalette, isShortcutOn?, doc? })`: `openPalette()` toggles the palette; `isShortcutOn()` resolves whether double Shift is enabled.
- `install()` returns false when the button or the opener is missing.
- `SettingsJumpButton.showKeys(btn, on)`.

## Globals

None.
