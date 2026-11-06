# BrowsingDataClearer

`core/browser-data/BrowsingDataClearer.js`

"Clear browsing data". History and the downloads list follow the time range (`hour`, `day`, `week`, `month` (28
days), `all`). Cookies and site data (`clearStorageData`) and the cache always clear entirely, since Electron cannot
clear them by age. They are cleared on the shared `persist:main` session and every session a regular browsing tab
uses (older persisted tabs, private windows). Internal app pages keep their data.

## Methods

- `new BrowsingDataClearer({ history, getTabViewManager, sessionFor, now })`.
- `clear({ range, history, cookies, cache, downloads })` -> `{ success, cleared: ['history', 'downloads',
  'cookies', 'cache'] }`.
