# AgentsTab

`extensions/agent-manager/ui/AgentsTab.js`

The "Agents" tab: sub-agents with import/export and a create/edit form.

## Methods

- `new AgentsTab(el, api)`, `mount()`: injects `<link id="am-css">`, refreshes.
- `refresh()`: `list`, `tools` and `api.llmDiagAPI.listModels()` in
  parallel; failure shows "Failed to load agents: <message>".
- `openForm(agent | null)` (loads `kb.list` for an existing agent),
  `closeForm()`, `saveForm(form)` (`update` or `create`; errors inline).
- `deleteAgent(id)` (alerts "Delete failed: ..."), `exportAgent(agent)`,
  `importAgent()` (title "Imported "X" with N knowledge docs", warnings as lines).
- `modelLabel(ref)`: "App default", the model label, or the ref.
