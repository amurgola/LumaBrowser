# ShellPalette

`ui/shell/palette/ShellPalette.js`

The browser chrome's side of the search palette ([SearchPalette](../../../core/palette/SearchPalette.md)).
Built and installed by [ShellApp](../app/ShellApp.md); forwarded messages reach
it from [ChromeKeyboard](../keyboard/ChromeKeyboard.md).

## Methods

- `new ShellPalette({ host, reveal, actions, store, feedback?, settingsEl? })`:
  `reveal` is [SettingsReveal](../settings/SettingsReveal.md), `actions` is
  [AcceleratorActions](../keyboard/AcceleratorActions.md).
- `install()`: wires the "Search with Shift Shift" switch and the sidebar's
  "Jump to a setting" button ([SettingsJumpButton](../settings/SettingsJumpButton.md)), and remembers each
  Settings tab the user visits (`settings:open` and tab clicks) through
  `core.palette.record`.
- `handleForwarded(p)`: true when the `tab-view:accelerator` message was the
  palette's:
  - `open-palette` (a double Shift anywhere in the window): `toggle()`;
  - `palette-reveal`: `reveal.reveal(target)`;
  - `palette-run`: runs the browser command for the active tab.
- `toggle()`: hides an open chrome overlay first, then invokes
  `core.palette.toggle`.

## The switch

Settings > General > Luma in the browser > "Search with Shift Shift" (`#gsPaletteShift`)
reads `core.palette.getDoubleShift` and saves through
`core.palette.setDoubleShift`; main owns the value (`core.palette.doubleShift`,
default on). The save is confirmed with SettingsFeedback.

## Globals

Reads `window.ipcBridge.invoke`.
