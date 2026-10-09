# ExtensionEditorHints

`core/shell/extension-admin/ExtensionEditorHints.js`

Autocomplete data for the extension code editor, built from the live
ExtensionManager at request time so newly installed or created extensions are
always included.

## Methods

- `new ExtensionEditorHints(extensionManager)` (reads `extensions` and `manifests` maps).
- `build(extId?)` [ExtensionAutocompleteData](../ExtensionAutocompleteData.md).build
  over every active extension's `{ manifest, api }` plus disabled extensions'
  manifests (so their ids still appear), with `contextHints`:
  - null without `extId` or for an unknown id;
  - else `{ availableContextProps, extensionDependencies }`: the context
    properties its required or optional core capabilities give it (`core:database`
    -> `db`, `core:browser` -> `browser`, `core:llm-service` -> `llm`), and `{ id, name, description }` for each `ext:` dependency.
