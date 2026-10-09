# HubTools

`extensions/personal-hub/HubTools.js`

The `hub_*` MCP tools the chat agent, sub-agents, background runs and external
MCP clients use to read and manage the user's calendars, conversation queue
and task board. `mcp-tools.js` exports `{ tools: HubTools.TOOLS, handler }`.

## Tools

- `hub_overview`: open threads by app, the threads needing attention (high or
  urgent), tasks per column, today's events, sync health, and
  `signInsNeedingAttention` (persisted tabs or tokens that lost their sign-in,
  and calendars whose tab is gone). The first call for "what's on my plate".
- `hub_list_events { days | from, to }`, `hub_sync_status`, `hub_list_columns`.
- `hub_list_threads { state, app, limit }`, `hub_get_thread { id }`.
- `hub_list_notifications { app, since, limit = 100, offset }`: the raw
  intercepted-notification log, newest first. The Dashboard snapshot
  ([HubContext](HubContext.md)) carries only today's, so this is how the model
  reaches earlier days.
- `hub_list_tasks { columnKey, sourceId, includeArchived, includeHidden }`,
  `hub_get_task { id }`.
- Mutating (the approval gate applies): `hub_set_thread_state`,
  `hub_enrich_thread` (by id, or app + threadKey; creates the thread when
  missing), `hub_create_task` (async; local, or with `sourceId` and optional
  `listId` created in that ClickUp workspace too, assigned to the user; when
  the column has no linked status in that list it replies `success: false`
  with `needsStatus`, `statuses` and `column`, and a second call with
  `status` creates it and links the status), `hub_update_task`,
  `hub_move_task { id, columnKey, status? }` (a ClickUp task whose column has
  no linked status in its list replies `moved: false` with `needsStatus` and
  `statuses`; nothing moves until it is called again with `status`, which is
  linked), `hub_link_status { status, columnKey?, newColumn? }` (links a
  status that has no column to `columnKey`, or with `newColumn` makes it a
  column of its own; its tasks move there), `hub_hide_tasks { ids, hidden = true }`
  (returns `changed`; hidden tasks stay synced), `hub_add_task_message`
  (author `agent`), `hub_link_thread_task`, `hub_sync_now`.

## Methods (static)

- `handle(api, toolName, args = {})`: throws `The Hub is not active` without
  an API and `Unknown hub tool: <name>`; otherwise the handler's
  `{ success, ... }` result.

## Why `hub_enrich_thread`

The conversation queue is meant to be worked by agents: a background run (or
n8n) reads the raw notifications of a thread and writes back a summary,
priority and labels, which is what the inbox widget and `hub_overview` show.
