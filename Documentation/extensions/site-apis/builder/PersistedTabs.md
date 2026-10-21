# PersistedTabs

`extensions/site-apis/builder/PersistedTabs.js`

The user's persisted tabs as the builder lists them, read from the TabViewManager behind `context.browser`
(`getTabManager().tabViewManager.getPersistedTabs()` plus `getEntry(id).partition`), the same walk
`SiteApiService.persistedTabFor` and the Hub's `SessionTabs.persisted` do.

## Methods

- `list(browser)`: `[{ tabId, partition, origin, url, title }]` of the persisted tabs with an http(s) origin;
  `[]` without a browser. The partition defaults to `persist:main`.
- `find(browser, tabId)`: one entry or null.
