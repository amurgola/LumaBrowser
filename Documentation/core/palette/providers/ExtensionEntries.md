# ExtensionEntries

`core/palette/providers/ExtensionEntries.js`

Settings-catalog entries for extensions, derived from the renderer extension
list (`ExtensionManager#getRendererExtensionList()`) each time the palette
searches. Extensions need no catalog work of their own to be findable.

## Methods

- `ExtensionEntries.fromList(rows)`: for each enabled, non debug-only extension:
  - `ext.<id>`: the extension by name and description. Its target is its own
    Settings tab when the manifest's settings use `placement: 'tab'`
    (`{ surface: 'shell', tab: tabId }`), else its page under Settings >
    Extensions (`{ surface: 'extension', extensionId }`).
  - `ext.<id>.setup`, when it declares an LLM Setup tab: that Setup page
    (`{ surface: 'setup', page: 'ext:<id>' }`).

Keywords add "extension", "add-on", "plugin" and the id with dashes as spaces.
