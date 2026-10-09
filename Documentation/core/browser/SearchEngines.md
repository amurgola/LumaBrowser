# SearchEngines

`core/browser/SearchEngines.js`

The search engines offered by the omnibox and the page context menu, and the
one place that knows their query URLs.

## Methods

- `SearchEngines.ENGINES` is the engine table: `{ id, name, url, home }`, where
  `url` holds a `%s` placeholder for the query. Callers that hand it to the
  renderer should copy the entries.
- `SearchEngines.DEFAULT_ID` is `'duckduckgo'`.
- `SearchEngines.SETTINGS_KEY` is `'searchEngine'`, the settings db key that
  stores the chosen engine id.
- `SearchEngines.byId(id)` returns the engine, or the default engine for an
  unknown id.
- `SearchEngines.urlFor(id, query)` returns the results URL for the trimmed,
  URI-encoded query on that engine (default engine when unknown).
- `SearchEngines.currentId(db)` reads the configured id from a settings db
  (`{ get(key, fallback) }`) and returns a valid engine id. A missing db, a db
  without `get`, or a throwing db all yield the default.

## Why one table

The renderer's omnibox (via the `settings:search-url` IPC) and the page
context menu both resolve through `urlFor`, so there is one place that knows
the query URLs.
