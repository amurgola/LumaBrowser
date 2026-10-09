# MonitorTools

`extensions/page-change-detector/MonitorTools.js`

The `page_monitor_*` MCP tools for the chat agent and external MCP clients.

## Methods (static)

- `TOOLS`: `page_monitor_list`, `page_monitor_create` (mutating),
  `page_monitor_check`, `page_monitor_set_paused`, `page_monitor_history`,
  `page_monitor_delete` (mutating). Definitions unchanged.
- `handle(api, toolName, args = {})`: throws `Page Monitors is not active`
  without an API and `Unknown page_monitor tool: <name>` for an unknown name.
  `create` applies `selectors` with a follow-up update; `history` defaults to
  10 changed-only entries; `set_paused` reports `Monitor not found`.
- `slim(row)`: the camelCase monitor view (`paused`, `status` default `idle`,
  `selectors` default `[]`, `webhookUrl` default `''`, ...).
