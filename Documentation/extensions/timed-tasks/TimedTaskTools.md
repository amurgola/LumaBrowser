# TimedTaskTools

`extensions/timed-tasks/TimedTaskTools.js`

The `timed_tasks_*` MCP tools for the chat agent and external MCP clients.

## Methods (static)

- `TOOLS`: `timed_tasks_list`, `timed_tasks_create` (mutating),
  `timed_tasks_set_paused`, `timed_tasks_delete` (mutating),
  `timed_tasks_trigger`, `timed_tasks_get_runs`. Definitions unchanged.
- `handle(api, toolName, args = {})`: throws `Timed Tasks is not active`
  without an API and `Unknown timed_tasks tool: <name>`. `trigger` runs
  silently (tab auto-closes); `get_runs` defaults to 10.
