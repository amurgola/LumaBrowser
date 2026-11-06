# ActionCatalog

`core/palette/catalog/ActionCatalog.js`

The browser commands the search palette can run, a frozen array of
`{ id, label, keys, keywords, run }`. `run.shell` names an
[AcceleratorActions](../../../ui/shell/keyboard/AcceleratorActions.md) action
run in the chrome for the active tab: new tab, new private window, reopen closed
tab, close tab, history, bookmark manager, bookmark this page, downloads, find in
page, print, reload, hard reload, full screen, zoom in, zoom out, reset zoom,
clear browsing data, go to address bar. `run.main` is run by
[PaletteOpener](../PaletteOpener.md) itself (`open-chat`, `open-settings`).
`keys` is the shortcut shown on the row, so the palette also teaches the keyboard.

## Adding a command

Add an entry with an existing AcceleratorActions action name and its shortcut as
the [AcceleratorTable](../../../ui/shell/keyboard/AcceleratorTable.md) binds it.
