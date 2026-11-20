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

## Options an agent would otherwise miss

The MCP descriptions carry these, because each one answers a way agents got stuck:

- `browser_get_tabs`: the tab strip by default; `includeSilent` adds tabs an agent opened with
  `silent=true`, `includeHidden` adds the persisted tabs the user keeps off the strip (mail, chat).
- `browser_create_tab`: a silent tab has a normal-sized viewport, and tabs its links open are silent too.
- `browser_observe_page`: `selector` lists one part of a long page (a form, a dialog, a results list) in full.
- `browser_get_source`: `markdown` and `text` for reading, `clean`, `minimal` and `full` for structure;
  `selector` reads only the elements it matches.
- `browser_screenshot`: `selector` captures one element whole, for small text on a long page.
- `browser_extract_data` and `browser_collect_list`: a child selector ending in `@attribute`
  (`a.title@href`, `img@src`, `input@value`) reads the attribute instead of the text.
- `browser_type`: a rich-text editor in an iframe is typed into by targeting the iframe.
- `browser_click_until` (chat `click_until`): keeps clicking one link or button, found by its label, until
  `untilText`, `untilSelector` or `untilUrl` holds; `alert` puts the tab in front of the user at the end.
  The loop is [RepeatClicker](tab-manager/RepeatClicker.md).

The prose the local models read for chat tools lives elsewhere (BrowserTools
`TOOL_DEFINITIONS` and the chat tool schemas) and keys on the same `id`; a
cross-surface test must keep those sets equal to `chatActionIds()` once those
files are ported.
