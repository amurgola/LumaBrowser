# BrowserActions

`core/browser/BrowserActions.js`

The one table of browser actions, and the REST, MCP and chat surfaces derived from it.

## Methods

- `BrowserActions.ACTIONS` is the table. Each entry has an `id` and any of:
  - `rest`: `{ method, path, handler }`, `handler` being a BrowserController method name;
  - `mcp`: `{ name, description, properties, required }`, the MCP tool contract
    (the handler itself lives in the MCP tools module);
  - `chat: true` plus `label` (the settings toggle label) when the in-app chat agent exposes it.
- `BrowserActions.restRoutes()` returns copies of every `rest` entry, in table order.
- `BrowserActions.mcpToolDefinitions()` returns `{ name, description, inputSchema }`
  MCP tool definitions, in table order.
- `BrowserActions.chatToolEntries()` returns `{ name: id, label }` for the settings catalog.
- `BrowserActions.chatActionIds()` returns the ids of chat-exposed actions.
- `BrowserActions.TAB_ID` and `BrowserActions.REF` are the shared `tabId` and
  `ref` property descriptors.

## Why

Adding a browser capability used to mean editing three parallel lists (REST
routes, MCP tool definitions, the agent tool list) that had drifted apart. One
entry per action keeps them in step. The order is the order every surface
renders in and follows the agent prompt (observe, act, read).

Some actions have no dedicated route: navigate, refresh and execute_js all
arrive through `PATCH /tabs/:id` (`update_tab`). `activate_tab` and
`update_tab` are REST-only.

The prose the local models read for chat tools lives elsewhere (BrowserTools
`TOOL_DEFINITIONS` and the chat tool schemas) and keys on the same `id`; a
cross-surface test must keep those sets equal to `chatActionIds()` once those
files are ported.
