# TaskSourcesSection

`extensions/personal-hub/ui/settings/TaskSourcesSection.js`

The Hub settings tab's task trackers: the ClickUp workspaces the board
imports from, with the add and edit form (API token, assignee, a discovered
team > space > list tree, closed tasks, interval) and the column-to-status
map.

## Behaviour

- Rows: status dot and text ([SourceStatus](SourceStatus.md)), label,
  `ClickUp` badge, list count, and `Sync now` (`syncNow { kind: 'tasks',
  sourceId }`), `Edit lists`, `Remove` (confirms).
- A row whose source has status links (made on the board by merging a lane,
  making a column, or picking a status on a move) adds the line
  `Linked statuses: <status> -> <column title>, ...` (static `linksText(source,
  columns)`, using `config.statusLabels` for the status spelling) and a
  `Reset links` button that confirms, then calls `resetStatusLinks(id)`.
  `setColumns` re-renders the list so the column titles stay current.
- `Load lists` calls `discoverTaskSource` with `{ token }` (the typed token)
  or, while editing, `{ sourceId }` so the saved token is used; without either
  it says `Enter the API token first.`. The reply's `teams[].spaces[].lists[]`
  render as a checkbox tree (folder in brackets), each list with a scope select
  (`LIST_SCOPES`: Assigned to me, Mine + unassigned, All tasks) that is enabled
  only while the list is ticked; the note reads `Signed in as <username>`.
- The status map (one text input per board column, with a datalist of the
  statuses of the ticked lists) appears once a list is ticked. Columns come
  from `setColumns(columns)` (the tab passes the saved columns).
- `Add workspace` sends `addTaskSource({ kind: 'clickup', label, intervalMs,
  config: { token, listIds, listScopes, assignee, includeClosed, statusMap } })`
  (`listScopes` holds only ticked lists whose scope is not the default);
  editing sends `updateTaskSource(id, input)` with `config.token` only when a
  new one was typed. Validation: a label, a token when adding, at least one
  list.
- Edit pre-fills the form from the source, pre-ticks its lists and its saved
  status map; Cancel resets to the add form.

## IPC

`listTaskSources`, `addTaskSource(input)`, `updateTaskSource(id, patch)`,
`removeTaskSource(id)`, `discoverTaskSource({ token } | { sourceId })`,
`syncNow(opts)`, `resetStatusLinks(sourceId)`.
