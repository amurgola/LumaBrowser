# PageContextActions

`core/llm-server/ipc/PageContextActions.js`

The chat composer's "ask about a tab" and "@dashboard", over the agent deps'
`browserService` (which exists only once the browser has booted) and the
Dashboard. Lists the user's open web tabs, reads one tab's page as text, or
reads the Dashboard's placed widgets as text, so the next prompt can carry it.

## Methods

- `new PageContextActions(deps, { snapshot })`: `deps` is
  [LlmIpcDeps](LlmIpcDeps.md); its optional `dashboardService` and
  `getExtensionManager` collaborators (and the agent deps' artifact stores)
  build the [DashboardSnapshot](../../dashboard/DashboardSnapshot.md), which
  `snapshot` overrides in tests.
- `listTabs()` -> `{ tabs: [{ id, title, url, favicon, lastActivatedAt }] }`:
  `http`, `https` and `file` pages only (no internal or error pages), most
  recently viewed first (`lastActivatedAt`), at most 40. `{ tabs: [] }` before
  the browser boots.
- `readTab(tabId)` -> `{ tab: { id, title, url }, text, chars, truncated }`:
  `getSource` as markdown, plain text when that throws or comes back empty,
  trimmed and capped at 60,000 characters (`chars` is the full length).
  Failures: `The browser is not ready yet.`, `That tab is no longer open.` (also
  for a tab that is not a listed web page), `The page has no readable text.`.
- `readDashboard()` -> `DashboardSnapshot.read()`:
  `{ title, text, chars, truncated, at, widgets }`, or `{ success: false,
  error }` (`The Dashboard is not available.` on a boot without a dashboard
  service, `The Dashboard has no widgets yet. ...` when nothing is placed).

## Globals

None.
