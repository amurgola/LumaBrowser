# ExtensionRow

`core/shell/ui/settings/ExtensionRow.js` (ES module)

One row of the extensions list: name, version, cleaned description, dependency tags, lock or not-running reason, last error, and Configure, Delete and the enable switch.

## Methods

- `new ExtensionRow({ meta, host, onChanged, onConfigure, onDelete })`.
- `build(ext, constraints, errors)` returns the `.ext-list-item` element. Core
  dependencies are omitted; a missing extension dependency says "missing". The
  switch calls `core.shell.toggleExtension(id, enabled)`; on success it updates
  the row, disables or enables the UI through the host, dispatches
  `extension-toggled { id, enabled }` and re-renders; on failure it reverts and
  shows the reason as the row's live error line.
- `ExtensionRow.rowError(item, message)`.
- Every manifest string is escaped with `HtmlEscaper.escape` (quotes included),
  so a hostile name cannot open an attribute.

## Globals

Dispatches `extension-toggled` on `document`; reads `window.ipcBridge.invoke`.
