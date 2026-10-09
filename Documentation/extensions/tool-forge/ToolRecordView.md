# ToolRecordView

`extensions/tool-forge/ToolRecordView.js`

The record shapes the "My Tools" tab reads. Config is reported per slot as
configured or missing ([ConfigStore](ConfigStore.md)`#status`), never as values.

## Methods (all static)

- `listRow(tool, configStore)`: `{ name, label, description, status, version,
  allowedHosts, configSlots, config, lastTest: { ok, at } | null, updatedAt }`.
- `editorRecord(tool, configStore)`: `{ name, label, description, inputSchema,
  configSlots, allowedHosts, code, status, version, lastTest, config }`.
