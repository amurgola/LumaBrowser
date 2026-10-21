# ChromeStorePanel

`core/shell/ui/settings/ChromeStorePanel.js` (ES module)

The lite extension store at the top of Settings > Extensions > Chrome
Extensions, laid out in the Settings row contract (DesignSystem.md).

## Methods

- `new ChromeStorePanel(container, { invoke, onInstalled })`: `invoke` is the
  parent panel's IPC call; `onInstalled()` refreshes its installed list.
- `load()`: fetches `core.chromeExtensions.catalog` and renders a group head
  (title plus a search box), one `gs-group-subtitle` per category in catalog
  order, and under it one `.gs-row.chrome-store-row` per entry: the name, the
  word "Partial support" in the warning color only when compatibility is
  partial, the description and notes as the help line, and on the right either
  an Install button or "Installed vX". Below the list sits "Install from a
  link": a text field for any store URL or id and an Install button. Install
  calls `core.chromeExtensions.installFromStore`, shows "Installing..." while it
  runs, and on failure re-enables the button and shows the error above the
  list. Search matches name, description, notes and category label.

## Globals

Reads nothing directly; IPC goes through the `invoke` it is given.

## Installed rows

An installed catalog entry shows its version and a Remove button, wired to the
`onRemove(id, name)` option (ChromeExtensionsPanel's confirm-and-remove).
`onInstalled(extension)` now receives the installed extension so the panel can
announce it.

## Cards (2026-10-21)

Catalog entries are [ExtCard](ExtCard.md)s grouped under
`.ext-pane-group-label` category labels: primary `Install` (or a disabled
`Installing...`), the state word `Installed` or `Partial support`, and a tray
with the description plus notes, Category, how well it works, and Remove for
an installed one. `cardSpec(entry)` builds the card. The install-by-link field
sits under the list with a one-line note.
