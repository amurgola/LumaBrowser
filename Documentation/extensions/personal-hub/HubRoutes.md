# HubRoutes

`extensions/personal-hub/HubRoutes.js`

The Hub's REST routes under `/api/hub` (`routes.js` mounts them): the OAuth
callback a sign-in tab lands on, and the token-guarded endpoints an automation
such as n8n uses to push activity items, enrich them and read or change the
board.

## Routes

- `GET /oauth/callback?state&code&error`: no token; `completeOAuth` and a
  small "Signed in" page (400 with the reason on failure).
- Everything below needs `Authorization: Bearer <hub token>` or
  `X-Hub-Token: <hub token>` ([InboundToken](InboundToken.md)); otherwise 401.
- `POST /queue` (an activity item) body `{ app, threadKey?, title, summary?,
  priority?, participants?, url?, labels?, kind?, context?, body?, sender?,
  at? }` -> `{ thread, notification }`. `kind` is chat, mail, calendar, task or
  other; left out, it is read from the app.
- `POST /threads/enrich` body `{ id }` or `{ app, threadKey }` plus
  `{ title?, summary?, priority?, labels?, kind?, context?, participants?, url?, taskId?, state? }` -> `{ thread }`.
- `GET /threads?state&app&since&limit&offset` (`state` defaults to `active`,
  everything not dismissed; `since` is an ISO time), `GET /threads/:id`,
  `POST /threads/:id/state { state, snoozeUntil? }`.
- `GET /columns`, `GET /tasks?columnKey&sourceId&includeHidden=true`,
  `POST /tasks` (201, awaits creation; `sourceId` and `listId` create it in
  that tracker too; when the column has no status in that list it is a 400
  with `needsStatus` and `statuses`, and `status` in the body picks one), `POST /tasks/hide { ids, hidden? }` -> `{ changed }`,
  `GET /tasks/:id`, `PATCH /tasks/:id`, `POST /tasks/:id/move { columnKey,
  status?, beforeId? }` (`beforeId` places the task before that one, `null` at
  the end, and reorders within its own column; `moved: false` with `needsStatus` and `statuses` when a ClickUp
  task's column has no linked status in its list; send again with `status`),
  `POST /statuses/link { status, columnKey }` or `{ status, newColumn: true }`
  (merge a status with no column into a column, or make it a column; the
  latter replies `{ column }`),
  `POST /tasks/:id/messages { body, author? }` (201).
- `GET /events?days` or `?from&to`, `POST /sync { kind?, sourceId? }`, `GET /status`.

Replies are `{ success: true, ...payload }`; a thrown error or a
`{ success: false }` result is a 400 with `error`.

## Why a second token

The gateway's API key (when required) already uses the Authorization header,
so the Hub token is also accepted in `X-Hub-Token`. The token keeps an
automation's write access to the activity feed and board separate from the app-wide
API key.
