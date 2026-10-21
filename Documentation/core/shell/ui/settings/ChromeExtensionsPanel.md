# ChromeExtensionsPanel

`core/shell/ui/settings/ChromeExtensionsPanel.js` (ES module)

Settings > Extensions > Chrome Extensions: the lite store
([ChromeStorePanel](ChromeStorePanel.md)), install unpacked, open, update,
enable, disable, remove, and the Electron limitations notes.

## Methods

- `new ChromeExtensionsPanel(container)`, `load()`: lays out two
  `gs-subsection` groups, the store and "Installed" (title, an "Install
  unpacked folder" button on the right, hairline `.ext-list-item` rows with the
  source as the help line and the id as a tooltip, the Limitations disclosure
  under them), then fills both. The installed list uses
  `core.chromeExtensions.list`, `.pickFolder`, `.installUnpacked(path)`,
  `.toggle(id, enabled)`, `.remove(id)` (after a confirm), `.openPage(id, kind)`
  (Open / Options buttons, shown for an enabled extension with that page) and,
  for store installs, Update: `.checkUpdate(id)` and only then
  `.installFromStore(id)`. Re-renders after every change; the store refreshes
  the installed list after it installs.

## Globals

Reads `window.ipcBridge.invoke`, `window.LumaModal` (through Dialogs).

## Layout, running notice and reload

- The Installed list comes first and the store after it, so Remove is in view
  without scrolling past the catalog. The limitations sit in their own section
  at the end.
- After an install (store or unpacked) or enabling an extension, a notice says
  it is installed and running and that tabs already open pick it up when they
  reload, with a Reload open tabs button. New tabs and the toolbar button get
  the extension at once; only content scripts in pages that were already open
  need the reload, as in Chrome.
- Reload open tabs reloads `reloadTargets(tabs)` from `tabAPI.getOrder()`:
  `kind === 'user'`, not silent, http(s) only.
- Remove (from the list or a store row) asks first through `Dialogs.confirm`.
- The pane re-renders on `chrome-extensions:modified` (the toolbar disabled or
  removed something) once it has been loaded.

## Cards, Update and Reinstall (2026-10-21)

Installed extensions are [ExtCard](ExtCard.md)s under an "Installed <count>"
head with Install unpacked folder:

- Checkbox (`.chrome-ext-toggle`): enabled.
- Summary: the manifest description (localized), else the source.
- Primary: `Update to vX` when the Web Store reported a newer version,
  otherwise `Open` when the extension has a popup.
- Tray: description; Source, Latest (once checked) and ID; Options,
  `Reinstall` (store installs with no newer version), Remove.

`_checkUpdates()` asks `core.chromeExtensions.checkUpdate` once per store
install per Settings session, in the background, and redraws the cards as
answers arrive. Update and Reinstall run the same `installFromStore`.
Buttons are handled by one delegated click listener on the list; the
checkboxes get their own `change` listeners. Open cards stay open across
redraws.
