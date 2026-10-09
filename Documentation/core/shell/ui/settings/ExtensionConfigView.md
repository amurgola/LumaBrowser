# ExtensionConfigView

`core/shell/ui/settings/ExtensionConfigView.js` (ES module)

Shows one extension's configuration: its own settings page under the header, or a default metadata panel (with a link to the LLM tab's Setup when that is where it is configured).

## Methods

- `new ExtensionConfigView({ pane, meta, settingsEntries, hooks, fileActions, onBack, onOpenTab })`.
- `show(extensionId)`: a page that owns a top-level tab opens that tab
  (`onOpenTab`) instead. Otherwise, with a page, the title is the row name and a different
  page label becomes a badge; a page with its own Save button gets "This page
  saves when you click Save."; `onActivate` runs. Without one: Version,
  Identifier and Location rows, and either "This extension has no settings of
  its own..." or "Open in the LLM tab" (`core.llmServer.openSetup(null)`, then
  Settings closes).

## Globals

Reads `window.ipcBridge.invoke`.
