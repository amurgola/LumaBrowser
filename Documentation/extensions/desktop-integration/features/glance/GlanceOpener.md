# GlanceOpener

`extensions/desktop-integration/features/glance/GlanceOpener.js`

Behind `POST /api/desktop/glance/open` (see [glance](index.md)).

- `open({ target, id })` -> `{ status, body }` (the JSON envelope).
- Always raises the main window first (`deps.windows.focusMainWindow()`).
- `hub`: `deps.services.dashboard.ensureTab({ activate: true })`, the
  Dashboard service that [ExtensionHost](../../../../../app/services/ExtensionHost.md)
  exposes to extensions as `sharedServices.dashboard`.
- `event`: found with the Hub's `listEvents` over the last 7 and next 30 days;
  `thread`: `getThread(id).thread`; `task`: `getTask(id).task`. Without `id`,
  the glance's current or next event, newest thread or first task due.
- An item with a `url` opens it through the Hub's `openUrl` (a new user tab),
  else `deps.browser.createTab(url, { kind: 'user' })`; without a `url`, the
  Dashboard.
- Statuses: 400 bad target, 404 unknown id, 503 when nothing could be opened.
