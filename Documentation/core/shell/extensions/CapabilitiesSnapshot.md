# CapabilitiesSnapshot

`core/shell/extensions/CapabilitiesSnapshot.js`

What a new extension can build on, fed to the coding agent (`context.code.capabilities()`).

## Methods

- `new CapabilitiesSnapshot({ coreServices, mcpAggregator, restGateway, ledger })`.
- `build(excludeId?)` -> `{ coreServices, extensions, contextApi, manifestFields }`:
  - `coreServices` the dependency keys whose service is present
    (`core:browser`, `core:database`, `core:llm-service`);
  - `extensions` every active extension except `excludeId`, sorted by id:
    `{ id, name, description, api (key names), tools (its MCP tool names),
    hasRoutes, surfaces }`;
  - `contextApi` and `manifestFields` from [ExtensionAutocompleteData](../ExtensionAutocompleteData.md),
    the same catalog the extension editor's autocomplete uses.
  A failing aggregator or gateway leaves those parts empty.
