# ToolListView

`extensions/tool-forge/ui/ToolListView.js`

## Methods

- `ToolListView.render(el, { tools, encryptionAvailable, notice }, on)`: the
  "My Tools" header with "Import tool...", the unencrypted-storage warning,
  the notice, and the empty line or one card per tool
  (name with status chip, description, `net: <hosts | no network>`, "needs
  config" when required slots are missing, Edit / Export / Delete calling
  `on.edit/exportTool/deleteTool(name)`).
- `ToolListView.statusChip(status)`: the escaped `.luma-chip tf-status-<status>`.
- `ToolListView.notice(notice, onDismiss)`: the tab's outcome as the shared
  [Notice](../../../core/llm-server/ui/js/notice/Notice.md) (`{ kind: 'ok' | 'warn' | 'bad', title?, text?, lines? }`),
  placed with `.tf-notice`. The edit view uses it too.
