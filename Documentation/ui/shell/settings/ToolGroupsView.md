# ToolGroupsView

`ui/shell/settings/ToolGroupsView.js`

The shared tool allow-list (group checkbox with indeterminate state, on/total count shown as plain text (`.luma-badge.gs-tool-count`, drawn without a pill), Customize per-tool list, locked tools). Markup uses the `.gs-tool-group*` and `.gs-tool-list` classes from settings-content.css, no inline styles. Listeners are wired once per container and read the latest render.

## Methods

- `ToolGroupsView.render(container, groups, onSet, opts)`.

## Globals

None.
