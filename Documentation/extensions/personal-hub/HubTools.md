# HubTools

`extensions/personal-hub/HubTools.js`

The `hub_*` MCP tools the chat agent, sub-agents, background runs and external
MCP clients use to read and manage the user's calendars, activity feed
and task board. `mcp-tools.js` exports `{ tools: HubTools.TOOLS, handler }`.

## Tools

- `hub_overview`: `activityToday` (what reached the user since local midnight:
  `{ items, byApp, byKind, latest, highPriority }`, the last two at most ten
  briefs `{ id, app, kind, title, lastAt, priority, summary, taskId }`, read
  from up to 200 active items; background about the day, so there is no unread
  figure), tasks per column, today's events, sync health, and
  `signInsNeedingAttention` (persisted tabs or tokens that lost their sign-in,
  and calendars whose tab is gone). The first call for "what's on my plate".
- `hub_focus`: the distilled answer to "what should I be doing": `{ now,
  needs, more, calendar: { current, next } }`, the task the user said they
  are working on, the short list of what needs them and the calendar now and
  next ([FocusService](focus/FocusService.md)).
- `hub_list_summaries`: the activity feed distilled by context, `{ cards,
  status }`: one card per company or area with a headline, a short summary,
  whether someone is waiting on the user and why, and the items behind it,
  each item cut down to `{ id, app, kind, title, lastAt, priority, taskId }`
  ([ActivitySummarizer](summary/ActivitySummarizer.md)). The one to read
  before `hub_list_threads` to understand what is going on.
- `hub_list_contexts`: the user's contexts with the rules that file
  accounts, tabs, calendars and trackers under each
  ([ContextService](context/ContextService.md)).
- `hub_list_contacts { query, limit = 50 }`: the people the Hub has seen in
  the user's activity, `{ contacts, suggestions }`: each contact with every
  way they appear (app, name or address, context), plus the pairs that may
  be the same person ([ContactService](contacts/ContactService.md)). It is
  how the model recognises that a Slack name and a mail sender are one
  person.
- `hub_snapshot_thread { id, force? }`: reads the conversation behind an
  activity item from the user's own signed-in tab (more than the
  notification's one line) and keeps it: `{ success: true, snapshot }` with
  the text, where it was read from and when
  ([ConversationReader](snapshot/ConversationReader.md)). When nothing could
  be read it replies `success: false` with the reason as the error (the tab
  is showing something else, or is not open; `Nothing could be read.` when
  no reason came). `force` reads again even when a snapshot of the latest
  activity exists. The one to call before judging whether an item needs the
  user. It is not marked mutating: it only reads the user's session.
- `hub_list_events { days | from, to }`, `hub_sync_status`, `hub_list_columns`.
- `hub_list_threads { state, app, since, limit = 50 }`: the activity feed,
  newest first, each item with its `kind` (chat, mail, calendar, task, other).
  `state` is `active` (default: everything not dismissed), `dismissed` or
  `all` (`THREAD_STATES` maps `dismissed` to the stored `done`; a legacy state
  passes through); `since` is an ISO time. `hub_get_thread { id }`: one item
  with the notifications behind it.
- `hub_list_notifications { app, since, limit = 100, offset }`: the raw
  intercepted-notification log, newest first. The Dashboard snapshot
  ([HubContext](HubContext.md)) carries only today's, so this is how the model
  reaches earlier days.
- `hub_list_tasks { columnKey, sourceId, includeArchived, includeHidden }`,
  `hub_get_task { id }`.
- Mutating (the approval gate applies): `hub_set_focus_task { id }` (the
  task the user is working on now, shown at the top of their Focus view; an
  empty id clears it; only when the user says what they are working on;
  replies with the focus view), `hub_merge_contacts { intoId, fromId }`
  (records that two contacts are the same person: everything `fromId` goes
  by moves to `intoId`; only when the user confirms it; replies with the
  merged `contact`), `hub_set_thread_state { id, state }`
  (`done` dismisses an item from the feed, `open` puts it back; only when the
  user asks, since items do not need clearing and new activity brings a
  dismissed one back), `hub_enrich_thread` (by id, or app + threadKey; creates
  the item when missing; takes `kind` beside the summary, priority, labels,
  title and context), `hub_create_task` (async; local, or with `sourceId` and optional
  `listId` created in that ClickUp workspace too, assigned to the user; when
  the column has no linked status in that list it replies `success: false`
  with `needsStatus`, `statuses` and `column`, and a second call with
  `status` creates it and links the status), `hub_update_task`,
  `hub_move_task { id, columnKey, status?, beforeId? }` (`beforeId` places it
  before that task in the column and also reorders within its own column;
  omitted, it lands at the end; a ClickUp task whose column has
  no linked status in its list replies `moved: false` with `needsStatus` and
  `statuses`; nothing moves until it is called again with `status`, which is
  linked), `hub_link_status { status, columnKey?, newColumn? }` (links a
  status that has no column to `columnKey`, or with `newColumn` makes it a
  column of its own; its tasks move there), `hub_hide_tasks { ids, hidden = true }`
  (returns `changed`; hidden tasks stay synced), `hub_add_task_message`
  (author `agent`), `hub_link_thread_task` (an item to an existing task; an
  empty `taskId` unlinks),
  `hub_thread_to_task { threadId, columnKey?, sourceId?, listId?, status? }`
  (makes a board task from an activity item and links the two in one step:
  `{ task, thread, created }`; an item that already has a task answers that
  task; like `hub_create_task` it replies `success: false` with `needsStatus`
  when the column has no linked status in that list), `hub_sync_now`.

## Methods (static)

- `handle(api, toolName, args = {})`: throws `The Hub is not active` without
  an API and `Unknown hub tool: <name>`; otherwise the handler's
  `{ success, ... }` result.

## Why `hub_enrich_thread`

The activity feed is meant to be enriched by agents: a background run (or
n8n) reads the raw notifications of an item and writes back a summary,
priority, labels and kind, which is what the activity widget and
`hub_overview` show.
