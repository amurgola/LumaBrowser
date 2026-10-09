# TaskProvider

`extensions/personal-hub/board/TaskProvider.js`

Base class for the remote task trackers the Hub board imports from.

## Methods

- `static KIND`: the source kind the provider answers (`'clickup'`).
- `validateConfig(config)`: an error string when the source config cannot be
  synced, else `null`.
- `async discover({ token, fetchImpl })`: what the token can see, for the
  settings UI to pick lists from.
- `async resolveAssignee({ token, config, fetchImpl })`: the remote user id the
  config names (`'me'` or a name/email), or `null`.
- `async fetchTasks(source, { token, fetchImpl, shouldFetchComments(mapped) })`:
  `[{ remoteId, title, description, status, statusType, statusColor, priority,
  dueAt, url, listId, listName, spaceName, assignees: [{ id, name }], tags: [string],
  remoteUpdatedAt, comments: [{ remoteId, author, body, at }] | null }]`;
  comments are fetched only when `shouldFetchComments` says so.
- `async describeLists({ token, listIds, fetchImpl })` -> `[{ id, name,
  statuses: [{ status, type, color }] }]` for the given lists, in that order.
- `async createTask({ token, listId, fields, fetchImpl })`: creates a task in
  one list and resolves it mapped like a `fetchTasks` entry (comments `null`).
- `async pushStatus({ token, remoteId, status, fetchImpl })`.
- `async postComment({ token, remoteId, text, fetchImpl })` resolves `{ remoteId }`.
- `async pushFields({ token, remoteId, fields: { title?, description? }, fetchImpl })`.

## Why

[BoardService](BoardService.md) only ever talks to this shape, so a second
tracker (Jira, Linear) is a new subclass registered in the providers map, not
a change to the board.
