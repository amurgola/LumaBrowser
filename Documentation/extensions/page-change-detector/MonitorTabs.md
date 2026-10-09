# MonitorTabs

`extensions/page-change-detector/MonitorTabs.js`

Finds, opens and waits on the tab a monitor reads.

## Methods

- `new MonitorTabs(browser, { sleep? })`: `browser` is the core BrowserService.
- `findExisting(url, { includeSilent = true })`: id of the first tab whose URL
  starts with `url`, or null. Lists through `browser.getTabManager().getAllTabs`
  so hidden (silent) tabs can be included; falls back to `browser.getTabs()`.
- `findOrCreate(url, { silent, allowSilentMatch })`: an existing match, else a
  new tab (`silent` keeps it off the tab bar). Throws `Failed to create tab for <url>`.
- `waitForLoad(tabId, timeoutMs)`: polls `document.readyState` every 500 ms;
  returns at `complete` or at the timeout (a slow page is still checked).
- `bringToFront(tabId)`: best-effort `updateTab(tabId, { type: 'activate' })`.
