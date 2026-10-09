# ExtensionsListView

`core/shell/ui/settings/ExtensionsListView.js` (ES module)

Settings > Extensions list split into the Extensions (enabled) and Inactive panes with the enabled count.

## Methods

- `new ExtensionsListView({ panes, meta, rowFactory, onShown })`.
- `show()`: reads `core.shell.getToggleConstraints` and
  `core.shell.getExtensionErrors` (each failure logged, treated as empty), sorts
  enabled first then by load order, splits by the constraint's `enabled`, sets
  `#extActiveCountBadge`, swaps both panes only after every await (two racing
  refreshes cannot duplicate the list), then `onShown()`. Empty texts: "No
  extensions installed", "No active extensions", "No inactive extensions".
- `isVisible()`, `refreshIfVisible()`.

## Globals

Reads `window.ipcBridge.invoke`.
