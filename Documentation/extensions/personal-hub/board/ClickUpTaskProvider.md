# ClickUpTaskProvider

`extensions/personal-hub/board/ClickUpTaskProvider.js`

The ClickUp implementation of [TaskProvider](TaskProvider.md) (`KIND =
'clickup'`), built on [ClickUpClient](ClickUpClient.md).

## Source config

```
{ listIds: [string], listScopes?: { [listId]: 'mine' | 'mine-or-unassigned' | 'all' },
  assignee: 'me' | '<username or email>', assigneeId?: string,
  includeClosed: false, statusMap: { [columnKey]: 'remote status name' },
  statusColumns?: { [normalizedStatus]: columnKey }, statusLabels?: { [normalizedStatus]: 'Status' } }
```

`statusColumns` and `statusLabels` are the links the board makes (see
[StatusMapping](StatusMapping.md)); the provider does not read them.

`validateConfig` requires a non-empty `listIds` of strings and every `listScopes` value to be one of
`SCOPES`. `assigneeId` is
filled in by the board after the first `resolveAssignee`, so later syncs skip
the member lookup.

## Methods

- `new ClickUpTaskProvider({ clientFactory? })`: the factory
  `({ token, fetchImpl }) => client` is a test seam.
- `discover({ token })` -> `{ user, teams: [{ id, name, spaces: [{ id, name,
  lists: [{ id, name, folder, statuses }] }] }] }`: folder lists then folderless
  lists per space; `statuses` are the list's status names when ClickUp sends them.
- `resolveAssignee({ token, config })`: `'me'` (or blank) resolves to the token
  owner; otherwise the first list member whose username or email matches
  case-insensitively across the config lists; `null` when nobody does.
- `fetchTasks(source, { token, shouldFetchComments })`: the tasks of every list by
  its scope (`scopeOf(config, listId)`, default `mine`): `mine` asks ClickUp for
  `config.assigneeId`'s tasks; `mine-or-unassigned` fetches the whole list and keeps
  tasks with no assignee or assigned to that id; `all` keeps every task. Mapped to
  the provider shape. `dueAt` and
  `remoteUpdatedAt` convert ClickUp's millisecond strings to ISO; `spaceName`
  is the folder name only when the folder is not hidden; comments are fetched
  per task only when `shouldFetchComments(mapped)` returns true, else `null`.
  Mapped tasks carry `statusColor` (ClickUp's status colour) and `listId`.
- `describeLists({ token, listIds })` -> `[{ id, name, statuses: [{ status,
  type, color }] }]`, one `GET /list/{id}` per list.
- `createTask({ token, listId, fields: { title, description?, status?,
  assigneeId? } })` -> `POST /list/{id}/task` with `name`, `description`,
  `status` (left out when blank so ClickUp uses the list's default) and
  `assignees: [assigneeId]`; resolves the mapped task (`listId` falls back to
  the one asked for, `comments: null`).
- `pushStatus` -> `PUT /task/{id} { status }`; `postComment` -> `{ remoteId }`
  of the new comment; `pushFields` -> `{ name?, description? }` (a no-op when
  nothing changed).
