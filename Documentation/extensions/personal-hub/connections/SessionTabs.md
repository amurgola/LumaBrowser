# SessionTabs

`extensions/personal-hub/connections/SessionTabs.js`

The Hub's view of the user's persisted tabs over `context.browser` (through
`getTabManager().tabViewManager`). Persisted tabs restored from older profiles
each live in their own partition (`persist:main-<n>`), one account per tab, so
everything the Hub reads through a tab is keyed by that partition rather than
the shared `persist:main`. Without a browser (tests, stdio tools) it reports
no tabs and opens nothing.

## Methods

- `new SessionTabs({ browser, getCookies })`: `getCookies` defaults to
  [SessionCookies](../calendar/session/SessionCookies.md)`.reader()`.
- `available()`: whether the tab layer is reachable.
- `persisted()`: `[{ tabId, partition, url, host, title, hidden, active, loading }]`.
- `cookies(partition, domain)`: the partition's cookies for a domain (`[]` on failure).
- `run(tabId, code, { gesture })`: `executeJavaScript` in the tab's page;
  rejects when the tab is gone.
- `wake(tabId)`: the keep-alive sweep's focus and `visibilitychange` poke
  (`WAKE_JS`), as a user gesture, so apps that renew tokens on focus do so.
- `reload(tabId)`: reloads and waits for the load (`LOAD_TIMEOUT_MS`).
- `show(tabId)`: brings a hidden persisted tab into the strip and focuses it.
- `openPersisted(url, now?)`: opens `url` in a new tab in a fresh partition
  `persist:hub-<base36 time>` and persists it, so a second account never mixes
  with the first. Resolves `{ success, tabId, partition }`.
- `onNavigated(listener)`: `listener({ tabId, url })` on every tab navigation;
  returns the unsubscribe function.
- `hostOf(url)` (static): the lowercase hostname, or `''`.
