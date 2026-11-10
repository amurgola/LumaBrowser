# ExtensionTabNav

`core/llm-server/ui/js/setup-ui/extensions/ExtensionTabNav.js`

The DOM half of extension Setup tabs: one nav button in `#pageNav` and one hidden pane in `#setupRoot` per tab. The tab's `group` (see [SetupTabRegistry](../../../../../chat/SetupTabRegistry.md)) places the button: `engines` joins LLM, Image and Music before `#navAdvanced`; `integrations` (the default) sits under an "Integrations" label; `developer` under a "Developer" label at the end. Each button carries `data-group`; `ExtensionTabNav.groupOf(tab)` normalises the value.

## Methods

- `hosts()`: `{ nav, root }` or null; `has(id)`, `ids()`, `pane(id)`.
- `add(hosts, tab)`: button `data-view="ext:<id>"` (class `pagenav-ext`, label as text, an inline `<svg>` icon or the puzzle piece, title = description or label) and pane `#extPane-<id>` showing "Loading…".
- `remove(nav, id)`: returns true when the removed button was active; a group's separator and label go with its last tab.
- `ExtensionTabNav.failedHtml(message)`: the escaped failure callout.
- `ExtensionTabNav.OFFLINE_HTML`: the warning callout for a page running from its `file://` fallback copy, where no extension bundle can load because the local API server is not listening; it sends the user to Settings > API & MCP (REST API switch and port).

## Globals

Reads `document`.
