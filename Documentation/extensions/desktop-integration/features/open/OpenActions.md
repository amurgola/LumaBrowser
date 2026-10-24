# OpenActions

`extensions/desktop-integration/features/open/OpenActions.js`

What the [open feature](index.md) does. Every action answers
`{ status, body }` with `body` in the Desktop Integration envelope.

- `new OpenActions(deps)`: uses `deps.browser`, `deps.windows`,
  `deps.handoff`, `deps.services.database` (the settings db) and
  `deps.settings`.
- `searchEngine() -> { id, name, url }`: the engine Luma's omnibox uses
  (`SearchEngines.currentId(db)`, see
  [SearchEngines](../../../../core/browser/SearchEngines.md)).
- `searchUrl(query)`: its results url for `query`.
- `openUrl(url, { unwrap = true, focus })`: unwraps through
  [LinkUnwrap](LinkUnwrap.md) when `unwrap` and the `unwrapLinks` setting are
  on (a Bing search turns into `search()` while `bingSearchesAsQuery` is on);
  otherwise requires an `http`/`https` url. Opens it with
  `browser.createTab(url, { kind: 'user' })`, then raises the window when
  `focus` (default: the `focusWindow` setting). 200
  `{ success, action: 'url', url, tabId, focused, from? }`.
- `search(query, { focus, from })`: 200
  `{ success, action: 'query', query, url, engine, tabId, focused, from? }`.
- `ask(prompt, { source })`: `handoff.open({ prompt, autoSend: <askAutoSend>, source })`.
  200 `{ success, action: 'ask', conversationId, autoSent }`.

Failures: 400 bad input (empty, too long: url 8192, query 2048, ask 100000;
non-web scheme), 503 no browser or no handoff, 500 `createTab` failed or
threw, 502 the handoff answered `success: false`.
