# MyToolsSetupActions

`extensions/tool-forge/MyToolsSetupActions.js`

Backend of the "My Tools" Setup tab (`setup.invoke` IPC).

## Methods

- `new MyToolsSetupActions({ store, configStore, host, service, files })`.
- `invoke(action, payload)`:
  - `list` -> `{ tools: [ToolRecordView.listRow], encryptionAvailable }`
  - `code.get` (`{ name }`) -> `{ name, code }`
  - `get` (`{ name }`) -> `{ tool: ToolRecordView.editorRecord }`
  - `save` (`{ name, patch }`) -> `service.createTool({ name, ...patch })`, then
    `host.refresh()` (a published tool returns to draft and leaves the catalog)
  - `publish` (`{ name }`) -> `service.publishTool({ name })` (global enable only)
  - `config.set` (`{ name, values }`) -> `{ config: configStore.setValues(...) }`
  - `delete` (`{ name }`) -> `{ removed }`; also clears its config and refreshes
  - `test` (`{ name, args, configOverrides }`) -> `service.testTool(...)`
  - `export` (`{ name }`), `import` -> [ToolBundleFiles](ToolBundleFiles.md)

  `Tool not found` for an unknown tool (except `delete`), `Unknown action: <action>`.
