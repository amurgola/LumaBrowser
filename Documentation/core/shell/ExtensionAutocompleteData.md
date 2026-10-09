# ExtensionAutocompleteData

`core/shell/ExtensionAutocompleteData.js`

The autocomplete catalog for the extension code editor (Monaco) and the coding
agent's API reference: everything an extension can use.

## Methods

- `ExtensionAutocompleteData.build(extensionApis)` returns
  `{ contextProperties, manifestFields, cssClasses, rendererContext, mcpToolFields, extensionApis, dependencyShortcutInfo }`.
  `extensionApis` is `{ [id]: { manifest, api } }` from the live
  ExtensionManager; each becomes `{ name, description, methods }`, where each
  API member is a completion tagged `METHOD` (functions) or `FIELD` (anything
  else).
- Static catalogs, each a list of `{ label, kind?, detail, documentation? }`:
  - `CONTEXT_PROPERTIES`: the `context` object ExtensionManager injects.
  - `MANIFEST_FIELDS`: fields of an extension's `manifest.js`.
  - `CSS_CLASSES`: utility classes from `extension-styles.css`.
  - `RENDERER_CONTEXT`: the renderer-side slot manager API.
  - `MCP_TOOL_FIELDS`: fields of an MCP tool definition.
- `DEPENDENCY_SHORTCUT_INFO`: explains `context.<depId>` shortcuts for
  extension dependencies.

Completion kinds come from
[CompletionKind](extension-autocomplete/CompletionKind.md).

## Why

The static catalog is the single source of truth for the extendable surface.
The editor's Monaco autocomplete and the coding agent's capabilities snapshot
(`ExtensionManager`, reading `CONTEXT_PROPERTIES` and `MANIFEST_FIELDS`) both
derive from it, so updating it once teaches both. Extension APIs are merged at
request time so newly installed or created extensions are always included.
