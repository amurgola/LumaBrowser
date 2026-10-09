# ClickUpClient

`extensions/personal-hub/board/ClickUpClient.js`

Thin REST client over the ClickUp v2 API (`https://api.clickup.com/api/v2`)
with a personal API token sent as the raw `Authorization` header (no Bearer
prefix, which is how ClickUp personal tokens work).

## Methods

- `new ClickUpClient({ token, fetchImpl?, now?, sleep? })`; throws without a
  token. `fetchImpl` defaults to the global `fetch`.
- `me()` -> `{ id, username, email }` (ids are strings).
- `teams()`, `spaces(teamId)`, `folders(spaceId)`, `folderLists(folderId)`,
  `folderlessLists(spaceId)`, `list(listId)`, `listMembers(listId)`: the
  matching GET endpoints, archived items excluded.
- `listTasks(listId, { assigneeIds, includeClosed, subtasks = true })`: every
  page of the list's tasks (`assignees[]`, `include_closed`, `subtasks`,
  `page`), paging until `last_page` is true or a page is short of 100.
- `taskComments(taskId)`; `postComment(taskId, text)` posts
  `{ comment_text, notify_all: false }`; `createTask(listId, body)` POSTs
  `/list/{listId}/task`; `updateTask(taskId, body)` is a PUT.

## Behaviour

- Every request has a 20 s timeout (AbortController).
- A 429 is retried once after `Retry-After` seconds (capped at 30 s, 2 s when
  the header is missing); a second 429 is an error.
- Any non-2xx throws `ClickUp API <status> [<ECODE>]: <err>` so a failed sync
  shows ClickUp's own reason.
